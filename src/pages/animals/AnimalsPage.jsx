import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ListPaginationFooter from '../../components/common/ListPaginationFooter';
import { getAnimals, deleteAnimal } from '../../features/animals/api/animalsApi';
import AnimalFilters from '../../features/animals/components/AnimalFilters';
import AnimalTable from '../../features/animals/components/AnimalTable';
import AnimalForm from '../../features/animals/components/AnimalForm';
import AnimalDetailsPanel from '../../features/animals/components/AnimalDetailsPanel';

const AnimalsPage = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', species: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [selectedAnimal, setSelectedAnimal] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState(null);

    // Debounce search input by 400ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset to page 1 when search or filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [debouncedSearch, filters]);

    const fetchAnimals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAnimals({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                status: filters.status,
                species: filters.species
            });
            setAnimals(data.data || []);
            setPagination(prev => ({ ...prev, ...data.pagination }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters, debouncedSearch]);

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]);

    useEffect(() => {
        if (!selectedAnimal) return;
        const match = animals.find((animal) => animal.tagId === selectedAnimal.tagId);
        if (match) {
            setSelectedAnimal(match);
        } else {
            setSelectedAnimal(null);
        }
    }, [animals, selectedAnimal]);

    const handleDelete = async (tagId) => {
        if (window.confirm(`Are you sure you want to delete animal ${tagId}?`)) {
            try {
                await deleteAnimal(tagId);
                fetchAnimals();
            } catch (err) {
                alert(err.message);
            }
        }
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
        fetchAnimals();
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
                        onSearchChange={setSearch}
                        status={filters.status}
                        onStatusChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
                        species={filters.species}
                        onSpeciesChange={(val) => setFilters((prev) => ({ ...prev, species: val }))}
                        pageSize={pagination.limit}
                        onPageSizeChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
                    />

                    <AnimalTable
                        animals={animals}
                        loading={loading}
                        error={error}
                        onDelete={handleDelete}
                        onEdit={handleEditClick}
                        onSelect={setSelectedAnimal}
                        selectedTagId={selectedAnimal?.tagId}
                    />

                    {!loading && !error && pagination.total > 0 && (
                        <div className="border-t border-border-light bg-bg-soft/10 px-5 py-3">
                            <ListPaginationFooter
                                totalItems={pagination.total}
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
        </div>
    );
};

export default AnimalsPage;
