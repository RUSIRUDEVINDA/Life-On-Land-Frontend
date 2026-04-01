import React, { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Binoculars,
    CalendarClock,
    ClipboardList,
    Compass,
    Leaf,
    LoaderCircle,
    MapPin,
    ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAssignedPatrols } from '../../features/patrols/api/patrolsApi';
import { getMovementSummary } from '../../features/movements/api/movementsApi';
import { fetchIncidentsByReporter } from '../../features/incidents/api/incidentsApi';
import { getUserId } from '../../utils/auth';

const STATUS_LABELS = {
    IN_PROGRESS: 'In Progress',
    PLANNED: 'Planned',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ label, value, hint, icon: Icon, tone = 'default' }) => {
    const palette =
        tone === 'alert'
            ? {
                card: 'bg-[#fff5f5] border-[#E63946]/30 text-[#a4161a]',
                chip: 'bg-[#ffe3e3] text-[#a4161a]',
            }
            : tone === 'active'
                ? {
                    card: 'bg-[#ecfdf3] border-[#2b8a3e]/25 text-[#1f6d31]',
                    chip: 'bg-[#d3f9d8] text-[#1f6d31]',
                }
                : {
                    card: 'bg-white border-border-light text-primary-dark',
                    chip: 'bg-bg-soft text-primary-dark',
                };
    return (
        <div className={`rounded-[22px] border px-5 py-4 shadow-premium ${palette.card}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-90">{label}</p>
                <span className={`rounded-lg p-1.5 ${palette.chip}`}>
                    <Icon size={14} />
                </span>
            </div>
            <p className="text-[24px] font-bold leading-none">{value}</p>
            <p className="mt-1 text-[11px] opacity-75">{hint}</p>
        </div>
    );
};

const RangerDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [assignedPatrols, setAssignedPatrols] = useState([]);
    const [movementSummary, setMovementSummary] = useState(null);
    const [myIncidentsCount, setMyIncidentsCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            try {
                const myUserId = getUserId();
                const [patrols, summary, myIncidents] = await Promise.all([
                    fetchAssignedPatrols(),
                    getMovementSummary().catch(() => null),
                    fetchIncidentsByReporter(myUserId).catch(() => []),
                ]);
                setAssignedPatrols(Array.isArray(patrols) ? patrols : []);
                setMovementSummary(summary);
                setMyIncidentsCount(Array.isArray(myIncidents) ? myIncidents.length : 0);
            } catch (requestError) {
                setError(requestError.message || 'Failed to load ranger dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const inProgressPatrols = useMemo(
        () => assignedPatrols.filter((patrol) => patrol?.status === 'IN_PROGRESS').length,
        [assignedPatrols]
    );

    const plannedPatrols = useMemo(
        () => assignedPatrols.filter((patrol) => patrol?.status === 'PLANNED').length,
        [assignedPatrols]
    );

    const movementLogCount = useMemo(() => {
        if (typeof movementSummary?.pagination?.total === 'number') return movementSummary.pagination.total;
        if (Array.isArray(movementSummary?.data)) return movementSummary.data.length;
        return 0;
    }, [movementSummary]);

    const hotspotZone = useMemo(() => {
        const first = Array.isArray(movementSummary?.data) ? movementSummary.data[0] : null;
        return first?.zoneDetails?.name || first?._id || 'No hotspot detected';
    }, [movementSummary]);

    const patrolsByStatus = useMemo(
        () =>
            assignedPatrols.reduce((acc, patrol) => {
                const status = patrol?.status || 'PLANNED';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {}),
        [assignedPatrols]
    );

    const upcomingPatrols = useMemo(() => {
        const toMillis = (value) => {
            const ms = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
            return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
        };

        return [...assignedPatrols]
            .sort((a, b) => toMillis(a?.plannedStart) - toMillis(b?.plannedStart))
            .slice(0, 4);
    }, [assignedPatrols]);

    const formatDateTime = (value) => {
        if (!value) return 'Not scheduled';
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(value));
    };

    return (
        <div className="mx-auto w-full max-w-6xl py-2">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-primary-dark">Ranger Dashboard</h1>
                    <p className="mt-1 text-[14px] text-text-gray">
                        Wildlife field operations, patrol readiness, and movement activity in one place.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[#2b8a3e]/30 bg-[#ecfdf3] px-4 py-2 text-[12px] font-semibold text-[#1f6d31]">
                    <ShieldCheck size={14} />
                    Ranger Operations View
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-border-light bg-white shadow-premium">
                    <div className="flex items-center gap-2 text-[13px] text-text-gray">
                        <LoaderCircle size={15} className="animate-spin" />
                        Loading ranger insights...
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            label="Assigned Patrols"
                            value={assignedPatrols.length}
                            hint={`${plannedPatrols} planned`}
                            icon={ClipboardList}
                        />
                        <StatCard
                            label="In Progress"
                            value={inProgressPatrols}
                            hint="Active field operations"
                            icon={Binoculars}
                            tone="active"
                        />
                        <StatCard
                            label="Movement Logs"
                            value={movementLogCount}
                            hint="Latest telemetry records"
                            icon={Activity}
                        />
                        <StatCard
                            label="Hotspot Zone"
                            value={hotspotZone}
                            hint="Most recent movement concentration"
                            icon={AlertTriangle}
                            tone="alert"
                        />
                        <Link
                            to="/dashboard/my-incidents"
                            className="rounded-[22px] border border-border-light bg-white px-5 py-4 shadow-premium transition hover:-translate-y-0.5 hover:shadow-elevated"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-gray">Incidents</p>
                                <span className="rounded-lg bg-bg-soft p-1.5 text-primary-dark">
                                    <AlertTriangle size={14} />
                                </span>
                            </div>
                            <p className="text-[24px] font-bold leading-none text-primary-dark">{myIncidentsCount}</p>
                            <p className="mt-1 text-[11px] text-text-gray">Tap to view your reported incidents</p>
                        </Link>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                        <div className="rounded-[24px] border border-border-light bg-white p-5 shadow-premium">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-[16px] font-semibold text-primary-dark">Upcoming Assigned Patrols</h2>
                                <Link
                                    to="/dashboard/patrols"
                                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary-dark"
                                >
                                    View all
                                    <ArrowRight size={13} />
                                </Link>
                            </div>

                            {upcomingPatrols.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-border-light bg-bg-soft px-4 py-6 text-center text-[13px] text-text-gray">
                                    No assigned patrols available right now.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingPatrols.map((patrol) => {
                                        const patrolId = patrol?._id || patrol?.id || `${patrol?.title || 'patrol'}-${patrol?.plannedStart || ''}`;
                                        const status = patrol?.status || 'PLANNED';
                                        const locationHint =
                                            patrol?.protectedAreaId?.name ||
                                            patrol?.protectedArea?.name ||
                                            patrol?.protectedAreaName ||
                                            'Protected Area';

                                        return (
                                            <Link
                                                key={patrolId}
                                                to={`/dashboard/patrols/${patrolId}`}
                                                className="block rounded-2xl border border-border-light bg-bg-soft px-4 py-3 transition-all hover:bg-white hover:shadow-premium group"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-[14px] font-semibold text-primary-dark group-hover:text-primary transition-colors">
                                                            {patrol?.title || 'Patrol Mission'}
                                                        </p>
                                                        <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-text-gray">
                                                            <MapPin size={12} />
                                                            {locationHint}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-primary-dark border border-border-light">
                                                        {STATUS_LABELS[status] || status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-text-gray">
                                                    <CalendarClock size={12} />
                                                    {formatDateTime(patrol?.plannedStart)}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[24px] border border-border-light bg-white p-5 shadow-premium">
                                <h2 className="text-[16px] font-semibold text-primary-dark">Wildlife Risk Snapshot</h2>
                                <div className="mt-3 space-y-2">
                                    {Object.entries(patrolsByStatus).map(([status, count]) => (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between rounded-xl bg-bg-soft px-3 py-2 text-[12px]"
                                        >
                                            <span className="font-medium text-primary-dark">{STATUS_LABELS[status] || status}</span>
                                            <span className="font-semibold text-text-gray">{count}</span>
                                        </div>
                                    ))}
                                    {Object.keys(patrolsByStatus).length === 0 && (
                                        <div className="rounded-xl bg-bg-soft px-3 py-2 text-[12px] text-text-gray">
                                            No patrol status data yet.
                                        </div>
                                    )}
                                </div>
                                <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#2b8a3e]">
                                    <Compass size={13} />
                                    Focus patrol attention around <span className="font-semibold">{hotspotZone}</span>.
                                </p>
                            </div>

                            <div className="rounded-[24px] border border-border-light bg-white p-5 shadow-premium">
                                <h2 className="text-[16px] font-semibold text-primary-dark">Quick Actions</h2>
                                <div className="mt-3 grid gap-2 text-[13px] font-semibold">
                                    <Link
                                        to="/dashboard/incidents/report"
                                        className="rounded-xl border border-border-light bg-bg-soft px-4 py-3 text-primary-dark transition hover:bg-white"
                                    >
                                        Report New Incident
                                    </Link>
                                    <Link
                                        to="/dashboard/patrols"
                                        className="rounded-xl border border-border-light bg-bg-soft px-4 py-3 text-primary-dark transition hover:bg-white"
                                    >
                                        View Assigned Patrols
                                    </Link>
                                    <Link
                                        to="/dashboard/movements"
                                        className="rounded-xl border border-border-light bg-bg-soft px-4 py-3 text-primary-dark transition hover:bg-white"
                                    >
                                        Open Animal Movements
                                    </Link>
                                    <div className="mt-2 inline-flex items-center gap-2 text-[12px] text-[#2b8a3e]">
                                        <Leaf size={14} />
                                        Keep disturbance low and maintain silent patrol zones near wildlife hotspots.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RangerDashboardPage;


