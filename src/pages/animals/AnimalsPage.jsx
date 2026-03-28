import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { getAnimals, deleteAnimal } from '../../features/animals/api/animalsApi';
import AnimalFilters from '../../features/animals/components/AnimalFilters';
import AnimalTable from '../../features/animals/components/AnimalTable';
import AnimalForm from '../../features/animals/components/AnimalForm';

const AnimalsPage = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', species: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState(null);

    const fetchAnimals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAnimals({
                page: pagination.page,
                limit: pagination.limit,
                search: search,
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
    }, [pagination.page, pagination.limit, filters, search]);

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]);

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

            <div className="bg-white rounded-3xl border border-border-light shadow-premium overflow-hidden transition-all duration-500">
                <AnimalFilters
                    search={search}
                    onSearchChange={setSearch}
                    status={filters.status}
                    onStatusChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                    species={filters.species}
                    onSpeciesChange={(val) => setFilters(prev => ({ ...prev, species: val }))}
                />

                <AnimalTable
                    animals={animals}
                    loading={loading}
                    error={error}
                    onDelete={handleDelete}
                    onEdit={handleEditClick}
                />

                <div className="p-6 border-t border-border-light flex items-center justify-between bg-bg-soft/10">
                    <span className="text-[13px] text-text-gray font-bold">
                        Displaying <span className="text-primary-dark font-extrabold">{animals.length}</span> entities of {pagination.total} total
                    </span>
                    <div className="flex gap-2.5">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="w-10 h-10 flex items-center justify-center border border-border-light rounded-xl text-text-gray bg-white hover:bg-bg-soft hover:text-primary-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-90"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="w-10 h-10 flex items-center justify-center border border-border-light rounded-xl text-text-gray bg-white hover:bg-bg-soft hover:text-primary-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-90"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
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