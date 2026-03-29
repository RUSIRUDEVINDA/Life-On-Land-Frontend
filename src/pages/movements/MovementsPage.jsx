import React, { useState, useEffect } from 'react';
import { Calendar, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMovements, getMovementSummary } from '../../features/movements/api/movementsApi';
import MovementStats from '../../features/movements/components/MovementStats';
import MovementFilters from '../../features/movements/components/MovementFilters';
import MovementTable from '../../features/movements/components/MovementTable';
import ZoneDensity from '../../features/movements/components/ZoneDensity';

const MovementsPage = () => {
    const [movements, setMovements] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [movData, sumData] = await Promise.all([
                getMovements({
                    page: pagination.page,
                    limit: pagination.limit,
                    tagId: search
                }),
                getMovementSummary()
            ]);

            setMovements(movData?.data || []);
            if (movData?.pagination) {
                setPagination(prev => ({ ...prev, ...movData.pagination }));
            }
            setSummary(sumData);
        } catch (err) {
            console.error('Failed to fetch movement data:', err);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pagination.page, search]);

    return (
        <div className="flex flex-col gap-8 animate-enter">
            <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                    <h1 className="text-[22px] font-bold text-primary-dark tracking-tight leading-none">Telemetry Intelligence</h1>
                    <p className="text-text-gray text-[12px] font-medium mt-1">Real-time geospatial tracking and movement analytics.</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white border border-border-light px-4 py-2.5 rounded-xl text-[13px] font-bold text-primary-dark flex items-center gap-2 shadow-sm hover:bg-bg-soft hover:-translate-y-0.5 transition-all duration-300">
                        <Calendar size={16} className="text-primary-medium" /> Last 24 Hours
                    </button>
                    <Link to="/dashboard/maps" className="bg-primary-dark text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-elevated hover:bg-black hover:-translate-y-0.5 transition-all duration-300">
                        <Zap size={16} className="text-primary-medium animate-pulse" /> Live Tracking
                    </Link>
                </div>
            </div>

            <MovementStats />

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-[24px] border border-border-light shadow-premium overflow-hidden flex flex-col transition-all duration-500">
                    <MovementFilters
                        search={search}
                        onSearchChange={setSearch}
                    />
                    <MovementTable movements={movements} loading={loading} />
                </div>

                <div className="flex flex-col gap-6">
                    <ZoneDensity summary={summary} />
                </div>
            </div>
        </div>
    );
};

export default MovementsPage;
