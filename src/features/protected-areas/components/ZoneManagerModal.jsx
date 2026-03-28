import { useEffect, useState } from 'react';
import ZoneForm from './ZoneForm';
import Loading from '../../../components/common/Loading';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Alert from '../../../components/common/Alert';
import ProtectedAreaMap from './ProtectedAreaMap';
import { protectedAreaService } from '../../../services/protectedAreaService';

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

const ZoneManagerModal = ({ area, open, onClose }) => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingZone, setEditingZone] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadZones = async () => {
    if (!area?.id) return;
    setLoading(true);
    setError('');

    try {
      const items = await protectedAreaService.getZonesByProtectedAreaId(area.id);
      setZones(items);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !area?.id) return;
    loadZones();
  }, [open, area?.id]);

  useEffect(() => {
    if (open) return;
    setShowForm(false);
    setEditingZone(null);
    setConfirmDelete(null);
  }, [open]);

  const handleSaveZone = async (payload) => {
    setSaving(true);
    setError('');

    try {
      if (editingZone?.id) {
        await protectedAreaService.updateZone(area.id, editingZone.id, payload);
      } else {
        await protectedAreaService.createZone(area.id, payload);
      }

      setShowForm(false);
      setEditingZone(null);
      await loadZones();
    } catch (requestError) {
      setError(requestError.message || 'Failed to save zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!confirmDelete?.id) return;

    setDeleting(true);
    setError('');

    try {
      await protectedAreaService.deleteZone(area.id, confirmDelete.id);
      setConfirmDelete(null);
      await loadZones();
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete zone.');
    } finally {
      setDeleting(false);
    }
  };

  if (!open || !area) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex h-[92vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-border-light bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-light px-7 py-5">
          <h2 className="text-[20px] font-semibold text-primary-dark sm:text-[24px]">Manage Zones - {area.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[30px] leading-none text-text-gray transition hover:text-primary-dark"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto p-7">
          <Alert type="danger" message={error} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingZone(null);
                setShowForm(true);
              }}
              className="rounded-xl bg-primary-medium px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-dark"
            >
              + Add Zone
            </button>
          </div>

          {showForm && (
            <ZoneForm
              initialData={editingZone}
              onSubmit={handleSaveZone}
              onCancel={() => {
                setShowForm(false);
                setEditingZone(null);
              }}
              isSubmitting={saving}
            />
          )}

          {loading ? (
            <Loading label="Loading zones..." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <section>
                <h3 className="mb-3 text-[17px] font-semibold text-primary-dark">Map View</h3>
                <ProtectedAreaMap areas={[area]} zones={zones} />
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

                        <p className="mt-3 text-[16px] text-primary-dark/85">
                          <span className="font-semibold text-primary-dark">Area Size:</span>{' '}
                          {zone.areaSize ? `${zone.areaSize} km2` : '-'}
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
      </div>

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

export default ZoneManagerModal;
