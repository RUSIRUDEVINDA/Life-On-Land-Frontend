import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { fetchAlerts, updateAlertStatus } from '../../features/alerts/api/alertsApi';
import AlertsTable from '../../features/alerts/components/AlertsTable';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('ALL');

    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            const searchString = `${alert.type || ''} ${alert.description || ''}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());
            const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
            return matchesSearch && matchesSeverity;
        });
    }, [alerts, searchTerm, severityFilter]);

    const handleExportQueue = async () => {
        try {
            const { exportAlertsQueueToPdf } = await import('../../features/alerts/utils/exportAlertsQueuePdf');
            const result = exportAlertsQueueToPdf(filteredAlerts, {
                severity: severityFilter,
                searchTerm,
            });
            if (!result.ok) {
                window.alert(result.message);
            }
        } catch (err) {
            console.error('PDF export failed:', err);
            const hint =
                err?.message && /Failed to fetch dynamically imported module|Loading chunk/i.test(err.message)
                    ? ' If you just cloned the repo, run npm install and reload the page.'
                    : '';
            window.alert(`Could not generate the PDF. Please try again.${hint}`);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await updateAlertStatus(id, { status: newStatus });
            const data = await fetchAlerts();
            setAlerts(data);
        } catch (err) {
            window.alert('Failed to update alert status: ' + err.message);
        }
    };

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const data = await fetchAlerts();
                setAlerts(data);
            } catch (err) {
                setError(err.message || 'Failed to load alerts');
            } finally {
                setLoading(false);
            }
        };

        loadAlerts();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Alerts Center</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Manage active alerts across protected areas.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleExportQueue}
                        disabled={loading || alerts.length === 0}
                        className="inline-flex items-center gap-2 rounded-2xl border border-primary-medium px-4 py-3 text-[13px] font-semibold text-primary-dark transition hover:bg-primary-light/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowUpRight size={15} />
                        Export Queue
                    </button>
                </div>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-text-gray bg-white rounded-[24px] border border-border-light shadow-premium">
                        <LoaderCircle className="animate-spin mb-4" size={32} />
                        <p>Loading alerts from database...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-[#E63946] bg-white rounded-[24px] border border-border-light shadow-premium">
                        <p>{error}</p>
                    </div>
                ) : (
                    <AlertsTable
                        alerts={alerts}
                        filteredAlerts={filteredAlerts}
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        severityFilter={severityFilter}
                        onSeverityFilterChange={setSeverityFilter}
                        onUpdateStatus={handleUpdateStatus}
                    />
                )}
            </div>
        </div>
    );
};

export default AlertsPage;
