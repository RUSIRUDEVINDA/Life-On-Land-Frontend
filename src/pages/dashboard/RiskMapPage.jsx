import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, MapPinned, RefreshCw } from 'lucide-react';
import IncidentMetricCard from '../../features/incidents/components/IncidentMetricCard';
import {
    fetchProtectedAreas,
    fetchRiskMapByProtectedArea,
    fetchZonesByProtectedArea,
} from '../../features/risk-map/api/riskMapApi';
import { useNavigate } from 'react-router-dom';

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

const riskLevelToWeight = (riskLevel) => {
    const normalized = String(riskLevel || '').toUpperCase();
    if (normalized === 'CRITICAL') return 5;
    if (normalized === 'HIGH') return 4;
    if (normalized === 'MEDIUM') return 3;
    if (normalized === 'LOW') return 2;
    return 1;
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

const getMarkerStyle = (weight) => {
    if (weight >= 5) return { size: 28, color: '#E63946', glow: 'rgba(230,57,70,0.4)' };
    if (weight >= 4) return { size: 24, color: '#f76707', glow: 'rgba(247,103,7,0.35)' };
    if (weight >= 3) return { size: 20, color: '#fab005', glow: 'rgba(250,176,5,0.35)' };
    if (weight >= 2) return { size: 18, color: '#2a5a45', glow: 'rgba(42,90,69,0.28)' };
    return { size: 14, color: '#8fb8a2', glow: 'rgba(143,184,162,0.28)' };
};

const normalizeToPercent = (value, min, max) => {
    if (max === min) return 50;
    const ratio = (value - min) / (max - min);
    return Math.max(5, Math.min(95, ratio * 100));
};

const RiskMapPage = () => {
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

    const loadRiskMap = useCallback(async (areaId) => {
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
    }, [handleUnauthorized]);

    useEffect(() => {
        loadProtectedAreas();
    }, [loadProtectedAreas]);

    useEffect(() => {
        if (!selectedAreaId) return;
        loadRiskMap(selectedAreaId);
    }, [selectedAreaId, loadRiskMap]);

    const riskPoints = useMemo(() => {
        const zoneById = new Map(
            zoneGeometry.map((zone) => [String(zone?._id || zone?.id || ''), zone])
        );

        return riskZones
            .map((zoneRisk, index) => {
                const zoneId =
                    typeof zoneRisk?.zoneId === 'object'
                        ? zoneRisk.zoneId?._id || zoneRisk.zoneId?.id
                        : zoneRisk?.zoneId;
                const matchedZone = zoneById.get(String(zoneId || ''));
                const coordinates = getZoneCenter(matchedZone);
                if (!coordinates) return null;

                return {
                    id: String(zoneId || `risk-zone-${index}`),
                    name: zoneRisk?.zoneName || matchedZone?.name || `Risk Zone ${index + 1}`,
                    lat: coordinates.lat,
                    lng: coordinates.lng,
                    weight: riskLevelToWeight(zoneRisk?.riskLevel),
                    riskLevel: zoneRisk?.riskLevel || 'LOW',
                    incidentCount: zoneRisk?.incidentCount || 0,
                    averageSeverity: zoneRisk?.averageSeverity || 'N/A',
                    weatherCondition: zoneRisk?.weatherCondition || 'Unknown',
                    weatherMultiplier: zoneRisk?.weatherMultiplier || '1.00',
                    severityBreakdown: zoneRisk?.severityBreakdown || {
                        critical: 0,
                        high: 0,
                        medium: 0,
                        low: 0,
                    },
                };
            })
            .filter(Boolean);
    }, [riskZones, zoneGeometry]);

    const plottedPoints = useMemo(() => {
        if (!riskPoints.length) return [];

        const lats = riskPoints.map((point) => point.lat);
        const lngs = riskPoints.map((point) => point.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        return riskPoints.map((point) => ({
            ...point,
            x: normalizeToPercent(point.lng, minLng, maxLng),
            y: 100 - normalizeToPercent(point.lat, minLat, maxLat),
        }));
    }, [riskPoints]);

    useEffect(() => {
        if (!plottedPoints.length) {
            setActivePointId('');
            return;
        }
        setActivePointId((previous) =>
            plottedPoints.some((point) => point.id === previous) ? previous : plottedPoints[0].id
        );
    }, [plottedPoints]);

    const activePoint =
        plottedPoints.find((point) => point.id === activePointId) ??
        plottedPoints[0] ??
        null;

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

    return (
        <div className="flex flex-col gap-5 pb-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-[28px] font-semibold tracking-tight text-primary-dark">Risk Map</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Live risk visualization from backend endpoint <span className="font-semibold text-primary-dark">GET /api/risk-map</span>.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedAreaId}
                        onChange={(event) => setSelectedAreaId(event.target.value)}
                        className="rounded-2xl border border-border-light bg-white px-4 py-2.5 text-[13px] font-semibold text-primary-dark shadow-premium outline-none"
                    >
                        <option value="">Select protected area</option>
                        {protectedAreas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => loadRiskMap(selectedAreaId)}
                        disabled={!selectedAreaId}
                        className="inline-flex items-center gap-2 self-start rounded-2xl border border-primary-medium px-4 py-2.5 text-[13px] font-semibold text-primary-dark transition hover:bg-primary-light/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                </div>
            </div>

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

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
                <section className="rounded-[28px] border border-border-light bg-white p-5 shadow-premium">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-primary-dark">Risk Heat View</h2>
                        <span className="rounded-full bg-primary-light/20 px-2.5 py-1 text-[10px] font-semibold text-primary-dark">
                            {plottedPoints.length} points
                        </span>
                    </div>

                    <div className="relative min-h-[450px] overflow-hidden rounded-2xl border border-border-light bg-[radial-gradient(circle_at_top,rgba(143,184,162,0.22),transparent_45%),linear-gradient(to_bottom,#f8faf9,#edf4f1)]">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(42,90,69,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(42,90,69,0.08)_1px,transparent_1px)] bg-[length:34px_34px]" />
                        <div className="absolute left-3 top-3 z-[5] flex flex-wrap gap-1.5">
                            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
                                <span
                                    key={level}
                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${riskLevelStyles[level].badge}`}
                                >
                                    {level}
                                </span>
                            ))}
                        </div>

                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
                                <div className="flex items-center gap-2 rounded-xl border border-border-light bg-white px-4 py-2 text-[13px] font-medium text-primary-dark">
                                    <RefreshCw size={14} className="animate-spin" />
                                    Loading risk map data...
                                </div>
                            </div>
                        )}

                        {!loading &&
                            plottedPoints.map((point) => {
                                const marker = getMarkerStyle(point.weight);
                                const style = riskLevelStyles[point.riskLevel] || riskLevelStyles.LOW;
                                const isActive = activePoint?.id === point.id;
                                return (
                                    <button
                                        type="button"
                                        key={point.id}
                                        onClick={() => setActivePointId(point.id)}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                    >
                                        <div
                                            className="rounded-full"
                                            style={{
                                                width: marker.size * 2.2,
                                                height: marker.size * 2.2,
                                                backgroundColor: style.glow,
                                                filter: `blur(${isActive ? 8 : 6}px)`,
                                            }}
                                        />
                                        <div
                                            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-[0_3px_12px_rgba(0,0,0,0.2)]"
                                            style={{
                                                width: marker.size,
                                                height: marker.size,
                                                backgroundColor: style.marker,
                                                outline: isActive ? '2px solid rgba(255,255,255,0.9)' : 'none',
                                            }}
                                        >
                                            <AlertTriangle size={11} />
                                        </div>
                                        <div
                                            className={`absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${style.label}`}
                                        >
                                            {point.name}
                                        </div>
                                    </button>
                                );
                            })}

                        {!loading && !plottedPoints.length && (
                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                <div className="max-w-md rounded-2xl border border-dashed border-primary-light bg-white/90 p-5 text-center">
                                    <p className="text-[16px] font-semibold text-primary-dark">No risk points found</p>
                                    <p className="mt-2 text-[13px] text-text-gray">
                                        The backend responded, but no map coordinates were detected in the payload.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-border-light bg-bg-soft p-4">
                        {activePoint ? (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-[14px] font-semibold text-primary-dark">{activePoint.name}</h3>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                            (riskLevelStyles[activePoint.riskLevel] || riskLevelStyles.LOW).badge
                                        }`}
                                    >
                                        {activePoint.riskLevel}
                                    </span>
                                </div>
                                <div className="grid gap-2 text-[12px] text-text-gray md:grid-cols-2">
                                    <p>
                                        Incidents: <span className="font-semibold text-primary-dark">{activePoint.incidentCount}</span>
                                    </p>
                                    <p>
                                        Avg Severity: <span className="font-semibold text-primary-dark">{activePoint.averageSeverity}</span>
                                    </p>
                                    <p>
                                        Weather: <span className="font-semibold text-primary-dark">{activePoint.weatherCondition}</span>
                                    </p>
                                    <p>
                                        Weather Multiplier: <span className="font-semibold text-primary-dark">{activePoint.weatherMultiplier}</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-[11px]">
                                    <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#c92a2a]">
                                        C: {activePoint.severityBreakdown.critical || 0}
                                    </div>
                                    <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#d9480f]">
                                        H: {activePoint.severityBreakdown.high || 0}
                                    </div>
                                    <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#a07900]">
                                        M: {activePoint.severityBreakdown.medium || 0}
                                    </div>
                                    <div className="rounded-xl bg-white px-2 py-1.5 text-center text-[#2b8a3e]">
                                        L: {activePoint.severityBreakdown.low || 0}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[12px] text-text-gray">
                                Select a plotted zone to view detailed risk information.
                            </p>
                        )}
                    </div>
                </section>

                <aside className="space-y-5">
                    <div className="rounded-[28px] bg-primary-dark p-5 text-white shadow-premium">
                        <h3 className="text-[14px] font-semibold">Risk Levels</h3>
                        <div className="mt-4 space-y-2 text-[12px]">
                            <p><span className="font-semibold text-[#ff8787]">Critical:</span> Immediate intervention required</p>
                            <p><span className="font-semibold text-[#ffc078]">High:</span> Patrol dispatch recommended</p>
                            <p><span className="font-semibold text-[#ffe066]">Medium:</span> Active monitoring required</p>
                            <p><span className="font-semibold text-[#c3fae8]">Low:</span> Routine monitoring</p>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-border-light bg-white p-5 shadow-premium">
                        <h3 className="text-[14px] font-semibold text-primary-dark">Incoming Zones</h3>
                        <div className="mt-3 max-h-[290px] space-y-2 overflow-y-auto pr-1">
                            {plottedPoints.map((point) => (
                                <div key={point.id} className="rounded-xl border border-border-light bg-bg-soft px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-[12px] font-semibold text-primary-dark">{point.name}</p>
                                        <span className="rounded-full bg-primary-light/20 px-2 py-0.5 text-[10px] font-semibold text-primary-dark">
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
                                        Incidents: <span className="font-semibold text-primary-dark">{point.incidentCount}</span>
                                    </p>
                                </div>
                            ))}
                            {!plottedPoints.length && !loading && (
                                <p className="text-[12px] text-text-gray">No zones available to list.</p>
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
            </div>
        </div>
    );
};

export default RiskMapPage;