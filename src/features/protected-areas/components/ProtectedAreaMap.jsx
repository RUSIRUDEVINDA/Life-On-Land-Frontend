import { useEffect, useMemo } from 'react';
import { GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const normalizeZoneType = (value) => {
  const normalized = String(value || '').trim().toUpperCase();

  if (normalized.includes('CORE')) return 'CORE';
  if (normalized.includes('BUFFER')) return 'BUFFER';
  if (normalized.includes('CORRIDOR')) return 'CORRIDOR';
  if (normalized.includes('EDGE')) return 'EDGE';

  return 'EDGE';
};

const zoneTypeStyles = {
  CORE: { color: '#c92a2a', fillColor: '#e03131' },
  BUFFER: { color: '#e67700', fillColor: '#ffd43b' },
  EDGE: { color: '#f08c00', fillColor: '#ffa94d' },
  CORRIDOR: { color: '#2b8a3e', fillColor: '#40c057' },
};

const areaStyle = {
  color: '#2a5a45',
  weight: 3,
  fillColor: '#8fb8a2',
  fillOpacity: 0.1,
  opacity: 0.9,
};

const parseGeometry = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
};

const getGeometry = (item) => {
  const value = parseGeometry(item?.geometry || item?.raw?.geometry || item?.raw?.geoJson || item?.raw?.polygon);

  if (!value) return null;
  if (value?.type === 'Feature') return value;
  if (value?.type === 'Polygon' || value?.type === 'MultiPolygon') {
    return { type: 'Feature', geometry: value, properties: {} };
  }
  if (value?.geometry?.type) return value;

  return null;
};

const FitBounds = ({ features }) => {
  const map = useMap();

  useEffect(() => {
    if (!features.length) return;

    const bounds = L.latLngBounds([]);
    features.forEach((feature) => {
      const layer = L.geoJSON(feature);
      const layerBounds = layer.getBounds();
      if (layerBounds.isValid()) {
        bounds.extend(layerBounds);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [features, map]);

  return null;
};

const ProtectedAreaMap = ({ areas = [], zones = [], dottedAreaBoundary = false }) => {
  const areaPathStyle = useMemo(() => {
    if (!dottedAreaBoundary) return areaStyle;

    return {
      ...areaStyle,
      dashArray: '8 6',
      fillOpacity: 0.05,
      opacity: 0.95,
    };
  }, [dottedAreaBoundary]);

  const mappedAreas = useMemo(() => {
    return areas
      .map((area) => {
        const feature = getGeometry(area);
        if (!feature) return null;

        return {
          id: area.id,
          feature,
          name: area.name,
          areaSize: area.areaSize,
        };
      })
      .filter(Boolean);
  }, [areas]);

  const mappedZones = useMemo(() => {
    return zones
      .map((zone) => {
        const feature = getGeometry(zone);
        if (!feature) return null;

        return {
          id: zone.id,
          feature,
          name: zone.name,
          zoneType: normalizeZoneType(zone.zoneType),
          areaSize: zone.areaSize,
        };
      })
      .filter(Boolean);
  }, [zones]);

  const featuresForBounds = useMemo(
    () => [...mappedAreas.map((item) => item.feature), ...mappedZones.map((item) => item.feature)],
    [mappedAreas, mappedZones]
  );

  return (
    <div className="h-[52vh] min-h-[300px] overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm md:h-[56vh]">
      <MapContainer
        center={[7.0, 80.7]}
        zoom={7}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappedAreas.map((item) => (
          <GeoJSON key={`area-${item.id}`} data={item.feature} pathOptions={areaPathStyle}>
            <Tooltip sticky>
              <div className="text-xs">
                <p className="font-semibold">{item.name}</p>
                <p>{item.areaSize ? `${item.areaSize} ha` : 'Area size not available'}</p>
              </div>
            </Tooltip>
          </GeoJSON>
        ))}

        {mappedZones.map((item) => {
          const style = zoneTypeStyles[item.zoneType] || zoneTypeStyles.EDGE;

          return (
            <GeoJSON
              key={`zone-${item.id}`}
              data={item.feature}
              pathOptions={{
                color: style.color,
                fillColor: style.fillColor,
                weight: 2,
                fillOpacity: 0.45,
                opacity: 0.95,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <p className="font-semibold">{item.name}</p>
                  <p>Type: {item.zoneType}</p>
                  <p>{item.areaSize ? `${item.areaSize} ha` : 'Area size not available'}</p>
                </div>
              </Tooltip>
            </GeoJSON>
          );
        })}

        <FitBounds features={featuresForBounds} />
      </MapContainer>
    </div>
  );
};

export default ProtectedAreaMap;
