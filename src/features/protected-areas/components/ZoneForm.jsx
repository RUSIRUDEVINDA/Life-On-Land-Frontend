import { useEffect, useMemo, useState } from 'react';
import GeometryDrawEditor from './GeometryDrawEditor';
import { geometriesOverlap, geometryAreaHa, parseGeometryInput, toFeature } from '../utils/geometryMetrics';

const zoneTypes = ['CORE', 'BUFFER', 'EDGE', 'CORRIDOR'];

const ZoneForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  parentArea = null,
  existingZones = [],
}) => {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('CORE');
  const [areaSize, setAreaSize] = useState('');
  const [geometryText, setGeometryText] = useState('');
  const [geometryMode, setGeometryMode] = useState('draw');
  const [error, setError] = useState('');

  const overlapWarning = useMemo(() => {
    const currentGeometry = parseGeometryInput(geometryText);
    if (!currentGeometry) return '';

    const conflict = existingZones.find((zone) => {
      const zoneId = String(zone?.id || zone?._id || '');
      const currentZoneId = String(initialData?.id || initialData?._id || '');
      if (zoneId && currentZoneId && zoneId === currentZoneId) return false;

      const zoneGeometry = zone?.geometry || zone?.raw?.geometry || zone?.raw?.geoJson || zone?.raw?.polygon;
      return geometriesOverlap(currentGeometry, zoneGeometry);
    });

    return conflict ? `Warning: geometry overlaps with zone "${conflict.name || 'Unnamed Zone'}".` : '';
  }, [existingZones, geometryText, initialData?.id, initialData?._id]);

  const syncGeometryAndArea = (nextGeometryText) => {
    setGeometryText(nextGeometryText);

    const parsed = parseGeometryInput(nextGeometryText);
    if (!parsed) return;

    const computedHa = geometryAreaHa(parsed);
    if (computedHa) {
      setAreaSize(computedHa);
    }
  };

  useEffect(() => {
    if (!initialData) {
      setName('');
      setZoneType('CORE');
      setAreaSize('');
      setGeometryText('');
      setGeometryMode('draw');
      setError('');
      return;
    }

    setName(initialData.name || '');
    setZoneType(initialData.zoneType || 'CORE');
    setAreaSize(initialData.areaSize ? String(initialData.areaSize) : '');
    setGeometryText(initialData.geometry ? JSON.stringify(initialData.geometry, null, 2) : '');
    setGeometryMode('draw');
    setError('');
  }, [initialData]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    let geometry = null;
    if (geometryText.trim()) {
      const parsedGeometry = parseGeometryInput(geometryText);
      if (!parsedGeometry) {
        setError('Zone geometry must be valid JSON.');
        return;
      }

      const geometryFeature = toFeature(parsedGeometry);
      if (!geometryFeature?.geometry) {
        setError('Zone geometry must include a valid GeoJSON Polygon or MultiPolygon.');
        return;
      }

      geometry = geometryFeature.geometry;
    }

    onSubmit({
      name: name.trim(),
      zoneType,
      areaSize: areaSize ? Number(areaSize) : undefined,
      geometry,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border-light bg-bg-soft p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-semibold text-primary-dark">Zone Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="w-full rounded-xl border border-border-light bg-white px-3 py-2 text-primary-dark outline-none focus:border-primary-medium"
            placeholder="Core South"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-semibold text-primary-dark">Zone Type</span>
          <select
            value={zoneType}
            onChange={(event) => setZoneType(event.target.value)}
            className="w-full rounded-xl border border-border-light bg-white px-3 py-2 text-primary-dark outline-none focus:border-primary-medium"
          >
            {zoneTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-semibold text-primary-dark">Area Size (ha)</span>
        <input
          value={areaSize}
          onChange={(event) => setAreaSize(event.target.value)}
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-xl border border-border-light bg-white px-3 py-2 text-primary-dark outline-none focus:border-primary-medium"
          placeholder="340"
        />
      </label>

      <div className="space-y-2 text-sm">
        <span className="font-semibold text-primary-dark">Geometry (GeoJSON Polygon / MultiPolygon)</span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setGeometryMode('draw')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              geometryMode === 'draw' ? 'bg-primary-light/40 text-primary-dark' : 'bg-white text-text-gray hover:bg-primary-light/25'
            }`}
          >
            Draw On Map
          </button>
          <button
            type="button"
            onClick={() => setGeometryMode('json')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              geometryMode === 'json' ? 'bg-primary-dark text-white' : 'bg-white text-text-gray hover:bg-primary-light/25'
            }`}
          >
            JSON Paste
          </button>
        </div>

        {geometryMode === 'draw' && (
          <GeometryDrawEditor
            value={geometryText}
            onChange={(geometry) => syncGeometryAndArea(geometry ? JSON.stringify(geometry, null, 2) : '')}
            contextGeometry={parentArea?.geometry || parentArea?.raw?.geometry || parentArea?.raw?.geoJson || parentArea?.raw?.polygon || null}
            contextZones={existingZones}
            activeZoneId={initialData?.id || ''}
          />
        )}

        {geometryMode === 'draw' && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-gray">Auto-filled GeoJSON (from drawing)</span>
            <textarea
              value={geometryText}
              readOnly
              rows={5}
              className="w-full rounded-xl border border-border-light bg-bg-soft px-3 py-2 font-mono text-xs text-primary-dark"
            />
          </div>
        )}

        {geometryMode === 'json' && (
          <textarea
            value={geometryText}
            onChange={(event) => syncGeometryAndArea(event.target.value)}
            rows={6}
            className="w-full rounded-xl border border-border-light bg-white px-3 py-2 font-mono text-xs text-primary-dark outline-none focus:border-primary-medium"
            placeholder='{"type":"Polygon","coordinates":[[[79.86,6.92],[79.87,6.92],[79.87,6.91],[79.86,6.91],[79.86,6.92]]]}'
          />
        )}
      </div>

      {overlapWarning && <p className="text-sm font-semibold text-[#b45309]">{overlapWarning}</p>}

      {error && <p className="text-sm font-medium text-danger-dark">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border-light bg-white px-4 py-2 text-sm font-semibold text-primary-dark hover:bg-primary-light/20"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-primary-medium px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Zone'}
        </button>
      </div>
    </form>
  );
};

export default ZoneForm;
