import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const SRI_LANKA_CENTER = [7.7, 80.7];

const parseGeometry = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (typeof value === 'object') return value;
  return null;
};

const pickPolygonFeature = (collection) => {
  if (!collection || !Array.isArray(collection.features)) return null;

  return (
    collection.features.find(
      (feature) =>
        feature?.type === 'Feature' &&
        (feature?.geometry?.type === 'Polygon' || feature?.geometry?.type === 'MultiPolygon')
    ) || null
  );
};

const pickPolygonGeometry = (collection) => {
  if (!collection || !Array.isArray(collection.geometries)) return null;

  return (
    collection.geometries.find((geometry) => geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') || null
  );
};

const geometryToFeature = (geometry) => {
  if (!geometry) return null;

  if (geometry.type === 'FeatureCollection') {
    return pickPolygonFeature(geometry);
  }

  if (geometry.type === 'GeometryCollection') {
    const polygonGeometry = pickPolygonGeometry(geometry);
    if (!polygonGeometry) return null;
    return { type: 'Feature', geometry: polygonGeometry, properties: {} };
  }

  if (geometry.type === 'Feature') return geometry;
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return { type: 'Feature', geometry, properties: {} };
  }
  return null;
};

const contextStyle = {
  color: '#1f6f54',
  weight: 2.5,
  dashArray: '6 6',
  fillColor: '#8fb8a2',
  fillOpacity: 0,
  opacity: 0.95,
};

const contextZoneStyle = {
  color: '#b08900',
  weight: 1.5,
  dashArray: '5 5',
  fillColor: '#ffe8a1',
  fillOpacity: 0.06,
  opacity: 0.8,
};

const activeZoneStyle = {
  color: '#c92a2a',
  weight: 2.5,
  dashArray: '6 4',
  fillColor: '#ffc9c9',
  fillOpacity: 0.08,
  opacity: 0.95,
};

const buildGeometryFromLayers = (layersGroup) => {
  const polygons = [];

  layersGroup.eachLayer((layer) => {
    const geo = layer.toGeoJSON();
    const geometry = geo?.geometry;

    if (!geometry) return;

    if (geometry.type === 'Polygon') {
      polygons.push(geometry.coordinates);
      return;
    }

    if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((coords) => polygons.push(coords));
    }
  });

  if (polygons.length === 0) return null;
  if (polygons.length === 1) {
    return { type: 'Polygon', coordinates: polygons[0] };
  }

  return { type: 'MultiPolygon', coordinates: polygons };
};

const DrawController = ({ value, onChange, contextFeature }) => {
  const map = useMap();
  const layersRef = useRef(null);
  const syncingFromOutsideRef = useRef(false);
  const lastExternalValueRef = useRef('');

  const enableLayerEditing = (layersGroup) => {
    if (!layersGroup) return;

    layersGroup.eachLayer((layer) => {
      if (layer?.pm?.enable) {
        layer.pm.enable({
          allowSelfIntersection: false,
          snappable: true,
        });
      }
    });
  };

  const parsedValue = useMemo(() => parseGeometry(value), [value]);

  useEffect(() => {
    const layers = L.featureGroup().addTo(map);
    layersRef.current = layers;

    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      drawPolygon: true,
      editMode: true,
      dragMode: true,
      cutPolygon: true,
      removalMode: true,
      rotateMode: false,
    });

    map.pm.setGlobalOptions({
      continueDrawing: false,
      allowSelfIntersection: false,
      snappable: true,
      snapDistance: 20,
    });

    // Keep edit mode active so users can immediately reshape boundaries after drawing.
    map.pm.enableGlobalEditMode();

    const emitGeometry = () => {
      const currentGeometry = buildGeometryFromLayers(layers);
      syncingFromOutsideRef.current = true;
      onChange(currentGeometry);
      window.setTimeout(() => {
        syncingFromOutsideRef.current = false;
      }, 0);
    };

    const onCreate = (event) => {
      if (event?.layer && !layers.hasLayer(event.layer)) {
        layers.addLayer(event.layer);
      }

      enableLayerEditing(layers);

      // Wait one frame so layer internals are fully initialized before serialization.
      window.requestAnimationFrame(emitGeometry);
    };

    const onEdit = () => emitGeometry();

    const onRemove = (event) => {
      if (event?.layer && layers.hasLayer(event.layer)) {
        layers.removeLayer(event.layer);
      }
      emitGeometry();
    };

    const onCut = (event) => {
      if (event?.originalLayer && layers.hasLayer(event.originalLayer)) {
        layers.removeLayer(event.originalLayer);
      }

      if (event?.layer && !layers.hasLayer(event.layer)) {
        layers.addLayer(event.layer);
      }

      if (event?.resultingLayers && typeof event.resultingLayers.eachLayer === 'function') {
        event.resultingLayers.eachLayer((layer) => {
          if (!layers.hasLayer(layer)) {
            layers.addLayer(layer);
          }
        });
      }

      enableLayerEditing(layers);

      emitGeometry();
    };

    map.on('pm:create', onCreate);
    map.on('pm:edit', onEdit);
    map.on('pm:remove', onRemove);
    map.on('pm:cut', onCut);

    return () => {
      map.off('pm:create', onCreate);
      map.off('pm:edit', onEdit);
      map.off('pm:remove', onRemove);
      map.off('pm:cut', onCut);

      map.pm.removeControls();

      if (layersRef.current) {
        layersRef.current.clearLayers();
        map.removeLayer(layersRef.current);
      }
    };
  }, [map, onChange]);

  useEffect(() => {
    const layers = layersRef.current;
    if (!layers || syncingFromOutsideRef.current) return;

    const externalText = JSON.stringify(parsedValue || null);
    if (externalText === lastExternalValueRef.current) return;

    lastExternalValueRef.current = externalText;

    layers.clearLayers();

    const feature = geometryToFeature(parsedValue);
    if (!feature) return;

    const geoLayer = L.geoJSON(feature);
    geoLayer.eachLayer((layer) => layers.addLayer(layer));
    enableLayerEditing(layers);

    const bounds = geoLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
    }
  }, [map, parsedValue]);

  useEffect(() => {
    if (parsedValue) return;
    if (!contextFeature) return;

    const contextLayer = L.geoJSON(contextFeature);
    const bounds = contextLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });
    }
  }, [map, parsedValue, contextFeature]);

  return null;
};

const GeometryDrawEditor = ({
  value,
  onChange,
  contextGeometry = null,
  contextZones = [],
  activeZoneId = '',
}) => {
  const contextFeature = useMemo(() => {
    const parsed = parseGeometry(contextGeometry);
    return geometryToFeature(parsed);
  }, [contextGeometry]);

  const mappedContextZones = useMemo(() => {
    return contextZones
      .map((zone) => {
        const parsed = parseGeometry(zone?.geometry || zone?.raw?.geometry || zone?.raw?.geoJson || zone?.raw?.polygon);
        const feature = geometryToFeature(parsed);
        if (!feature) return null;

        return {
          id: String(zone?.id || zone?._id || ''),
          feature,
          name: zone?.name || 'Zone',
        };
      })
      .filter(Boolean);
  }, [contextZones]);

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-white">
      <div className="border-b border-border-light bg-bg-soft px-4 py-2 text-[12px] text-text-gray">
        Draw polygon(s), use Edit to reshape, Cut to split, and Delete to remove. Multiple polygons are saved as MultiPolygon.
      </div>
      <div className="h-[330px]">
        <MapContainer center={SRI_LANKA_CENTER} zoom={7} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {contextFeature && <GeoJSON data={contextFeature} pathOptions={contextStyle} />}
          {mappedContextZones.map((zone) => (
            <GeoJSON
              key={`context-zone-${zone.id || zone.name}`}
              data={zone.feature}
              pathOptions={zone.id === String(activeZoneId || '') ? activeZoneStyle : contextZoneStyle}
            />
          ))}
          <DrawController value={value} onChange={onChange} contextFeature={contextFeature} />
        </MapContainer>
      </div>
    </div>
  );
};

export default GeometryDrawEditor;
