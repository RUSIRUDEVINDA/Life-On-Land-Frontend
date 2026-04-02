import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    MapPinned,
    RefreshCw,
    Map as MapIcon,
    Layers,
    Activity,
    ChevronLeft,
} from 'lucide-react';
import IncidentMetricCard from '../../features/incidents/components/IncidentMetricCard';
import RiskMapTelemetry from '../../features/risk-map/components/RiskMapTelemetry';
import {
    fetchProtectedAreas,
    fetchRiskMapByProtectedArea,
    fetchZonesByProtectedArea,
} from '../../features/risk-map/api/riskMapApi';
import { Link, useNavigate } from 'react-router-dom';

const computePolygonCenter = (geometry) => {
    const coordinates = geometry?.coordinates;
    const outerRing = Array.isArray(coordinates) ? coordinates[0] : null;

    if (!Array.isArray(outerRing) || !outerRing.length) return null;

    let latSum = 0;
    let lngSum = 0;
    let count = 0;

    outerRing.forEach((point) => {
        if (Array.isArray(point) && point.length >= 2) {
            lngSum += Number(point[0]);
            latSum += Number(point[1]);
            count += 1;
        }
    });

    if (!count) return null;

    return {
        lat: latSum / count,
        lng: lngSum / count,
    };
};

const getZoneCenter = (zone) => {
    const geometry = zone?.geometry;
    if (!geometry) return null;

    if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
        const [lng, lat] = geometry.coordinates;
        if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
            return { lat: Number(lat), lng: Number(lng) };
        }
    }

    if (geometry.type === 'Polygon') {
        return computePolygonCenter(geometry);
    }

    return null;
};

const riskLevelStyles = {
    CRITICAL: {
        marker: '#E63946',
        glow: 'rgba(230,57,70,0.4)',
        badge: 'bg-[#ffe3e3] text-[#c92a2a] border border-[#ffc9c9]',
        label: 'bg-[#E63946] text-white',
    },
    HIGH: {
        marker: '#f76707',
        glow: 'rgba(247,103,7,0.35)',
        badge: 'bg-[#fff4e6] text-[#d9480f] border border-[#ffd8a8]',
        label: 'bg-[#f76707] text-white',
    },
    MEDIUM: {
        marker: '#fab005',
        glow: 'rgba(250,176,5,0.35)',
        badge: 'bg-[#fff9db] text-[#a07900] border border-[#ffec99]',
        label: 'bg-[#fab005] text-[#4d3a00]',
    },
    LOW: {
        marker: '#2b8a3e',
        glow: 'rgba(43,138,62,0.3)',
        badge: 'bg-[#ebfbee] text-[#2b8a3e] border border-[#c3fae8]',
        label: 'bg-[#2b8a3e] text-white',
    },
};

const RANGER_MAP_WRAPPER_CLASS =
    'min-h-[420px] h-[min(78vh,calc(100dvh-200px))] w-full rounded-[28px] overflow-hidden border border-border-light shadow-premium relative bg-bg-soft group';

const RiskMapPage = ({ rangerView = false }) => {
    const navigate = useNavigate();
    const [protectedAreas, setProtectedAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [riskZones, setRiskZones] = useState([]);
    const [riskSummary, setRiskSummary] = useState(null);
    const [zoneGeometry, setZoneGeometry] = useState([]);
    const [activePointId, setActivePointId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleUnauthorized = useCallback(
        (message) => {
            if (message?.toLowerCase().includes('unauthorized')) {
                navigate('/login');
                return true;
            }
            return false;
        },
        [navigate]
    );

    const loadProtectedAreas = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const areas = await fetchProtectedAreas();
            setProtectedAreas(areas);
            setSelectedAreaId((previous) => previous || areas[0]?.id || '');
        } catch (requestError) {
            if (handleUnauthorized(requestError.message)) return;
            setError(requestError.message || 'Unable to load protected areas');
        } finally {
            setLoading(false);
        }
    }, [handleUnauthorized]);

    const loadRiskMap = useCallback(
        async (areaId) => {
            if (!areaId) return;
            setLoading(true);
            setError('');

            try {
                const [riskResponse, zones] = await Promise.all([
                    fetchRiskMapByProtectedArea(areaId),
                    fetchZonesByProtectedArea(areaId),
                ]);

                setRiskZones(riskResponse.zones || []);
                setRiskSummary(riskResponse.summary || null);
                setZoneGeometry(zones || []);
            } catch (requestError) {
                if (handleUnauthorized(requestError.message)) return;
                setRiskZones([]);
                setRiskSummary(null);
                setZoneGeometry([]);
                setError(requestError.message || 'Unable to fetch risk map data');
            } finally {
                setLoading(false);
            }
        },
        [handleUnauthorized]
    );

    useEffect(() => {
        loadProtectedAreas();
    }, [loadProtectedAreas]);

    useEffect(() => {
        if (!selectedAreaId) return;
        loadRiskMap(selectedAreaId);
    }, [selectedAreaId, loadRiskMap]);

    const riskRowsByZoneId = useMemo(() => {
        const m = new Map();
        riskZones.forEach((zr) => {
            const rawId = typeof zr?.zoneId === 'object' ? zr.zoneId?._id || zr.zoneId?.id : zr?.zoneId;
            const id = String(rawId ?? '');
            if (id) m.set(id, zr);
        });
        return m;
    }, [riskZones]);

    /** One point per zone geometry (MapLibre markers + sidebar); API row fills risk when present. */
    const riskPoints = useMemo(() => {
        return zoneGeometry
            .map((zone, index) => {
                const id = String(zone._id || zone.id || '');
                if (!id) return null;
                const coords = getZoneCenter(zone);
                if (!coords) return null;
                const zr = riskRowsByZoneId.get(id);
                return {
                    id,
                    name: zr?.zoneName || zone?.name || `Zone ${index + 1}`,
                    lat: coords.lat,
                    lng: coords.lng,
                    riskLevel: String(zr?.riskLevel || 'LOW').toUpperCase(),
                    incidentCount: zr?.incidentCount ?? 0,
                    averageSeverity: zr?.averageSeverity ?? 'N/A',
                    weatherCondition: zr?.weatherCondition ?? 'Unknown',
                    weatherMultiplier: zr?.weatherMultiplier ?? '1.00',
                    severityBreakdown: zr?.severityBreakdown ?? {
                        critical: 0,
                        high: 0,
                        medium: 0,
                        low: 0,
                    },
                };
            })
            .filter(Boolean);
    }, [zoneGeometry, riskRowsByZoneId]);

    useEffect(() => {
        if (!riskPoints.length) {
            setActivePointId('');
            return;
        }
        setActivePointId((previous) =>
            riskPoints.some((point) => point.id === previous) ? previous : riskPoints[0].id
        );
    }, [riskPoints]);

    const activePoint =
        riskPoints.find((point) => point.id === activePointId) ?? riskPoints[0] ?? null;

    const metricCards = [
        {
            label: 'Total Zones',
            value: riskSummary?.totalZones ?? riskZones.length,
            helper: 'Mapped now',
            tone: 'accent',
        },
        {
            label: 'Critical Zones',
            value: riskSummary?.criticalZones ?? riskZones.filter((zone) => zone.riskLevel === 'CRITICAL').length,
            helper: 'Immediate action',
            tone: 'default',
        },
        {
            label: 'High Risk Zones',
            value: riskSummary?.highRiskZones ?? riskZones.filter((zone) => zone.riskLevel === 'HIGH').length,
            helper: 'Priority patrol',
            tone: 'default',
        },
        {
            label: 'Total Incidents',
            value:
                riskSummary?.totalIncidents ??
                riskZones.reduce((total, zone) => total + (zone?.incidentCount || 0), 0),
            helper: 'Risk window',
            tone: 'subtle',
        },
    ];

    const showMapEmpty = Boolean(selectedAreaId) && !loading && zoneGeometry.length === 0;

    return (
        <div className="flex animate-enter flex-col gap-6 pb-6">
            <header className="flex flex-wrap items-center justify-between gap-4 px-2">
                <div className="flex flex-wrap items-center gap-4">
                    {rangerView ? (
                        <Link
                            to="/dashboard/ranger"
                            className="inline-flex items-center gap-2 rounded-2xl border border-border-light bg-white px-4 py-2.5 text-[13px] font-semibold text-primary-dark shadow-premium transition hover:border-primary-medium hover:bg-bg-soft"
                        >
                            <ChevronLeft size={18} />
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-dark shadow-elevated">
                            <MapIcon size={24} className="text-primary-light" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-[24px] font-bold leading-none tracking-tight text-primary-dark">Risk Map</h1>
                        {rangerView ? (
                            <p className="mt-1 text-[13px] font-medium text-text-gray">
                                Zone risk overlay for patrol planning. Select a protected area to load the map.
                            </p>
                        ) : (
                            <p className="mt-1 inline-flex items-center gap-2 text-[13px] font-medium text-text-gray"> 
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="group relative">
                        <select
                            value={selectedAreaId}
                            onChange={(event) => setSelectedAreaId(event.target.value)}
                            className="min-w-[240px] appearance-none rounded-2xl border border-border-light bg-white py-3 pl-10 pr-12 text-[14px] font-bold text-primary-dark shadow-premium outline-none transition-all duration-300 hover:border-primary-medium"
                        >
                            <option value="">Select conservation area</option>
                            {protectedAreas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                        <Layers
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary-medium"
                        />
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:translate-y-0.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M2.5 4.5L6 8L9.5 4.5"
                                    stroke="#2A5A45"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadRiskMap(selectedAreaId)}
                        disabled={!selectedAreaId}
                        className="inline-flex items-center gap-2 rounded-2xl border border-primary-medium bg-white px-4 py-3 text-[13px] font-bold text-primary-dark shadow-premium transition hover:bg-primary-light/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </header>

            {!rangerView && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metricCards.map((card) => (
                        <IncidentMetricCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            helper={card.helper}
                            tone={card.tone}
                        />
                    ))}
                </div>
            )}

            {rangerView && error && (
                <div className="rounded-[24px] border border-[#E63946]/30 bg-[#fff5f5] p-4 text-[13px] text-[#a4161a]">
                    <p className="font-semibold">Failed to load risk map</p>
                    <p className="mt-1">{error}</p>
                </div>
            )}

            <main className={rangerView ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-6 lg:grid-cols-4'}>
                <section className={rangerView ? 'w-full' : 'space-y-4 lg:col-span-3'}>
                    {showMapEmpty ? (
                        <div
                            className={`flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border-light bg-bg-soft p-8 text-center shadow-premium ${
                                rangerView
                                    ? 'min-h-[420px] h-[min(78vh,calc(100dvh-200px))]'
                                    : 'h-[65vh]'
                            }`}
                        >
                            <AlertTriangle className="mb-3 h-10 w-10 text-primary-medium" />
                            <p className="text-[16px] font-semibold text-primary-dark">No zone boundaries</p>
                            <p className="mt-2 max-w-md text-[13px] text-text-gray">
                                This area has no GeoJSON zones yet. Add zones in the backend to see the risk overlay on the
                                map.
                            </p>
                        </div>
                    ) : (
                        <>
                            <RiskMapTelemetry
                                zones={zoneGeometry}
                                riskPoints={riskPoints}
                                loading={loading}
                                selectedZoneId={activePointId}
                                onSelectZone={setActivePointId}
                                wrapperClassName={rangerView ? RANGER_MAP_WRAPPER_CLASS : undefined}
                            />
                            {!rangerView && (
                                <div className="rounded-[28px] border border-border-light bg-bg-soft p-4 shadow-premium">
                                    {activePoint ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-[14px] font-semibold text-primary-dark">
                                                    {activePoint.name}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                        (riskLevelStyles[String(activePoint.riskLevel).toUpperCase()] ||
                                                            riskLevelStyles.LOW
                                                        ).badge
                                                    }`}
                                                >
                                                    {activePoint.riskLevel}
                                                </span>
                                            </div>
                                            <div className="grid gap-2 text-[12px] text-text-gray md:grid-cols-2">
                                                <p>
                                                    Incidents:{' '}
                                                    <span className="font-semibold text-primary-dark">
                                                        {activePoint.incidentCount}
                                                    </span>
                                                </p>
                                                <p>
                                                    Avg Severity:{' '}
                                                    <span className="font-semibold text-primary-dark">
                                                        {activePoint.averageSeverity}
                                                    </span>
                                                </p>
                                                <p>
                                                    Weather:{' '}
                                                    <span className="font-semibold text-primary-dark">
                                                        {activePoint.weatherCondition}
                                                    </span>
                                                </p>
                                              
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-[11px]">
                                                <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#c92a2a]">
                                                    CRITICAL: {activePoint.severityBreakdown.critical || 0}
                                                </div>
                                                <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#d9480f]">
                                                    HIGH: {activePoint.severityBreakdown.high || 0}
                                                </div>
                                                <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#a07900]">
                                                    MEDIUM: {activePoint.severityBreakdown.medium || 0}
                                                </div>
                                                <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#2b8a3e]">
                                                    LOW: {activePoint.severityBreakdown.low || 0}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[12px] text-text-gray">
                                            Select a zone on the map or from the list to view risk details.
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </section>

                {!rangerView && (
                <aside className="flex flex-col gap-6">
                    <div className="group relative overflow-hidden rounded-[28px] bg-primary-dark p-6 text-white shadow-premium">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-medium/20 blur-2xl transition-all duration-700 group-hover:bg-primary-medium/30" />
                        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold">
                            <Activity size={18} className="text-primary-light" />
                            Risk levels
                        </h3>
                        <div className="space-y-2 text-[12px]">
                            <p>
                                <span className="font-semibold text-[#ff8787]">Critical:</span> Immediate intervention
                                required
                            </p>
                            <p>
                                <span className="font-semibold text-[#ffc078]">High:</span> Patrol dispatch recommended
                            </p>
                            <p>
                                <span className="font-semibold text-[#ffe066]">Medium:</span> Active monitoring required
                            </p>
                            <p>
                                <span className="font-semibold text-[#c3fae8]">Low:</span> Routine monitoring
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-border-light bg-white p-5 shadow-premium">
                        <h3 className="text-[14px] font-semibold text-primary-dark">Zones</h3>
                        <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                            {riskPoints.map((point) => (
                                <button
                                    type="button"
                                    key={point.id}
                                    onClick={() => setActivePointId(point.id)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                        point.id === activePointId
                                            ? 'border-primary-medium bg-primary-light/15 shadow-sm'
                                            : 'border-border-light bg-bg-soft hover:border-primary-light'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-[12px] font-semibold text-primary-dark">{point.name}</p>
                                        <span className="shrink-0 rounded-full bg-primary-light/20 px-2 py-0.5 text-[10px] font-semibold text-primary-dark">
                                            {point.riskLevel}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1 text-[11px] text-text-gray">
                                        <MapPinned size={12} />
                                        <span>
                                            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-text-gray">
                                        Incidents:{' '}
                                        <span className="font-semibold text-primary-dark">{point.incidentCount}</span>
                                    </p>
                                </button>
                            ))}
                            {!riskPoints.length && !loading && selectedAreaId && !showMapEmpty && (
                                <p className="text-[12px] text-text-gray">No zones with coordinates to display.</p>
                            )}
                            {!selectedAreaId && (
                                <p className="text-[12px] text-text-gray">Select a protected area to load zones.</p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-[24px] border border-[#E63946]/30 bg-[#fff5f5] p-4 text-[12px] text-[#a4161a]">
                            <p className="font-semibold">Failed to load risk map</p>
                            <p className="mt-1">{error}</p>
                        </div>
                    )}
                </aside>
                )}
            </main>
        </div>
    );
};

export default RiskMapPage;
