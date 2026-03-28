import React, { useState, useEffect } from 'react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { fetchPatrols } from '../../features/patrols/api/patrolsApi';
import PatrolsTable from '../../features/patrols/components/PatrolsTable';

const PatrolsPage = () => {
    const [patrols, setPatrols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPatrols = async () => {
            try {
                const data = await fetchPatrols();
                setPatrols(data);
            } catch (err) {
                setError(err.message || 'Failed to load patrols');
            } finally {
                setLoading(false);
            }
        };

        loadPatrols();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Patrols Center</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Manage ranger patrols, deployments, and scheduled routes.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-primary-medium px-4 py-3 text-[13px] font-semibold text-primary-dark transition hover:bg-primary-light/10">
                        <ArrowUpRight size={15} />
                        Export
                    </button>
                </div>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-text-gray bg-white rounded-[24px] border border-border-light shadow-premium">
                        <LoaderCircle className="animate-spin mb-4" size={32} />
                        <p>Loading patrols from database...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-[#E63946] bg-white rounded-[24px] border border-border-light shadow-premium">
                        <p>{error}</p>
                    </div>
                ) : (
                    <PatrolsTable patrols={patrols} />
                )}
            </div>
        </div>
    );
};

export default PatrolsPage;
