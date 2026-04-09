import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ListPaginationFooter from '../../components/common/ListPaginationFooter';
import { useToast } from '../../hooks/useToast';
import { useAnimals, useDeleteAnimal } from '../../features/animals/hooks/useAnimals';
import AnimalFilters from '../../features/animals/components/AnimalFilters';
import AnimalTable from '../../features/animals/components/AnimalTable';
import AnimalForm from '../../features/animals/components/AnimalForm';
import AnimalDetailsPanel from '../../features/animals/components/AnimalDetailsPanel';

const AnimalsPage = () => {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', species: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [selectedAnimalTagId, setSelectedAnimalTagId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState(null);
    const [pendingDeleteTagId, setPendingDeleteTagId] = useState('');

    // Debounce search input by 400ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: aniData, isLoading: loading, error: queryError } = useAnimals({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: filters.status,
        species: filters.species
    });

    const deleteMutation = useDeleteAnimal();

    const animals = useMemo(() => aniData?.data || [], [aniData]);
    const totalCount = aniData?.pagination?.total || 0;
    const error = queryError?.message;
    const selectedAnimal = useMemo(
        () => animals.find((animal) => animal.tagId === selectedAnimalTagId) || null,
        [animals, selectedAnimalTagId]
    );

    const handleDelete = (tagId) => {
        setPendingDeleteTagId(tagId);
    };

    const handleAddClick = () => {
        setSelectedTagId(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (tagId) => {
        setSelectedTagId(tagId);
        setIsModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        toast.success({
            title: selectedTagId ? 'Animal record updated' : 'Animal registered',
            message: selectedTagId
                ? 'The animal details were updated successfully.'
                : 'The new animal was added to the wildlife registry.',
        });
        // React Query will handle the refetch via invalidation if the form also uses the mutation
        // or we can manually invalidate here if needed.
    };

    const confirmDeleteAnimal = async () => {
        if (!pendingDeleteTagId) return;
        try {
            await deleteMutation.mutateAsync(pendingDeleteTagId);
            toast.success({
                title: 'Animal removed',
                message: `Animal ${pendingDeleteTagId} was removed from the registry.`,
            });
            if (selectedAnimalTagId === pendingDeleteTagId) {
                setSelectedAnimalTagId(null);
            }
            setPendingDeleteTagId('');
        } catch (err) {
            toast.error({
                title: 'Delete failed',
                message: err?.message || 'The animal could not be deleted. Please try again.',
            });
            setPendingDeleteTagId('');
        }
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleStatusChange = (value) => {
        setFilters((prev) => ({ ...prev, status: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleSpeciesChange = (value) => {
        setFilters((prev) => ({ ...prev, species: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleSelectAnimal = (animal) => {
        setSelectedAnimalTagId(animal?.tagId || null);
    };

    return (
        <div className="flex flex-col gap-6 animate-enter">
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h1 className="text-[20px] font-bold text-primary-dark tracking-tight">Wildlife Management</h1>
                    <p className="text-text-gray text-[11px] font-medium mt-1">Manage and track monitored animals across all park zones.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="bg-primary text-white border-none px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-sm hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:translate-y-0"
                >
                    <Plus size={16} /> Register Animal
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="bg-white rounded-3xl border border-border-light shadow-premium overflow-hidden transition-all duration-500">
                    <AnimalFilters
                        search={search}
                        onSearchChange={handleSearchChange}
                        status={filters.status}
                        onStatusChange={handleStatusChange}
                        species={filters.species}
                        onSpeciesChange={handleSpeciesChange}
                        pageSize={pagination.limit}
                        onPageSizeChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
                    />

                    <AnimalTable
                        animals={animals}
                        loading={loading}
                        error={error}
                        onDelete={handleDelete}
                        onEdit={handleEditClick}
                        onSelect={handleSelectAnimal}
                        selectedTagId={selectedAnimal?.tagId}
                    />

                    {!loading && !error && totalCount > 0 && (
                        <div className="border-t border-border-light bg-bg-soft/10 px-5 py-3">
                            <ListPaginationFooter
                                totalItems={totalCount}
                                pageSize={pagination.limit}
                                currentPage={pagination.page}
                                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                                countSuffix="animals"
                            />
                        </div>
                    )}
                </div>

                <AnimalDetailsPanel animal={selectedAnimal} />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <AnimalForm
                    tagId={selectedTagId}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            </Modal>
            <ConfirmDialog
                open={Boolean(pendingDeleteTagId)}
                title="Delete animal record?"
                message={pendingDeleteTagId ? `Remove animal ${pendingDeleteTagId} from the wildlife registry? This action cannot be undone.` : ''}
                confirmText="Delete"
                cancelText="Cancel"
                tone="danger"
                loading={deleteMutation.isPending}
                onConfirm={confirmDeleteAnimal}
                onCancel={() => {
                    if (!deleteMutation.isPending) setPendingDeleteTagId('');
                }}
            />
        </div>
    );
};

export default AnimalsPage;