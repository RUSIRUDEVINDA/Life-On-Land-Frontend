import { useEffect, useState } from 'react';

const zoneTypes = ['CORE', 'BUFFER', 'EDGE', 'CORRIDOR'];

const ZoneForm = ({ initialData, onSubmit, onCancel, isSubmitting = false }) => {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('CORE');
  const [areaSize, setAreaSize] = useState('');
  const [geometryText, setGeometryText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialData) {
      setName('');
      setZoneType('CORE');
      setAreaSize('');
      setGeometryText('');
      setError('');
      return;
    }

    setName(initialData.name || '');
    setZoneType(initialData.zoneType || 'CORE');
    setAreaSize(initialData.areaSize ? String(initialData.areaSize) : '');
    setGeometryText(initialData.geometry ? JSON.stringify(initialData.geometry, null, 2) : '');
    setError('');
  }, [initialData]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    let geometry = null;
    if (geometryText.trim()) {
      try {
        geometry = JSON.parse(geometryText);
      } catch {
        setError('Zone geometry must be valid JSON.');
        return;
      }
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

      <label className="space-y-1 text-sm">
        <span className="font-semibold text-primary-dark">Geometry (GeoJSON Polygon / MultiPolygon)</span>
        <textarea
          value={geometryText}
          onChange={(event) => setGeometryText(event.target.value)}
          rows={6}
          className="w-full rounded-xl border border-border-light bg-white px-3 py-2 font-mono text-xs text-primary-dark outline-none focus:border-primary-medium"
          placeholder='{"type":"Polygon","coordinates":[[[79.86,6.92],[79.87,6.92],[79.87,6.91],[79.86,6.91],[79.86,6.92]]]} '
        />
      </label>

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
