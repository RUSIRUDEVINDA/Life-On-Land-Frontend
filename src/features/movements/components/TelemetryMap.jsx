import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Map, { Source, Layer, Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Activity, MapPinned, Info, AlertTriangle } from 'lucide-react';
import { fetchProtectedAreas, fetchZonesByProtectedArea, fetchRiskMapByProtectedArea } from '../../risk-map/api/riskMapApi';
import { getLiveMovements } from '../api/movementsApi';
import { MAP_STYLE } from '../../map/mapConfig';
import { getSpeciesIcon } from '../../animals/utils/speciesIcons';

const riskLevelStyles = {
  CRITICAL: { color: '#E63946', pulse: 'rgba(230,57,70,0.5)', label: 'Critical Risk' },
  HIGH: { color: '#f76707', pulse: 'rgba(247,103,7,0.4)', label: 'High Risk' },
  MEDIUM: { color: '#fab005', pulse: 'rgba(250,176,5,0.4)', label: 'Medium Risk' },
  LOW: { color: '#2b8a3e', pulse: 'rgba(43,138,62,0.3)', label: 'Low Risk' },
};

const normalizeId = (value) => {
  if (value && typeof value === 'object') {
    return String(value._id || value.id || '');
  }
  return String(value || '');
};

const normalizeRiskLevel = (value) => {
  const normalized = String(value || 'LOW').toUpperCase();
  return riskLevelStyles[normalized] ? normalized : 'LOW';
};

const getMovementCoordinates = (movement) => {
  const lng = Number(movement?.lng ?? movement?.longitude);
  const lat = Number(movement?.lat ?? movement?.latitude);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  return { lng, lat };
};

const getAnimalMarkerImage = (movement) => {
  const animal = movement?.animalDetails || {};
  const photo = animal.photo || movement?.photo || '';

  return {
    animal,
    src: photo || getSpeciesIcon(animal.species),
    hasPhoto: Boolean(photo),
  };
};

const isPointInRing = (point, ring = []) => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const current = ring[i];
    const previous = ring[j];
    if (!Array.isArray(current) || !Array.isArray(previous)) continue;

    const xi = Number(current[0]);
    const yi = Number(current[1]);
    const xj = Number(previous[0]);
    const yj = Number(previous[1]);

    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};

const isPointInPolygon = (point, polygon = []) => {
  if (!Array.isArray(polygon) || polygon.length === 0) return false;

  const [outerRing, ...holes] = polygon;
  if (!isPointInRing(point, outerRing)) return false;

  return !holes.some((ring) => isPointInRing(point, ring));
};

const isPointInsideGeometry = (point, geometry) => {
  if (!geometry?.type || !Array.isArray(geometry.coordinates)) return false;

  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }

  return false;
};

const TelemetryMap = ({ selectedAreaId }) => {
  const mapRef = useRef(null);
  const [zones, setZones] = useState([]);
  const [riskData, setRiskData] = useState({});
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 80.72,
    latitude: 6.51,
    zoom: 11
  });

  const loadAreaData = useCallback(async (areaId) => {
    setLoading(true);
    try {
      if (!areaId) {
        const areas = await fetchProtectedAreas();
        const zoneLists = await Promise.all(
          areas.map((area) => fetchZonesByProtectedArea(area.id).catch(() => []))
        );
        setZones(zoneLists.flat());
        setRiskData({});
        return;
      }

      const [zonesData, riskMap] = await Promise.all([
        fetchZonesByProtectedArea(areaId),
        fetchRiskMapByProtectedArea(areaId)
      ]);
      setZones(zonesData || []);

      const riskMapLookup = {};
      if (riskMap.zones) {
        riskMap.zones.forEach(z => {
          const zoneId = normalizeId(z?.zoneId);
          if (!zoneId) return;
          riskMapLookup[zoneId] = {
            ...z,
            zoneId,
            riskLevel: normalizeRiskLevel(z?.riskLevel),
          };
        });
      }
      setRiskData(riskMapLookup);
    } catch (err) {
      console.error('Failed to load area details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMovements = useCallback(async () => {
    try {
      const params = selectedAreaId ? { protectedAreaId: selectedAreaId } : {};
      const data = await getLiveMovements(params);
      console.log(`[MAP-DEBUG] Received ${data?.length || 0} movements for area: ${selectedAreaId}`, data);
      setMovements(data || []);
    } catch (err) {
      console.error('Failed to load live movements:', err);
    }
  }, [selectedAreaId]);

  useEffect(() => {
    loadAreaData(selectedAreaId);
  }, [selectedAreaId, loadAreaData]);

  useEffect(() => {
    loadMovements();
    const interval = setInterval(loadMovements, 5000);
    return () => clearInterval(interval);
  }, [loadMovements]);

  // Handle bounds fitting
  useEffect(() => {
    if (zones.length > 0 && mapRef.current) {
      const allCoords = [];
      zones.forEach(z => {
        if (z.geometry?.coordinates?.[0]) {
          z.geometry.coordinates[0].forEach(coord => allCoords.push(coord));
        }
      });

      if (allCoords.length > 0) {
        const minLng = Math.min(...allCoords.map(c => c[0]));
        const maxLng = Math.max(...allCoords.map(c => c[0]));
        const minLat = Math.min(...allCoords.map(c => c[1]));
        const maxLat = Math.max(...allCoords.map(c => c[1]));

        mapRef.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 40, duration: 1000 }
        );
      }
    }
  }, [zones]);

  const zonesById = useMemo(() => (
    zones.reduce((lookup, zone) => {
      const zoneId = normalizeId(zone?._id || zone?.id);
      if (zoneId) {
        lookup[zoneId] = zone;
      }
      return lookup;
    }, {})
  ), [zones]);

  const enrichedMovements = useMemo(() => (
    movements
      .map((movement) => {
        const coordinates = getMovementCoordinates(movement);
        if (!coordinates) return null;

        const movementZoneId = normalizeId(movement?.zoneId || movement?.zone);
        const containingZone = zones.find((zone) => isPointInsideGeometry(coordinates, zone?.geometry));
        const resolvedZone = containingZone || zonesById[movementZoneId] || null;
        const resolvedZoneId = normalizeId(resolvedZone?._id || resolvedZone?.id || movementZoneId);
        const riskInfo = riskData[resolvedZoneId] || riskData[movementZoneId] || null;
        const fallbackZoneName = movement?.zoneName || movement?.zone?.name || '';
        const fallbackZoneType = movement?.zoneType || movement?.zone?.zoneType || '';
        const resolvedRiskLevel = normalizeRiskLevel(riskInfo?.riskLevel || movement?.riskLevel);

        return {
          ...movement,
          lng: coordinates.lng,
          lat: coordinates.lat,
          resolvedZoneId,
          resolvedZoneName: riskInfo?.zoneName || resolvedZone?.name || fallbackZoneName || 'N/A',
          resolvedZoneType: resolvedZone?.zoneType || fallbackZoneType || '',
          resolvedRiskLevel,
        };
      })
      .filter(Boolean)
  ), [movements, zones, zonesById, riskData]);

  const zoneFeatures = useMemo(() => {
    const mapZones = selectedAreaId ? zones : [];
    return {
      type: 'FeatureCollection',
      features: mapZones.map(zone => {
        const zoneId = normalizeId(zone._id || zone.id);
        const riskInfo = riskData[zoneId];
        const riskLevel = normalizeRiskLevel(riskInfo?.riskLevel);
        return {
          type: 'Feature',
          id: zone.id || zone._id,
          geometry: zone.geometry,
          properties: {
            id: zone.id || zone._id,
            name: riskInfo?.zoneName || zone.name,
            type: zone.zoneType,
            riskLevel: riskLevel,
            color: riskLevelStyles[riskLevel].color
          }
        };
      })
    };
  }, [zones, riskData, selectedAreaId]);

  const popupImage = selectedAnimal ? getAnimalMarkerImage(selectedAnimal) : null;

  return (
    <div className="h-[65vh] w-full rounded-[28px] overflow-hidden border border-border-light shadow-premium relative bg-bg-soft group">
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-white/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white px-8 py-5 rounded-3xl shadow-[0_12px_44px_rgba(0,0,0,0.1)] flex items-center gap-4 transition-all animate-enter">
            <Activity className="animate-spin text-primary-medium w-5 h-5" />
            <span className="font-bold text-primary-dark tracking-tight text-[15px]">Connecting MapTiler...</span>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        mapLib={maplibregl}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={selectedAreaId ? ['zones-layer'] : []}
        onMouseEnter={evt => {
          const feature = evt.features?.[0];
          if (feature) setHoveredZone(feature.properties);
        }}
        onMouseLeave={() => setHoveredZone(null)}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {selectedAreaId && (
          <Source id="zones-data" type="geojson" data={zoneFeatures}>
            <Layer
              id="zones-layer"
              type="fill"
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.25
              }}
            />
            <Layer
              id="zones-outline"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 2.5,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {enrichedMovements.map((mv) => {
          const style = riskLevelStyles[mv.resolvedRiskLevel] || riskLevelStyles.LOW;
          const { animal, src: animalImage, hasPhoto: hasAnimalPhoto } = getAnimalMarkerImage(mv);

          return (
            <Marker
              key={mv._id}
              longitude={mv.lng}
              latitude={mv.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedAnimal(mv);
              }}
            >
              <div className="relative cursor-pointer transition-all hover:scale-110 drop-shadow-xl group/marker">
                <div
                  className="absolute -inset-2.5 rounded-full animate-ping opacity-30"
                  style={{ backgroundColor: style.pulse }}
                />
                <div
                  className="relative w-11 h-11 rounded-full border-[2.5px] border-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.22)] transform transition-transform bg-white"
                >
                  <img
                    src={animalImage}
                    alt={animal.species || 'Animal icon'}
                    className={hasAnimalPhoto ? 'w-full h-full rounded-full object-cover' : 'w-8 h-8'}
                  />
                </div>
              </div>
            </Marker>
          );
        })}

        {hoveredZone && (
          <div className="absolute top-5 left-5 z-[1001] bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-border-light shadow-[0_8px_32px_rgba(42,90,69,0.12)] border-l-4" style={{ borderColor: hoveredZone.color }}>
            <p className="text-[13px] font-bold text-primary-dark leading-none">{hoveredZone.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light/10 text-primary-dark opacity-70 uppercase tracking-widest">{hoveredZone.type}</span>
              <span className="text-[10px] font-bold text-primary-medium uppercase tracking-tighter">{hoveredZone.riskLevel} Risk Activity</span>
            </div>
          </div>
        )}

        {selectedAnimal && (
          <Popup
            longitude={selectedAnimal.lng}
            latitude={selectedAnimal.lat}
            anchor="bottom"
            onClose={() => setSelectedAnimal(null)}
            closeButton={false}
            offset={15}
            className="telemetry-maptiler-popup"
          >
            <div className="p-4 min-w-[240px]">
              <div className="flex items-center gap-4 border-b border-border-light pb-4 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-premium border border-border-light bg-white overflow-hidden"
                >
                  <img
                    src={popupImage?.src}
                    alt={popupImage?.animal.species || 'Animal icon'}
                    className={popupImage?.hasPhoto ? 'w-full h-full object-cover' : 'w-9 h-9'}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-primary-dark text-lg leading-tight tracking-tight">{selectedAnimal.animalDetails?.tagId || selectedAnimal.tagId}</h4>
                  <p className="text-[12px] text-text-gray font-semibold mt-0.5">{selectedAnimal.animalDetails?.species || 'Protected Wildlife'}</p>
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4 mb-4">
                <div className="bg-bg-soft p-2.5 rounded-xl border border-border-light/40">
                  <p className="text-[10px] text-text-gray font-bold uppercase tracking-tighter opacity-70">Sector</p>
                  <p className="font-bold text-primary-dark mt-0.5 text-[12px] leading-snug break-words">{selectedAnimal.resolvedZoneName || 'N/A'}</p>
                </div>
                <div className="bg-bg-soft p-2.5 rounded-xl border border-border-light/40">
                  <p className="text-[10px] text-text-gray font-bold uppercase tracking-tighter opacity-70">Threat</p>
                  <p className="font-bold text-primary-medium mt-0.5 text-[12px]">{selectedAnimal.resolvedRiskLevel || 'LOW'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] font-semibold text-text-gray bg-primary-light/10 p-2.5 rounded-xl">
                <MapPinned size={14} className="text-primary-medium" />
                <span>Sync Time: {new Date(selectedAnimal.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Modern Legend Overlay */}
      <div className="absolute bottom-8 right-8 z-[100] bg-white/95 backdrop-blur-xl p-6 rounded-[32px] border border-border-light shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all hover:scale-[1.03] duration-500">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl bg-primary-dark flex items-center justify-center text-primary-light">
            <Info size={16} />
          </div>
          <h5 className="text-[14px] font-bold text-primary-dark">Tracking Protocols</h5>
        </div>
        <div className="space-y-3.5">
          {Object.entries(riskLevelStyles).map(([level, style]) => (
            <div key={level} className="flex items-center gap-3.5">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: style.color }}></div>
              <span className="text-[11px] font-bold text-primary-dark tracking-tight">{style.label} Area</span>
            </div>
          ))}
          <div className="pt-4 border-t border-border-light mt-2 flex justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md border border-primary-medium bg-emerald-50 opacity-40"></div>
              <span className="text-[10px] font-bold text-text-gray uppercase tracking-widest">Sectors</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={getSpeciesIcon()} alt="Animal icon" className="w-4 h-4" />
              <span className="text-[10px] font-bold text-text-gray uppercase tracking-widest">Flora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryMap;