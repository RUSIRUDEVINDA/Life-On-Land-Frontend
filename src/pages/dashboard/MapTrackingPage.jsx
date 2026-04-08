import React, { useState, useEffect, useMemo } from 'react';
import { fetchProtectedAreas, fetchRiskMapByProtectedArea } from '../../features/risk-map/api/riskMapApi';
import { getLiveMovements } from '../../features/movements/api/movementsApi';
import TelemetryMap from '../../features/movements/components/TelemetryMap';
import { Map, Activity, Layers, Bell, ShieldAlert, MapPin } from 'lucide-react';

const normalizeStatus = (value) => String(value || '').trim().toUpperCase();
const normalizeId = (value) => {
    if (value && typeof value === 'object') {
        return String(value._id || value.id || '');
    }
    return String(value || '');
};

const normalizeRiskLevel = (value) => String(value || '').trim().toUpperCase();

const getMovementAnimalStatus = (movement) =>
    movement?.animalDetails?.status ??
    movement?.animalStatus ??
    movement?.trackingStatus ??
    movement?.monitoringStatus ??
    movement?.status ??
    movement?.animal?.status ??
    movement?.animal?.monitoringStatus;

const isDeceasedMovement = (movement) =>
    normalizeStatus(getMovementAnimalStatus(movement)) === 'DECEASED';

const getMovementAreaId = (movement) =>
    normalizeId(
        movement?.protectedAreaId ||
        movement?.protectedArea?._id ||
        movement?.protectedArea?.id ||
        movement?.protectedArea
    );

const getMovementZoneId = (movement) =>
    normalizeId(movement?.zoneId || movement?.zone?._id || movement?.zone?.id || movement?.zone);

const MapTrackingPage = () => {
    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [movements, setMovements] = useState([]);
    const [zoneRiskLookup, setZoneRiskLookup] = useState({});
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        const loadAreas = async () => {
            try {
                const data = await fetchProtectedAreas();
                setAreas(data || []);
                if (data && data.length > 0) {
                    setSelectedAreaId(data[0].id);
                }
            } catch (err) {
                console.error('Failed to load areas for mapping:', err);
            }
        };

        loadAreas();
    }, []);

    const fetchAreaStats = async (areaId) => {
        setStatsLoading(true);
        try {
            const movementParams = areaId ? { protectedAreaId: areaId } : {};
            const movs = await getLiveMovements(movementParams);
            const normalizedAreaId = normalizeId(areaId);
            const filteredMovements = Array.isArray(movs)
                ? movs.filter((mv) => {
                    if (isDeceasedMovement(mv)) return false;
                    if (!normalizedAreaId) return true;
                    const movementAreaId = getMovementAreaId(mv);
                    return movementAreaId && movementAreaId === normalizedAreaId;
                })
                : [];
            setMovements(filteredMovements);
        } catch (err) {
            console.error('Failed to fetch area stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchAreaStats(selectedAreaId);
        const interval = setInterval(() => fetchAreaStats(selectedAreaId), 10000);
        return () => clearInterval(interval);
    }, [selectedAreaId]);

    useEffect(() => {
        const loadRiskMap = async () => {
            if (!selectedAreaId) {
                setZoneRiskLookup({});
                return;
            }
            try {
                const riskMap = await fetchRiskMapByProtectedArea(selectedAreaId);
                const lookup = {};
                (riskMap?.zones || []).forEach((zone) => {
                    const zoneId = normalizeId(zone?.zoneId || zone?._id || zone?.id);
                    if (!zoneId) return;
                    lookup[zoneId] = {
                        riskLevel: normalizeRiskLevel(zone?.riskLevel),
                        zoneName: zone?.zoneName || zone?.name || zone?.title || zone?.zone?.name || '',
                    };
                });
                setZoneRiskLookup(lookup);
            } catch (err) {
                console.error('Failed to load risk map:', err);
                setZoneRiskLookup({});
            }
        };

        loadRiskMap();
    }, [selectedAreaId]);

    const criticalMovements = useMemo(() => (
        movements
            .map((mv) => {
                const zoneId = getMovementZoneId(mv);
                const riskFromMovement = normalizeRiskLevel(mv?.riskLevel || mv?.risk);
                const riskFromZone = zoneId ? normalizeRiskLevel(zoneRiskLookup[zoneId]?.riskLevel) : '';
                const resolvedRisk = riskFromZone || riskFromMovement || 'LOW';
                if (resolvedRisk !== 'CRITICAL') return null;

                const tagId = mv?.tagId || mv?.animalDetails?.tagId || 'Unknown Tag';
                const species = mv?.animalDetails?.species || mv?.species || '';
                const zoneName =
                    mv?.zoneName ||
                    mv?.zone?.name ||
                    zoneRiskLookup[zoneId]?.zoneName ||
                    mv?.protectedAreaName ||
                    mv?.protectedArea?.name ||
                    'Unknown Zone';

                return {
                    id: mv?._id || mv?.id || `${tagId}-${mv?.timestamp || ''}`,
                    tagId,
                    species,
                    zoneName,
                };
            })
            .filter(Boolean)
    ), [movements, zoneRiskLookup]);

    return (
        <div className="flex flex-col gap-6 animate-enter pb-6">
            <header className="flex flex-wrap items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center shadow-elevated">
                        <Map size={24} className="text-primary-light" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-bold text-primary-dark tracking-tight leading-none">Geospatial Telemetry</h1>
                        <p className="text-text-gray text-[13px] font-medium mt-1 inline-flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statsLoading ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
                            {statsLoading ? 'Syncing...' : 'Real-time animal movement visualization'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                            className="appearance-none bg-white border border-border-light pl-10 pr-12 py-3 rounded-2xl text-[14px] font-bold text-primary-dark shadow-premium hover:border-primary-medium transition-all duration-300 outline-none min-w-[240px]"
                        >
                            <option value="">Select Conservation Area</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                        <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-medium pointer-events-none" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-y-0.5 duration-300">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#2A5A45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <button className="bg-primary-dark text-white p-3 rounded-2xl shadow-elevated hover:bg-black hover:scale-105 transition-all duration-300">
                        <Bell size={20} />
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <section className="lg:col-span-3">
                    <TelemetryMap selectedAreaId={selectedAreaId} />
                </section>

                <aside className="flex flex-col gap-6">
                    <div className="bg-primary-dark rounded-[28px] p-6 text-white shadow-premium relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-medium/20 rounded-full blur-2xl group-hover:bg-primary-medium/30 transition-all duration-700"></div>
                        <h3 className="text-[15px] font-bold flex items-center gap-2 mb-4">
                            <Activity size={18} className="text-primary-light" />
                            Tracking Status
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-primary-light/80">Satellite Link</span>
                                <span className="text-[13px] font-bold text-emerald-400">Stable</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-primary-light/80">Active Trackers</span>
                                <span className="text-[13px] font-bold">{movements.length} Active</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-primary-light/80">Latency</span>
                                <span className="text-[13px] font-bold">142ms</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[28px] p-6 border border-border-light shadow-premium flex flex-col gap-5">
                        <h3 className="text-[15px] font-bold text-primary-dark">Intelligence Insights</h3>
                        <div className="space-y-4">
                            {criticalMovements.length > 0 ? (
                                criticalMovements.slice(0, 2).map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="p-4 rounded-2xl border transition-all duration-200 bg-rose-50 border-rose-100"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 bg-rose-100">
                                                <ShieldAlert size={11} className="text-rose-600" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">
                                                Critical Movement
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-primary-dark bg-primary-light/20 px-2 py-0.5 rounded-full font-mono tracking-tight">
                                                {movement.tagId}
                                            </span>
                                            {movement.species && (
                                                <span className="text-[12px] font-semibold text-text-gray italic">
                                                    {movement.species}
                                                </span>
                                            )}
                                        </div>
                                        {movement.zoneName && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-gray mt-2">
                                                <MapPin size={9} className="shrink-0 text-primary-medium" />
                                                {movement.zoneName}
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 bg-bg-soft rounded-2xl border border-dashed border-border-light flex flex-col items-center text-center gap-2">
                                    <Activity size={20} className="text-primary-medium opacity-20" />
                                    <p className="text-[12px] font-bold text-primary-dark opacity-40 uppercase tracking-tighter">No Critical Movements</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default MapTrackingPage;