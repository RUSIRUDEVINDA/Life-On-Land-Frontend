import React, { useState } from 'react';

const areaTypes = [
  { value: 'NATIONAL_PARK', label: 'National Park' },
  { value: 'FOREST_RESERVE', label: 'Forest Reserve' },
  { value: 'SAFARI_AREA', label: 'Safari Area' },
];

const normalizeTypeValue = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');

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

const ProtectedAreaForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  const [name, setName] = useState(initialData?.name || '');
  const [areaType, setAreaType] = useState(normalizeTypeValue(initialData?.areaType || initialData?.type || ''));
  const [district, setDistrict] = useState(initialData?.district || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [areaSize, setAreaSize] = useState(initialData?.areaSize ? String(initialData.areaSize) : '');
  const [status, setStatus] = useState(initialData?.status || 'ACTIVE');
  const [geometryText, setGeometryText] = useState(initialData?.geometry ? JSON.stringify(initialData.geometry, null, 2) : '');
  const [geometryMode, setGeometryMode] = useState('manual');
  const [error, setError] = useState('');

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setName(initialData?.name || '');
    setAreaType(normalizeTypeValue(initialData?.areaType || initialData?.type || ''));
    setDistrict(initialData?.district || '');
    setDescription(initialData?.description || '');
    setAreaSize(initialData?.areaSize ? String(initialData.areaSize) : '');
    setStatus(initialData?.status || 'ACTIVE');
    setGeometryText(initialData?.geometry ? JSON.stringify(initialData.geometry, null, 2) : '');
    setGeometryMode('manual');
    setError('');
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    let geometry = null;
    if (geometryText.trim()) {
      try {
        geometry = JSON.parse(geometryText);
      } catch {
        setError('Polygon coordinates must be valid JSON GeoJSON.');
        return;
      }
    }

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
      areaType: normalizeTypeValue(areaType),
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
                  onClick={() => setGeometryMode('manual')}
                  className={`rounded-xl px-5 py-2 text-[13px] font-semibold transition ${
                    geometryMode === 'manual' ? 'bg-primary-light/40 text-primary-dark' : 'bg-bg-soft text-text-gray hover:bg-primary-light/25'
                  }`}
                >
                  Manual Entry
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

              <textarea
                value={geometryText}
                onChange={(event) => setGeometryText(event.target.value)}
                rows={10}
                required
                className="w-full rounded-xl border border-border-light bg-bg-soft px-5 py-4 font-mono text-[14px] text-primary-dark outline-none transition focus:border-primary-medium"
                placeholder={geometryPlaceholder}
              />
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
