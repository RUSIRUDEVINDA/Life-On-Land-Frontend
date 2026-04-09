import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListPaginationFooter from '../../components/common/ListPaginationFooter';
import MovementStats from '../../features/movements/components/MovementStats';
import MovementFilters from '../../features/movements/components/MovementFilters';
import MovementTable from '../../features/movements/components/MovementTable';
import ZoneDensity from '../../features/movements/components/ZoneDensity';
import { useQueries } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import { useProtectedAreas } from '../../hooks/useProtectedAreas';
import { useMovements, useMovementSummary } from '../../features/movements/hooks/useMovements';
import { getMovements } from '../../features/movements/api/movementsApi';
import { fetchZonesByProtectedArea } from '../../features/incidents/api/incidentsApi';

const movementToIdString = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value._id || value.id || '';
    return String(value);
};

const MOVEMENTS_EXPORT_PAGE_SIZE = 50;

const MovementsPage = () => {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [timeRangeHours, setTimeRangeHours] = useState(24);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [exporting, setExporting] = useState(false);

    const dateRange = useMemo(() => {
        const hours = Number(timeRangeHours);
        if (!Number.isFinite(hours) || hours <= 0) return {};
        const now = new Date();
        const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
        return { from: from.toISOString(), to: now.toISOString() };
    }, [timeRangeHours]);

    const { data: movData, isLoading: movLoading } = useMovements({
        page: pagination.page,
        limit: pagination.limit,
        tagId: search,
        ...dateRange,
    });

    const { data: summary, isLoading: sumLoading } = useMovementSummary(dateRange);
    const { data: protectedAreas = [] } = useProtectedAreas();

    // Batch fetch zones for all areas
    const zonesQueries = useQueries({
        queries: protectedAreas.map(area => ({
            queryKey: ['zones', area.id],
            queryFn: () => fetchZonesByProtectedArea(area.id).catch(() => []),
            enabled: !!area.id,
        }))
    });

    const loading = movLoading || sumLoading;

    // Build Lookups from query data
    const { areaLookup, zoneLookup } = useMemo(() => {
        const areaMap = {};
        const zoneMap = {};

        protectedAreas.forEach((area) => {
            if (area?.id) areaMap[area.id] = area.name || 'Unknown Area';
        });

        zonesQueries.forEach(zq => {
            if (zq.data) {
                zq.data.forEach(zone => {
                    const id = movementToIdString(zone?._id || zone?.id);
                    if (!id) return;
                    zoneMap[id] = zone?.name || zone?.title || 'Unknown Zone';
                });
            }
        });

        return { areaLookup: areaMap, zoneLookup: zoneMap };
    }, [protectedAreas, zonesQueries]);

    const enrichMovementRows = useCallback(
        (raw) =>
            raw.map((move) => {
                const paId = movementToIdString(move?.protectedAreaId || move?.protectedArea);
                const zId = movementToIdString(move?.zoneId || move?.zone);
                return {
                    ...move,
                    protectedAreaName: move?.protectedAreaName || move?.protectedArea?.name || areaLookup[paId] || 'Unknown Protected Area',
                    zoneName: move?.zoneName || move?.zone?.name || zoneLookup[zId] || 'Unknown Zone',
                };
            }),
        [areaLookup, zoneLookup]
    );

    const displayMovements = useMemo(
        () => enrichMovementRows(movData?.data || []),
        [movData, enrichMovementRows]
    );
    const totalCount = movData?.pagination?.total || 0;
    const totalLogs = useMemo(
        () => Math.max(totalCount, displayMovements.length),
        [totalCount, displayMovements.length]
    );

    const handleExportQueue = async () => {
        if (!movData || totalCount <= 0) return;
        const tagId = search.trim();
        setExporting(true);
        try {
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
                toast.info({
                    title: 'Nothing to export',
                    message: result.message,
                });
            } else {
                toast.success({
                    title: 'PDF ready',
                    message: 'The movement queue export has been generated.',
                });
            }
        } catch (err) {
            console.error('Movements PDF export failed:', err);
            toast.error({
                title: 'Export failed',
                message: 'Could not generate the PDF. Please try again.',
            });
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, [search, timeRangeHours]);

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
                        disabled={loading || exporting || totalCount === 0}
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

            <MovementStats
                movements={displayMovements}
                summary={summary}
                totalLogs={totalLogs}
                timeRangeHours={timeRangeHours}
            />

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden flex flex-col transition-all duration-500">
                    <MovementFilters
                        search={search}
                        onSearchChange={setSearch}
                        pageSize={pagination.limit}
                        onPageSizeChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
                    />
                    <MovementTable movements={displayMovements} loading={loading} />
                    {!loading && totalCount > 0 && (
                        <div className="border-t border-border-light px-5 py-3">
                            <ListPaginationFooter
                                totalItems={totalCount}
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