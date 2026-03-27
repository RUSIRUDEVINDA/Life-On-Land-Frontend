import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarClock, FilePlus2, LoaderCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IncidentMetricCard from '../../features/incidents/components/IncidentMetricCard';
import IncidentFilters from '../../features/incidents/components/IncidentFilters';
import IncidentList from '../../features/incidents/components/IncidentList';
import {
    incidentSeverities,
    incidentStatuses,
    incidentTypes,
} from '../../features/incidents/data/incidents';
import { fetchIncidents } from '../../features/incidents/api/incidentsApi';

const formatDate = (value) =>
    new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

const IncidentsPage = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [type, setType] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [severity, setSeverity] = useState('ALL');
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);

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

    const selectedIncident =
        filteredIncidents.find((incident) => incident._id === selectedIncidentId) ??
        filteredIncidents[0] ??
        null;

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
            value: incidents.filter((incident) => incident.status === 'RESOLVED').length,
            helper: 'Closed safely',
            tone: 'subtle',
        },
    ];

    return (
        <div className="flex flex-col gap-6 pb-2">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Incident Center</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Frontend structure aligned to the backend incident module: report creation, review, filtering, and status tracking.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate('/dashboard/incidents/report')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary-dark px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-black"
                    >
                        <FilePlus2 size={15} />
                        Report Incident
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-primary-medium px-4 py-3 text-[13px] font-semibold text-primary-dark transition hover:bg-primary-light/10">
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
                        incidents={filteredIncidents}
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
                                        Reported by <span className="font-semibold text-white">{selectedIncident.reportedBy.fullName}</span> ({selectedIncident.reportedBy.username})
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-6 text-[14px] text-white/75">
                                No incident is available for the selected filters.
                            </p>
                        )}
                    </div>

                    <div className="rounded-[28px] border border-border-light bg-white p-6 shadow-premium">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-gray">
                            Backend Request Shape
                        </p>
                        <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-primary-dark">
                            `POST /api/incidents`
                        </h3>
                        <div className="mt-4 rounded-2xl bg-bg-soft p-4 font-mono text-[12px] leading-6 text-primary-dark">
                            <p>{'{'}</p>
                            <p className="pl-4">&quot;type&quot;: &quot;POACHING&quot;,</p>
                            <p className="pl-4">&quot;description&quot;: &quot;Gunshots heard near river boundary.&quot;,</p>
                            <p className="pl-4">&quot;zoneId&quot;: &quot;69976248d112d1320744ef41&quot;,</p>
                            <p className="pl-4">&quot;protectedAreaId&quot;: &quot;69975c61d112d1320744ef20&quot;,</p>
                            <p className="pl-4">&quot;incidentDate&quot;: &quot;2026-02-27T17:30:00.000Z&quot;,</p>
                            <p className="pl-4">&quot;severity&quot;: &quot;CRITICAL&quot;,</p>
                            <p className="pl-4">&quot;evidence&quot;: [&quot;https://...&quot;],</p>
                            <p className="pl-4">&quot;notes&quot;: &quot;Ranger unit dispatched.&quot;</p>
                            <p>{'}'}</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default IncidentsPage;
