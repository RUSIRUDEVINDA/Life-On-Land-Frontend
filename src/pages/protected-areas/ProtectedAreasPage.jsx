import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ProtectedAreaForm from '../../features/protected-areas/components/ProtectedAreaForm';
import ProtectedAreaList from '../../features/protected-areas/components/ProtectedAreaList';
import ZoneManagerModal from '../../features/protected-areas/components/ZoneManagerModal';
import { protectedAreaService } from '../../services/protectedAreaService';

const ProtectedAreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [saving, setSaving] = useState(false);

  const [selectedArea, setSelectedArea] = useState(null);
  const [showZonesModal, setShowZonesModal] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAreas = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await protectedAreaService.getProtectedAreas();
      setAreas(data);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load protected areas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleSaveArea = async (payload) => {
    setSaving(true);
    setError('');

    try {
      if (editingArea?.id) {
        await protectedAreaService.updateProtectedArea(editingArea.id, payload);
      } else {
        await protectedAreaService.createProtectedArea(payload);
      }

      setShowForm(false);
      setEditingArea(null);
      await loadAreas();
    } catch (requestError) {
      setError(requestError.message || 'Failed to save protected area.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!confirmDelete?.id) return;

    setDeleting(true);
    setError('');

    try {
      await protectedAreaService.deleteProtectedArea(confirmDelete.id);
      setConfirmDelete(null);
      await loadAreas();
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete protected area.');
    } finally {
      setDeleting(false);
    }
  };

  const selectedAreaId = useMemo(() => selectedArea?.id || '', [selectedArea]);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border-light bg-white shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-6 py-5">
          <div>
            <h2 className="text-[24px] font-semibold tracking-tight text-primary-dark">Protected Areas</h2>
            <p className="mt-1 text-[13px] text-text-gray">
              Manage conservation areas and biodiversity zones
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/protected-areas/map"
              className="rounded-xl border border-border-light bg-white px-4 py-2 text-[12px] font-semibold text-primary-dark transition hover:bg-bg-soft"
            >
              View Map
            </Link>
            <Link
              to="/dashboard/protected-areas/zones"
              className="rounded-xl border border-border-light bg-white px-4 py-2 text-[12px] font-semibold text-primary-dark transition hover:bg-bg-soft"
            >
              Manage Zones
            </Link>
            <button
              type="button"
              onClick={() => {
                setEditingArea(null);
                setShowForm(true);
              }}
              className="rounded-xl bg-primary-medium px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-dark"
            >
              + Create Area
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <Alert type="danger" message={error} />

        {loading ? (
          <Loading label="Loading protected areas..." />
        ) : (
          <ProtectedAreaList
            areas={areas}
            selectedAreaId={selectedAreaId}
            onManageZones={(area) => {
              setSelectedArea(area);
              setShowZonesModal(true);
            }}
            onEdit={(area) => {
              setEditingArea(area);
              setShowForm(true);
            }}
            onDelete={(area) => setConfirmDelete(area)}
          />
        )}
      </div>

      {showForm && (
        <ProtectedAreaForm
          key={editingArea?.id || editingArea?._id || 'new-area'}
          initialData={editingArea}
          onSubmit={handleSaveArea}
          onCancel={() => {
            setShowForm(false);
            setEditingArea(null);
          }}
          isSubmitting={saving}
        />
      )}

      <ZoneManagerModal
        open={showZonesModal}
        area={selectedArea}
        onClose={() => setShowZonesModal(false)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Protected Area"
        message={`Delete protected area "${confirmDelete?.name || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteArea}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
};

export default ProtectedAreasPage;
