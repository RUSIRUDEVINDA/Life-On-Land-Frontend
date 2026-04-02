import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Activity, MapPinned, Info, AlertTriangle } from 'lucide-react';
import { MAP_STYLE } from '../../map/mapConfig';

const RISK_POLYGON_COLORS = {
    CRITICAL: '#E63946',
    HIGH: '#f76707',
    MEDIUM: '#fab005',
    LOW: '#2b8a3e',
};

const riskLevelStyles = {
    CRITICAL: { color: '#E63946', pulse: 'rgba(230,57,70,0.5)', label: 'Critical Risk' },
    HIGH: { color: '#f76707', pulse: 'rgba(247,103,7,0.4)', label: 'High Risk' },
    MEDIUM: { color: '#fab005', pulse: 'rgba(250,176,5,0.4)', label: 'Medium Risk' },
    LOW: { color: '#2b8a3e', pulse: 'rgba(43,138,62,0.3)', label: 'Low Risk' },
};

/**
 * MapLibre + MapTiler map aligned with Map Tracking (`TelemetryMap`):
 * zone polygons tinted by risk level, markers at zone centers, hover + popup.
 */
const defaultWrapperClass =
    'h-[65vh] w-full rounded-[28px] overflow-hidden border border-border-light shadow-premium relative bg-bg-soft group';

const RiskMapTelemetry = ({
    zones,
    riskPoints,
    loading,
    selectedZoneId,
    onSelectZone,
    wrapperClassName,
}) => {
    const mapRef = useRef(null);
    const [viewState, setViewState] = useState({
        longitude: 80.72,
        latitude: 6.51,
        zoom: 11,
    });
    const [hoveredZone, setHoveredZone] = useState(null);

    const riskByZoneId = useMemo(() => {
        const m = {};
        (riskPoints || []).forEach((p) => {
            m[String(p.id)] = p;
        });
        return m;
    }, [riskPoints]);

    const zoneFeatures = useMemo(() => {
        const list = Array.isArray(zones) ? zones : [];
        return {
            type: 'FeatureCollection',
            features: list
                .filter((z) => z?.geometry)
                .map((zone) => {
                    const id = String(zone._id || zone.id);
                    const rp = riskByZoneId[id];
                    const level = String(rp?.riskLevel || 'LOW').toUpperCase();
                    const color = RISK_POLYGON_COLORS[level] || RISK_POLYGON_COLORS.LOW;
                    return {
                        type: 'Feature',
                        id,
                        geometry: zone.geometry,
                        properties: {
                            id,
                            name: zone.name || rp?.name || 'Zone',
                            riskLevel: level,
                            color,
                        },
                    };
                }),
        };
    }, [zones, riskByZoneId]);

    useEffect(() => {
        if (!zones?.length || !mapRef.current) return;
        const allCoords = [];
        zones.forEach((z) => {
            if (z.geometry?.coordinates?.[0]) {
                z.geometry.coordinates[0].forEach((coord) => allCoords.push(coord));
            }
        });
        if (allCoords.length === 0) return;
        const minLng = Math.min(...allCoords.map((c) => c[0]));
        const maxLng = Math.max(...allCoords.map((c) => c[0]));
        const minLat = Math.min(...allCoords.map((c) => c[1]));
        const maxLat = Math.max(...allCoords.map((c) => c[1]));
        mapRef.current.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat],
            ],
            { padding: 48, duration: 900 }
        );
    }, [zones]);

    const selectedPoint = useMemo(
        () => (riskPoints || []).find((p) => String(p.id) === String(selectedZoneId)),
        [riskPoints, selectedZoneId]
    );

    const onMapClick = useCallback(
        (evt) => {
            const feature = evt.features?.[0];
            const id = feature?.properties?.id;
            if (id) onSelectZone(String(id));
        },
        [onSelectZone]
    );

    return (
        <div className={wrapperClassName || defaultWrapperClass}>
            {loading && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/40 backdrop-blur-sm">
                    <div className="flex animate-enter items-center gap-4 rounded-3xl bg-white px-8 py-5 shadow-[0_12px_44px_rgba(0,0,0,0.1)] transition-all">
                        <Activity className="h-5 w-5 animate-spin text-primary-medium" />
                        <span className="text-[15px] font-bold tracking-tight text-primary-dark">Loading risk map…</span>
                    </div>
                </div>
            )}

            <Map
                ref={mapRef}
                mapLib={maplibregl}
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                mapStyle={MAP_STYLE}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={['risk-zones-fill']}
                onClick={onMapClick}
                onMouseEnter={(evt) => {
                    const feature = evt.features?.[0];
                    if (feature?.properties) setHoveredZone(feature.properties);
                }}
                onMouseLeave={() => setHoveredZone(null)}
            >
                <NavigationControl position="top-right" />
                <FullscreenControl position="top-right" />

                <Source id="risk-zones-data" type="geojson" data={zoneFeatures}>
                    <Layer
                        id="risk-zones-fill"
                        type="fill"
                        paint={{
                            'fill-color': ['get', 'color'],
                            'fill-opacity': 0.28,
                        }}
                    />
                    <Layer
                        id="risk-zones-outline"
                        type="line"
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-width': 2.5,
                            'line-opacity': 0.85,
                        }}
                    />
                </Source>

                {(riskPoints || []).map((point) => {
                    const level = String(point.riskLevel || 'LOW').toUpperCase();
                    const style = riskLevelStyles[level] || riskLevelStyles.LOW;
                    const isSelected = String(point.id) === String(selectedZoneId);
                    return (
                        <Marker
                            key={point.id}
                            longitude={point.lng}
                            latitude={point.lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                onSelectZone(String(point.id));
                            }}
                        >
                            <div className="relative cursor-pointer drop-shadow-xl transition-all hover:scale-110">
                                <div
                                    className="absolute -inset-2 animate-ping rounded-full opacity-25"
                                    style={{ backgroundColor: style.pulse }}
                                />
                                <div
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.22)]"
                                    style={{
                                        backgroundColor: style.color,
                                        outline: isSelected ? '3px solid rgba(255,255,255,0.95)' : 'none',
                                    }}
                                >
                                    <AlertTriangle size={16} className="text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </Marker>
                    );
                })}

                {hoveredZone && (
                    <div
                        className="absolute left-5 top-5 z-[1001] rounded-2xl border border-border-light border-l-4 bg-white/95 px-5 py-3.5 shadow-[0_8px_32px_rgba(42,90,69,0.12)] backdrop-blur-md"
                        style={{ borderColor: hoveredZone.color }}
                    >
                        <p className="text-[13px] font-bold leading-none text-primary-dark">{hoveredZone.name}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary-medium">
                            {hoveredZone.riskLevel} risk
                        </p>
                    </div>
                )}

                {selectedPoint && (
                    <Popup
                        longitude={selectedPoint.lng}
                        latitude={selectedPoint.lat}
                        anchor="bottom"
                        onClose={() => onSelectZone('')}
                        closeButton
                        offset={12}
                    >
                        <div className="min-w-[220px] max-w-[280px] p-3">
                            <h4 className="text-[14px] font-bold text-primary-dark">{selectedPoint.name}</h4>
                            <p className="mt-0.5 text-[11px] font-semibold text-primary-medium">
                                {selectedPoint.riskLevel} risk
                            </p>
                            <div className="mt-3 space-y-1.5 text-[11px] text-text-gray">
                                <p>
                                    Incidents:{' '}
                                    <span className="font-semibold text-primary-dark">{selectedPoint.incidentCount}</span>
                                </p>
                                <p>
                                    Avg severity:{' '}
                                    <span className="font-semibold text-primary-dark">{selectedPoint.averageSeverity}</span>
                                </p>
                                <p>
                                    Weather:{' '}
                                    <span className="font-semibold text-primary-dark">{selectedPoint.weatherCondition}</span>
                                </p>
                               
                                <p className="flex items-center gap-1">
                                    <MapPinned size={12} className="shrink-0" />
                                    {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                                </p>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] font-semibold">
                                <div className="rounded-lg bg-[#fff5f5] px-1 py-1 text-center text-[#c92a2a]">
                                    CRITICAL:{selectedPoint.severityBreakdown?.critical ?? 0}
                                </div>
                                <div className="rounded-lg bg-[#fff4e6] px-1 py-1 text-center text-[#d9480f]">
                                    HIGH:{selectedPoint.severityBreakdown?.high ?? 0}
                                </div> 
                                <div className="rounded-lg bg-[#fff9db] px-1 py-1 text-center text-[#a07900]">
                                    MEDIUM:{selectedPoint.severityBreakdown?.medium ?? 0}
                                </div>
                                <div className="rounded-lg bg-[#ebfbee] px-1 py-1 text-center text-[#2b8a3e]">
                                    LOW:{selectedPoint.severityBreakdown?.low ?? 0}
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            <div className="absolute bottom-8 right-8 z-[100] max-w-[220px] rounded-[32px] border border-border-light bg-white/95 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500 hover:scale-[1.02]">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-dark text-primary-light">
                        <Info size={16} />
                    </div>
                    <h5 className="text-[13px] font-bold text-primary-dark">Risk levels</h5>
                </div>
                <div className="space-y-2.5">
                    {Object.entries(riskLevelStyles).map(([level, style]) => (
                        <div key={level} className="flex items-center gap-3">
                            <div
                                className="h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: style.color }}
                            />
                            <span className="text-[10px] font-bold leading-tight text-primary-dark">{style.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RiskMapTelemetry;
