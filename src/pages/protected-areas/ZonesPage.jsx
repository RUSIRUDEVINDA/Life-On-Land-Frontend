import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ProtectedAreaMap from '../../features/protected-areas/components/ProtectedAreaMap';
import ZoneForm from '../../features/protected-areas/components/ZoneForm';
import { protectedAreaService } from '../../services/protectedAreaService';

const zoneTypeStyles = {
  CORE: {
    border: 'border-[#fecaca]',
    badge: 'bg-[#fee2e2] text-[#b91c1c]',
  },
  BUFFER: {
    border: 'border-[#fde68a]',
    badge: 'bg-[#fef3c7] text-[#a16207]',
  },
  EDGE: {
    border: 'border-[#fed7aa]',
    badge: 'bg-[#ffedd5] text-[#9a3412]',
  },
  CORRIDOR: {
    border: 'border-[#bbf7d0]',
    badge: 'bg-[#dcfce7] text-[#166534]',
  },
};

const normalizeZoneType = (value) => {
  const normalized = String(value || '').trim().toUpperCase();

  if (normalized.includes('CORE')) return 'CORE';
  if (normalized.includes('BUFFER')) return 'BUFFER';
  if (normalized.includes('CORRIDOR')) return 'CORRIDOR';
  if (normalized.includes('EDGE')) return 'EDGE';

  return 'EDGE';
};

const ZonesPage = () => {
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [zones, setZones] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const selectedArea = useMemo(
    () => areas.find((area) => area.id === selectedAreaId) || null,
    [areas, selectedAreaId]
  );

  const loadAreas = async () => {
    setLoadingAreas(true);
    setError('');

    try {
      const items = await protectedAreaService.getProtectedAreas();
      setAreas(items);
      setSelectedAreaId((prev) => {
        if (prev && items.some((area) => area.id === prev)) return prev;
        return items[0]?.id || '';
      });
    } catch (requestError) {
      setError(requestError.message || 'Failed to load protected areas.');
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadZones = async (areaId) => {
    if (!areaId) {
      setZones([]);
      return;
    }

    setLoadingZones(true);
    setError('');

    try {
      const items = await protectedAreaService.getZonesByProtectedAreaId(areaId);
      setZones(items);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load zones.');
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (!selectedAreaId) return;
    loadZones(selectedAreaId);
  }, [selectedAreaId]);

  const handleSaveZone = async (payload) => {
    if (!selectedAreaId) return;
    setSaving(true);
    setError('');

    try {
      if (editingZone?.id) {
        await protectedAreaService.updateZone(selectedAreaId, editingZone.id, payload);
      } else {
        await protectedAreaService.createZone(selectedAreaId, payload);
      }

      setShowForm(false);
      setEditingZone(null);
      await loadZones(selectedAreaId);
    } catch (requestError) {
      setError(requestError.message || 'Failed to save zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedAreaId || !confirmDelete?.id) return;
    setDeleting(true);
    setError('');

    try {
      await protectedAreaService.deleteZone(selectedAreaId, confirmDelete.id);
      setConfirmDelete(null);
      await loadZones(selectedAreaId);
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete zone.');
    } finally {
      setDeleting(false);
    }
  };

  const zoneHeader = selectedArea ? `Zones - ${selectedArea.name}` : 'Zones';

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border-light bg-white shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-6 py-5">
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-primary-dark">{zoneHeader}</h2>
            <p className="mt-1 text-[13px] text-text-gray">
              Create, edit, and map biodiversity zones for each protected area.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/protected-areas/manage"
              className="rounded-xl border border-border-light bg-white px-4 py-2 text-[12px] font-semibold text-primary-dark transition hover:bg-bg-soft"
            >
              Manage Areas
            </Link>
            <Link
              to="/dashboard/protected-areas/map"
              className="rounded-xl bg-primary-medium px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-dark"
            >
              View Map
            </Link>
          </div>
        </div>
      </section>

      <Alert type="danger" message={error} />

      <section className="rounded-2xl border border-border-light bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="min-w-[240px] space-y-1 text-sm">
            <span className="font-semibold text-primary-dark">Protected Area</span>
            <select
              value={selectedAreaId}
              onChange={(event) => setSelectedAreaId(event.target.value)}
              disabled={loadingAreas || areas.length === 0}
              className="w-full rounded-xl border border-border-light bg-white px-3 py-2 text-primary-dark outline-none focus:border-primary-medium disabled:bg-bg-soft"
            >
              {loadingAreas && <option value="">Loading areas...</option>}
              {!loadingAreas && areas.length === 0 && <option value="">No areas yet</option>}
              {!loadingAreas && areas.length > 0 && (
                <>
                  <option value="">Select area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingZone(null);
                setShowForm(true);
              }}
              className="rounded-xl bg-primary-medium px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedAreaId || loadingAreas}
            >
              + Add Zone
            </button>
            <button
              type="button"
              onClick={() => loadZones(selectedAreaId)}
              className="rounded-xl border border-border-light bg-white px-4 py-2 text-[12px] font-semibold text-primary-dark transition hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedAreaId || loadingZones}
            >
              Refresh Zones
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mt-4">
            <ZoneForm
              key={editingZone?.id || editingZone?._id || 'new-zone'}
              initialData={editingZone}
              onSubmit={handleSaveZone}
              onCancel={() => {
                setShowForm(false);
                setEditingZone(null);
              }}
              isSubmitting={saving}
              parentArea={selectedArea}
              existingZones={zones}
            />
          </div>
        )}

        {!selectedAreaId && !loadingAreas && (
          <div className="mt-6 rounded-xl border border-dashed border-border-light bg-bg-soft p-5 text-sm text-text-gray">
            Create a protected area first, then select it here to add zones.
          </div>
        )}

        {selectedAreaId && (
          <div className="mt-6">
            {loadingZones ? (
              <Loading label="Loading zones..." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
                <section>
                  <h3 className="mb-3 text-[17px] font-semibold text-primary-dark">Map View</h3>
                  <ProtectedAreaMap areas={selectedArea ? [selectedArea] : []} zones={zones} />
                </section>

                <section className="min-h-[320px]">
                  <h3 className="mb-3 text-[17px] font-semibold text-primary-dark">Zones</h3>
                  <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
                    {zones.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border-light bg-white p-5 text-text-gray">
                        No zones found for this area.
                      </div>
                    )}

                    {zones.map((zone) => {
                      const zoneType = normalizeZoneType(zone.zoneType);
                      const style = zoneTypeStyles[zoneType] || zoneTypeStyles.EDGE;

                      return (
                        <article key={zone.id} className={`rounded-xl border bg-white p-5 ${style.border}`}>
                          <h4 className="text-[16px] font-semibold text-primary-dark">{zone.name}</h4>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`rounded-md px-3 py-1 text-[12px] font-semibold ${style.badge}`}>
                              {zoneType}
                            </span>
                            <span className="rounded-md bg-primary-light/35 px-3 py-1 text-[12px] font-semibold text-primary-dark">
                              ACTIVE
                            </span>
                          </div>

                          <p className="mt-3 text-[15px] text-primary-dark/85">
                            <span className="font-semibold text-primary-dark">Area Size:</span>{' '}
                            {zone.areaSize ? `${zone.areaSize} ha` : '-'}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingZone(zone);
                                setShowForm(true);
                              }}
                              className="min-w-[84px] rounded-xl bg-primary-medium px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-primary-dark"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(zone)}
                              className="min-w-[84px] rounded-xl bg-danger-medium px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-danger-dark"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Zone"
        message={`Delete zone "${confirmDelete?.name || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteZone}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ZonesPage;
