import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ProtectedAreaForm from '../../features/protected-areas/components/ProtectedAreaForm';
import ProtectedAreaList from '../../features/protected-areas/components/ProtectedAreaList';
import ZoneManagerModal from '../../features/protected-areas/components/ZoneManagerModal';
import {
  useProtectedAreas,
  useCreateProtectedArea,
  useUpdateProtectedArea,
  useDeleteProtectedArea
} from '../../hooks/useProtectedAreas';

const ProtectedAreasPage = () => {
  const { data: areas = [], isLoading: loading, error: queryError } = useProtectedAreas();
  const createMutation = useCreateProtectedArea();
  const updateMutation = useUpdateProtectedArea();
  const deleteMutation = useDeleteProtectedArea();

  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleSaveArea = async (payload) => {
    setError('');
    try {
      if (editingArea?.id) {
        await updateMutation.mutateAsync({ id: editingArea.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowForm(false);
      setEditingArea(null);
    } catch (requestError) {
      setError(requestError.message || 'Failed to save protected area.');
    }
  };

  const handleDeleteArea = async () => {
    if (!confirmDelete?.id) return;
    setError('');
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete protected area.');
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;
  const selectedAreaId = useMemo(() => selectedArea?.id || '', [selectedArea]);
  const displayError = error || queryError?.message;

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
        {displayError && <Alert type="danger" message={displayError} />}

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
