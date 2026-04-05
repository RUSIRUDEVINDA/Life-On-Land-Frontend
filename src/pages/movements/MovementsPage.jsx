import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListPaginationFooter from '../../components/common/ListPaginationFooter';
import { getMovements, getMovementSummary } from '../../features/movements/api/movementsApi';
import MovementStats from '../../features/movements/components/MovementStats';
import MovementFilters from '../../features/movements/components/MovementFilters';
import MovementTable from '../../features/movements/components/MovementTable';
import ZoneDensity from '../../features/movements/components/ZoneDensity';
import { fetchProtectedAreas, fetchZonesByProtectedArea } from '../../features/incidents/api/incidentsApi';

const movementToIdString = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value._id || value.id || '';
    return String(value);
};

const MOVEMENTS_EXPORT_PAGE_SIZE = 50;

const MovementsPage = () => {
    const [movements, setMovements] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [search, setSearch] = useState('');
    const [timeRangeHours, setTimeRangeHours] = useState(24);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [areaLookup, setAreaLookup] = useState({});
    const [zoneLookup, setZoneLookup] = useState({});

    const getDateRangeParams = useCallback(() => {
        const hours = Number(timeRangeHours);
        if (!Number.isFinite(hours) || hours <= 0) return {};
        const now = new Date();
        const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
        return { from: from.toISOString(), to: now.toISOString() };
    }, [timeRangeHours]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const dateRange = getDateRangeParams();
            const [movData, sumData] = await Promise.all([
                getMovements({
                    page: pagination.page,
                    limit: pagination.limit,
                    tagId: search,
                    ...dateRange,
                }),
                getMovementSummary(dateRange),
            ]);

            setMovements(movData?.data || []);
            if (movData?.pagination) {
                setPagination((prev) => ({ ...prev, ...movData.pagination }));
            }
            setSummary(sumData);
        } catch (err) {
            console.error('Failed to fetch movement data:', err);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, getDateRangeParams]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, [search, timeRangeHours]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const protectedAreas = await fetchProtectedAreas();
                const areaMap = {};
                protectedAreas.forEach((area) => {
                    if (area?.id) areaMap[area.id] = area.name || 'Unknown Area';
                });
                setAreaLookup(areaMap);

                const zoneLists = await Promise.all(
                    protectedAreas.map((area) => fetchZonesByProtectedArea(area.id).catch(() => []))
                );
                const zoneMap = {};
                zoneLists.flat().forEach((zone) => {
                    const id = movementToIdString(zone?._id || zone?.id);
                    if (!id) return;
                    zoneMap[id] = zone?.name || zone?.title || 'Unknown Zone';
                });
                setZoneLookup(zoneMap);
            } catch (err) {
                console.error('Failed to load area/zone lookups:', err);
            }
        };

        loadLookups();
    }, []);

    const enrichMovementRows = useCallback(
        (raw) =>
            raw.map((move) => {
                const protectedAreaId = movementToIdString(move?.protectedAreaId || move?.protectedArea);
                const zoneId = movementToIdString(move?.zoneId || move?.zone);
                return {
                    ...move,
                    protectedAreaName:
                        move?.protectedAreaName ||
                        move?.protectedArea?.name ||
                        areaLookup[protectedAreaId] ||
                        'Unknown Protected Area',
                    zoneName:
                        move?.zoneName ||
                        move?.zone?.name ||
                        zoneLookup[zoneId] ||
                        'Unknown Zone',
                };
            }),
        [areaLookup, zoneLookup]
    );

    const displayMovements = useMemo(
        () => enrichMovementRows(movements),
        [movements, enrichMovementRows]
    );

    const handleExportQueue = async () => {
        if (pagination.total <= 0 && movements.length === 0) return;
        const tagId = search.trim();
        setExporting(true);
        try {
            const dateRange = getDateRangeParams();
            const first = await getMovements({
                page: 1,
                limit: MOVEMENTS_EXPORT_PAGE_SIZE,
                tagId,
                ...dateRange,
            });
            const allRaw = [...(first.data || [])];
            const totalPages = Math.max(1, Number(first.pagination?.pages) || 1);
            for (let p = 2; p <= totalPages; p += 1) {
                const res = await getMovements({
                    page: p,
                    limit: MOVEMENTS_EXPORT_PAGE_SIZE,
                    tagId,
                    ...dateRange,
                });
                allRaw.push(...(res.data || []));
            }
            const rows = enrichMovementRows(allRaw);
            const { exportMovementsQueueToPdf } = await import(
                '../../features/movements/utils/exportMovementsQueuePdf'
            );
            const result = exportMovementsQueueToPdf(rows, { searchTerm: tagId });
            if (!result.ok) {
                window.alert(result.message);
            }
        } catch (err) {
            console.error('Movements PDF export failed:', err);
            const hint =
                err?.message && /Failed to fetch dynamically imported module|Loading chunk/i.test(err.message)
                    ? ' If you just cloned the repo, run npm install and reload the page.'
                    : '';
            window.alert(`Could not generate the PDF. Please try again.${hint}`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-enter">
            <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                    <h1 className="text-[22px] font-bold text-primary-dark tracking-tight leading-none">Telemetry Intelligence</h1>
                    <p className="text-text-gray text-[12px] font-medium mt-1">Real-time geospatial tracking and movement analytics.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handleExportQueue}
                        disabled={loading || exporting || (pagination.total <= 0 && movements.length === 0)}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary-medium bg-white px-4 py-2.5 text-[13px] font-bold text-primary-dark shadow-sm transition hover:bg-primary-light/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowUpRight size={16} />
                        {exporting ? 'Exporting…' : 'Export Queue'}
                    </button>
                    <div className="relative">
                        <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-medium" />
                        <select
                            value={timeRangeHours}
                            onChange={(event) => setTimeRangeHours(Number(event.target.value))}
                            className="appearance-none bg-white border border-border-light pl-9 pr-9 py-2.5 rounded-xl text-[13px] font-bold text-primary-dark shadow-sm hover:bg-bg-soft hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <option value={24}>Last 24 Hours</option>
                            <option value={48}>Last 48 Hours</option>
                            <option value={72}>Last 72 Hours</option>
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-text-gray">▾</span>
                    </div>
                    <Link to="/dashboard/map-tracking" className="bg-primary-dark text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-elevated hover:bg-black hover:-translate-y-0.5 transition-all duration-300">
                        <Zap size={16} className="text-primary-medium animate-pulse" /> Map Tracking
                    </Link>
                </div>
            </div>

            <MovementStats movements={displayMovements} summary={summary} />

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden flex flex-col transition-all duration-500">
                    <MovementFilters
                        search={search}
                        onSearchChange={setSearch}
                        pageSize={pagination.limit}
                        onPageSizeChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
                    />
                    <MovementTable movements={displayMovements} loading={loading} />
                    {!loading && pagination.total > 0 && (
                        <div className="border-t border-border-light px-5 py-3">
                            <ListPaginationFooter
                                totalItems={pagination.total}
                                pageSize={pagination.limit}
                                currentPage={pagination.page}
                                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                                countSuffix="records"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    <ZoneDensity summary={summary} zoneLookup={zoneLookup} areaLookup={areaLookup} />
                </div>
            </div>
        </div>
    );
};

export default MovementsPage;
