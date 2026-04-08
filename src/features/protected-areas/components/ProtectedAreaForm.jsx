import { useState } from 'react';
import GeometryDrawEditor from './GeometryDrawEditor';
import { geometryAreaKm2, parseGeometryInput, toFeature } from '../utils/geometryMetrics';

const areaTypes = [
  { value: 'NATIONAL_PARK', label: 'National Park' },
  { value: 'FOREST_RESERVE', label: 'Forest Reserve' },
  { value: 'SAFARI_AREA', label: 'Safari Area' },
  { value: 'WILDLIFE_SANCTUARY', label: 'Wildlife Sanctuary' },
  { value: 'MARINE_PARK', label: 'Marine Park' },
  { value: 'OTHER', label: 'Other' },
];

const normalizeAreaType = (value) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (normalized.includes('NATIONAL') && normalized.includes('PARK')) return 'NATIONAL_PARK';
  if (normalized.includes('FOREST') && normalized.includes('RESERVE')) return 'FOREST_RESERVE';
  if (normalized.includes('SAFARI')) return 'SAFARI_AREA';
  if (normalized.includes('WILDLIFE') && normalized.includes('SANCTUARY')) return 'WILDLIFE_SANCTUARY';
  if (normalized.includes('MARINE') && normalized.includes('PARK')) return 'MARINE_PARK';
  if (normalized === 'OTHER') return 'OTHER';

  return normalized;
};

const geometryPlaceholder = `{
  "type": "Polygon",
  "coordinates": [
    [
      [79.8612, 6.9271],
      [79.8655, 6.9271],
      [79.8655, 6.9235],
      [79.8612, 6.9235],
      [79.8612, 6.9271]
    ]
  ]
}`;

const editingAreaStyle = {
  color: '#1f6f54',
  weight: 3,
  dashArray: '8 6',
  fillColor: '#8fb8a2',
  fillOpacity: 0,
  opacity: 1,
};

const getInitialAreaFormState = (initialData) => {
  if (!initialData) {
    return {
      name: '',
      areaType: '',
      district: '',
      description: '',
      areaSize: '',
      status: 'ACTIVE',
      geometryText: '',
      geometryMode: 'draw',
      error: '',
    };
  }

  const initialGeometryFeature = toFeature(
    initialData.geometry ||
    initialData.raw?.geometry ||
    initialData.raw?.geoJson ||
    initialData.raw?.polygon ||
    null
  );

  return {
    name: initialData.name || '',
    areaType: normalizeAreaType(initialData.areaType || initialData.type || ''),
    district: initialData.district || '',
    description: initialData.description || '',
    areaSize: initialData.areaSize ? String(initialData.areaSize) : '',
    status: initialData.status || 'ACTIVE',
    geometryText: initialGeometryFeature?.geometry ? JSON.stringify(initialGeometryFeature.geometry, null, 2) : '',
    geometryMode: 'draw',
    error: '',
  };
};

const ProtectedAreaForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const initialFormState = getInitialAreaFormState(initialData);
  const [name, setName] = useState(initialFormState.name);
  const [areaType, setAreaType] = useState(initialFormState.areaType);
  const [district, setDistrict] = useState(initialFormState.district);
  const [description, setDescription] = useState(initialFormState.description);
  const [areaSize, setAreaSize] = useState(initialFormState.areaSize);
  const [status, setStatus] = useState(initialFormState.status);
  const [geometryText, setGeometryText] = useState(initialFormState.geometryText);
  const [geometryMode, setGeometryMode] = useState(initialFormState.geometryMode);
  const [error, setError] = useState(initialFormState.error);

  const syncGeometryAndArea = (nextGeometryText) => {
    setGeometryText(nextGeometryText);

    const parsed = parseGeometryInput(nextGeometryText);
    if (!parsed) return;

    const computedKm2 = geometryAreaKm2(parsed);
    if (computedKm2) {
      setAreaSize(computedKm2);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    let geometry = null;
    if (!geometryText.trim()) {
      setError('Please draw or paste a valid polygon geometry.');
      return;
    }

    const parsedGeometry = parseGeometryInput(geometryText);
    if (!parsedGeometry) {
      setError('Polygon coordinates must be valid JSON GeoJSON.');
      return;
    }

    const geometryFeature = toFeature(parsedGeometry);
    if (!geometryFeature?.geometry) {
      setError('Geometry must include a valid GeoJSON Polygon or MultiPolygon.');
      return;
    }

    geometry = geometryFeature.geometry;

    if (geometry?.type === 'Feature') {
      geometry = geometry.geometry || null;
    }

    if (geometry?.type === 'MultiPolygon') {
      setError('Geometry must be a GeoJSON Polygon (MultiPolygon is not supported).');
      return;
    }

    if (geometry && geometry.type !== 'Polygon') {
      setError('Geometry must be a GeoJSON Polygon.');
      return;
    }

    onSubmit({
      name: name.trim(),
      areaType: normalizeAreaType(areaType),
      district: district.trim(),
      description: description.trim(),
      status: status.trim(),
      areaSize: areaSize ? Number(areaSize) : undefined,
      geometry,
    });
  };

  return (
    <div className="fixed inset-0 z-1100 flex items-center justify-center bg-black/45 p-3 sm:p-6" onClick={onCancel}>
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-border-light bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-light px-8 py-6">
          <h3 className="text-[24px] font-semibold leading-none text-primary-dark sm:text-[28px]">
            {initialData ? 'Edit Protected Area' : 'Create Protected Area'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-[30px] leading-none text-text-gray transition hover:text-primary-dark"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-96px)] overflow-y-auto px-8 py-6">
          <div className="space-y-7">
            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold text-primary-dark">Area Name <span className="text-danger-medium">*</span></span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-xl border border-border-light px-4 py-2.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
                placeholder="e.g. Serengeti National Park"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold text-primary-dark">Area Type <span className="text-danger-medium">*</span></span>
              <select
                value={areaType}
                onChange={(event) => setAreaType(event.target.value)}
                required
                className="w-full rounded-xl border border-border-light bg-white px-4 py-2.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
              >
                <option value="">Select an option</option>
                {areaTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold text-primary-dark">District <span className="text-danger-medium">*</span></span>
              <input
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                required
                className="w-full rounded-xl border border-border-light px-4 py-2.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
                placeholder="e.g. Ratnapura"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold text-primary-dark">Area Size (km2) <span className="text-danger-medium">*</span></span>
              <input
                value={areaSize}
                onChange={(event) => setAreaSize(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full rounded-xl border border-border-light px-4 py-2.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
                placeholder="e.g. 14750"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold text-primary-dark">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border-light px-4 py-2.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
                placeholder="Enter a description of the protected area"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold text-primary-dark">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-border-light bg-white px-4 py-2.5 text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DELETED">DELETED</option>
              </select>
            </label>

            <section className="space-y-4">
              <p className="text-[13px] font-semibold text-primary-dark">Polygon Coordinates <span className="text-danger-medium">*</span></p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGeometryMode('draw')}
                  className={`rounded-xl px-5 py-2 text-[13px] font-semibold transition ${
                    geometryMode === 'draw' ? 'bg-primary-light/40 text-primary-dark' : 'bg-bg-soft text-text-gray hover:bg-primary-light/25'
                  }`}
                >
                  Draw On Map
                </button>
                <button
                  type="button"
                  onClick={() => setGeometryMode('json')}
                  className={`rounded-xl px-5 py-2 text-[13px] font-semibold transition ${
                    geometryMode === 'json' ? 'bg-primary-dark text-white' : 'bg-bg-soft text-text-gray hover:bg-primary-light/25'
                  }`}
                >
                  JSON Paste
                </button>
              </div>

              {geometryMode === 'draw' && (
                <GeometryDrawEditor
                  value={geometryText}
                  onChange={(geometry) => syncGeometryAndArea(geometry ? JSON.stringify(geometry, null, 2) : '')}
                  editableStyle={editingAreaStyle}
                  showValueOutline
                  valueOutlineStyle={editingAreaStyle}
                />
              )}

              {geometryMode === 'draw' && (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-semibold text-text-gray">Auto-filled GeoJSON (from drawing)</p>
                  <textarea
                    value={geometryText}
                    readOnly
                    rows={6}
                    className="w-full rounded-xl border border-border-light bg-bg-soft px-4 py-3 font-mono text-[12px] text-primary-dark"
                  />
                </div>
              )}

              {geometryMode === 'json' && (
                <div className="rounded-xl border border-primary-light bg-primary-light/20 px-5 py-4 text-primary-dark">
                  <p className="text-[14px] font-semibold">Paste GeoJSON Polygon:</p>
                  <p className="mt-1 text-[13px]">Use <span className="font-semibold">geojson.io</span> to create coordinates visually on a map.</p>
                  <div className="mt-2 text-[13px] leading-relaxed">
                    <p>Steps:</p>
                    <p>1. Visit geojson.io</p>
                    <p>2. Draw a polygon on the map</p>
                    <p>3. Copy the GeoJSON from the right panel</p>
                    <p>4. Paste it below</p>
                  </div>
                </div>
              )}

              {geometryMode === 'json' && (
                <textarea
                  value={geometryText}
                  onChange={(event) => syncGeometryAndArea(event.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-border-light bg-bg-soft px-5 py-4 font-mono text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
                  placeholder={geometryPlaceholder}
                />
              )}
            </section>

            {error && <p className="text-[15px] font-semibold text-danger-medium">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary-medium px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Area' : 'Create Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProtectedAreaForm;
