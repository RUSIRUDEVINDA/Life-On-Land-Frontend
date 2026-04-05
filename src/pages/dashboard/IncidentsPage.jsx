import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarClock, FilePlus2, LoaderCircle, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import IncidentMetricCard from '../../features/incidents/components/IncidentMetricCard';
import IncidentFilters from '../../features/incidents/components/IncidentFilters';
import IncidentList from '../../features/incidents/components/IncidentList';
import {
    incidentSeverities,
    incidentStatuses,
    incidentTypes,
} from '../../features/incidents/data/incidents';
import { deleteIncident, fetchIncidents } from '../../features/incidents/api/incidentsApi';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ListPaginationFooter from '../../components/common/ListPaginationFooter';

const formatDate = (value) =>
    new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const IncidentsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [type, setType] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [severity, setSeverity] = useState('ALL');
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingId, setDeletingId] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Reset to page 1 whenever any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, type, status, severity]);

    useEffect(() => {
        const loadIncidents = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchIncidents();
                setIncidents(data);
                setSelectedIncidentId((previous) => previous || data[0]?._id || null);
            } catch (requestError) {
                setIncidents([]);
                setError(requestError.message || 'Failed to load incidents');
            } finally {
                setLoading(false);
            }
        };

        loadIncidents();
    }, []);

    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (!idFromUrl || incidents.length === 0) return;
        const match = incidents.find((i) => String(i._id) === String(idFromUrl));
        if (match) setSelectedIncidentId(match._id);
    }, [searchParams, incidents]);

    const filteredIncidents = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return incidents.filter((incident) => {
            const matchesType = type === 'ALL' || incident.type === type;
            const matchesStatus = status === 'ALL' || incident.status === status;
            const matchesSeverity = severity === 'ALL' || incident.severity === severity;
            const matchesSearch =
                !normalizedSearch ||
                [
                    incident.type,
                    incident.description,
                    incident.zone.name,
                    incident.protectedArea.name,
                    incident.reportedBy.fullName,
                ].some((value) => value.toLowerCase().includes(normalizedSearch));

            return matchesType && matchesStatus && matchesSeverity && matchesSearch;
        });
    }, [incidents, searchTerm, type, status, severity]);

    const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(1, totalPages));
        }
    }, [currentPage, totalPages]);

    const paginatedIncidents = useMemo(() => {
        const page = Math.min(currentPage, totalPages);
        const start = (page - 1) * pageSize;
        return filteredIncidents.slice(start, start + pageSize);
    }, [filteredIncidents, currentPage, pageSize, totalPages]);

    const totalFiltered = filteredIncidents.length;

    const selectedIncident =
        filteredIncidents.find((incident) => incident._id === selectedIncidentId) ??
        filteredIncidents[0] ??
        null;

    const confirmDeleteIncident = async () => {
        if (!selectedIncident?._id) {
            setDeleteConfirmOpen(false);
            return;
        }

        const idToRemove = selectedIncident._id;
        const remainingAfterDelete = filteredIncidents.filter((i) => i._id !== idToRemove);

        setDeletingId(idToRemove);
        setError('');
        try {
            await deleteIncident(idToRemove);
            setIncidents((prev) => prev.filter((incident) => incident._id !== idToRemove));
            setSelectedIncidentId(remainingAfterDelete[0]?._id ?? null);
            setDeleteConfirmOpen(false);
        } catch (requestError) {
            setError(requestError.message || 'Failed to delete incident.');
        } finally {
            setDeletingId('');
        }
    };

    const handleExportQueue = async () => {
        try {
            const { exportIncidentsQueueToPdf } = await import(
                '../../features/incidents/utils/exportIncidentsQueuePdf'
            );
            const result = exportIncidentsQueueToPdf(filteredIncidents, {
                type,
                status,
                severity,
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

    const metricCards = [
        {
            label: 'Total Reports',
            value: incidents.length,
            helper: 'Current queue',
            tone: 'accent',
        },
        {
            label: 'Critical Cases',
            value: incidents.filter((incident) => incident.severity === 'CRITICAL').length,
            helper: 'Immediate review',
            tone: 'default',
        },
        {
            label: 'Open Investigations',
            value: incidents.filter((incident) =>
                ['REPORTED', 'UNVERIFIED', 'INVESTIGATING', 'VERIFIED'].includes(incident.status)
            ).length,
            helper: 'Needs action',
            tone: 'default',
        },
        {
            label: 'Resolved',
            value: incidents.filter((incident) => String(incident.status || '').toUpperCase() === 'RESOLVED')
                .length,
            helper: 'Closed safely',
            tone: 'subtle',
        },
    ];

    return (
        <div className="flex flex-col gap-6 pb-2">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[35px] font-bold tracking-tight text-primary-dark">Incident Center</h1>
                    
                </div>

                <div className="flex flex-wrap gap-2">
                    
                    <button
                        type="button"
                        onClick={handleExportQueue}
                        disabled={loading || incidents.length === 0}
                        className="inline-flex items-center gap-2 rounded-2xl border border-primary-medium px-4 py-3 text-[13px] font-semibold text-primary-dark transition hover:bg-primary-light/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowUpRight size={15} />
                        Export Queue
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => (
                    <IncidentMetricCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        helper={card.helper}
                        tone={card.tone}
                    />
                ))}
            </div>

            <IncidentFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                type={type}
                onTypeChange={setType}
                status={status}
                onStatusChange={setStatus}
                severity={severity}
                onSeverityChange={setSeverity}
                typeOptions={incidentTypes}
                statusOptions={incidentStatuses}
                severityOptions={incidentSeverities}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                }}
            />

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
                <div className="space-y-3">
                    {loading && (
                        <div className="rounded-2xl border border-border-light bg-white px-4 py-3 text-[13px] text-primary-dark shadow-premium">
                            <span className="inline-flex items-center gap-2 font-medium">
                                <LoaderCircle size={14} className="animate-spin" />
                                Loading incidents from database...
                            </span>
                        </div>
                    )}
                    {error && (
                        <div className="rounded-2xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a] shadow-premium">
                            {error}
                        </div>
                    )}
                    <IncidentList
                        incidents={paginatedIncidents}
                        selectedIncidentId={selectedIncident?._id}
                        onSelect={(incident) => setSelectedIncidentId(incident._id)}
                    />
                </div>

                <aside className="space-y-5">
                    <div className="rounded-[28px] bg-primary-dark p-6 text-white shadow-premium">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                <ShieldAlert size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                                    Active Record
                                </p>
                                <h2 className="text-[22px] font-semibold tracking-tight">
                                    {selectedIncident?.type.replaceAll('_', ' ') ?? 'No incident selected'}
                                </h2>
                            </div>
                        </div>

                        {selectedIncident ? (
                            <div className="mt-6 space-y-5">
                                <div>
                                    <p className="text-[12px] text-white/65">Description</p>
                                    <p className="mt-2 text-[14px] leading-7 text-white/85">
                                        {selectedIncident.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-[12px] text-white/80">
                                    <div className="rounded-2xl bg-white/8 p-4">
                                        <p className="text-white/55">Protected Area</p>
                                        <p className="mt-1 font-semibold text-white">{selectedIncident.protectedArea.name}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/8 p-4">
                                        <p className="text-white/55">Zone</p>
                                        <p className="mt-1 font-semibold text-white">{selectedIncident.zone.name}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/8 p-4">
                                        <p className="text-white/55">Severity</p>
                                        <p className="mt-1 font-semibold text-white">{selectedIncident.severity}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/8 p-4">
                                        <p className="text-white/55">Status</p>
                                        <p className="mt-1 font-semibold text-white">
                                            {selectedIncident.status.replaceAll('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-[12px] text-white/70">
                                        <CalendarClock size={14} />
                                        <span>{formatDate(selectedIncident.incidentDate)}</span>
                                    </div>
                                    <p className="mt-3 text-[13px] text-white/80">
                                        Reported by <span className="font-semibold text-white">{selectedIncident.reportedBy.fullName}</span>
                                    </p>
                                </div>

                                <div className="border-t border-white/15 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirmOpen(true)}
                                        disabled={Boolean(deletingId)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ff8787]/50 bg-[#c92a2a]/35 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-[#c92a2a]/55 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Trash2 size={16} />
                                        {deletingId === selectedIncident._id ? 'Deleting…' : 'Delete incident'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-6 text-[14px] text-white/75">
                                No incident is available for the selected filters.
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            {!loading && !error && totalFiltered > 0 && (
                <div className="rounded-[28px] border border-border-light bg-white px-5 py-4 shadow-premium">
                    <ListPaginationFooter
                        totalItems={totalFiltered}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        countSuffix="incidents"
                    />
                </div>
            )}

            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Delete incident report?"
                message="Are you sure you want to delete the incident report? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                tone="danger"
                loading={Boolean(deletingId)}
                onConfirm={confirmDeleteIncident}
                onCancel={() => {
                    if (!deletingId) setDeleteConfirmOpen(false);
                }}
            />
        </div>
    );
};

export default IncidentsPage;
