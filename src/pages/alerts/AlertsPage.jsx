import React, { useMemo, useState } from 'react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useAlerts, useUpdateAlertStatus } from '../../features/alerts/hooks/useAlerts';
import AlertsTable from '../../features/alerts/components/AlertsTable';

const AlertsPage = () => {
    const toast = useToast();
    const { data: alerts = [], isLoading: loading, error: queryError } = useAlerts();
    const statusMutation = useUpdateAlertStatus();

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
                toast.info({
                    title: 'Nothing to export',
                    message: result.message,
                });
            } else {
                toast.success({
                    title: 'PDF ready',
                    message: 'The alerts queue export has been generated.',
                });
            }
        } catch (err) {
            console.error('PDF export failed:', err);
            toast.error({
                title: 'Export failed',
                message: 'Could not generate the PDF. Please try again.',
            });
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await statusMutation.mutateAsync({ id, status: newStatus });
            toast.success({
                title: 'Alert updated',
                message: `The alert status was changed to ${newStatus.replaceAll('_', ' ').toLowerCase()}.`,
            });
        } catch (err) {
            toast.error({
                title: 'Update failed',
                message: err?.message || 'Failed to update alert status.',
            });
        }
    };

    const error = queryError?.message;

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
