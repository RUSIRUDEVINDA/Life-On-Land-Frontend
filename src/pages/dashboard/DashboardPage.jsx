import React, { useEffect, useState } from 'react';
import { Plus, TreePine, ShieldAlert, Compass, Cat, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../../components/dashboard/StatsCard';
import LiveMap from '../../components/dashboard/LiveMap';
import AlertCard from '../../components/dashboard/AlertCard';
import RecentMovements from '../../components/dashboard/RecentMovements';
import PatrolList from '../../components/dashboard/PatrolList';
import RiskOverview from '../../components/dashboard/RiskOverview';
import IncidentCard from '../../components/dashboard/IncidentCard';
import { protectedAreaService } from '../../services/protectedAreaService';
import { getAnimals } from '../../features/animals/api/animalsApi';
import { fetchPatrols } from '../../features/patrols/api/patrolsApi';
import { fetchAlerts } from '../../features/alerts/api/alertsApi';
import { fetchRiskMapByProtectedArea } from '../../features/risk-map/api/riskMapApi';
import { getMovements } from '../../features/movements/api/movementsApi';
import { fetchRecentIncidents } from '../../features/incidents/api/incidentsApi';

const CLOSED_ALERT_STATUSES = new Set(['RESOLVED', 'CLOSED', 'DISMISSED']);

/** Many APIs reject limit > 50 or 100 with 400; keep in sync with backend pagination rules. */
const OVERVIEW_LIST_LIMIT = 50;

const formatInt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0');

const patrolSortPriority = (p) => {
    const s = String(p?.status || '').toUpperCase();
    if (s === 'IN_PROGRESS') return 0;
    if (s === 'PLANNED') return 1;
    return 2;
};

const mapPatrolForDashboardList = (patrol, index) => {
    const status = String(patrol?.status || '').toUpperCase();
    const displayStatus =
        status === 'IN_PROGRESS'
            ? 'Patrolling'
            : status === 'PLANNED'
              ? 'Standby'
              : status === 'COMPLETED'
                ? 'Completed'
                : status === 'CANCELLED'
                  ? 'Cancelled'
                  : status.replace(/_/g, ' ') || 'Unknown';

    let displayName = patrol?.title || 'Patrol';
    const ids = patrol?.assignedRangerIds;
    if (Array.isArray(ids) && ids.length > 0) {
        const first = ids[0];
        if (first && typeof first === 'object') {
            displayName = first.name || first.fullName || first.username || displayName;
        }
    }

    const words = String(displayName).trim().split(/\s+/).filter(Boolean);
    const initials =
        words.length >= 2
            ? `${words[0][0] || ''}${words[words.length - 1][0] || ''}`.toUpperCase()
            : String(displayName).slice(0, 2).toUpperCase() || 'P';

    const pa = patrol?.protectedAreaId;
    const zone =
        (typeof pa === 'object' && pa?.name) ||
        patrol?.protectedArea?.name ||
        patrol?.zoneName ||
        'Zone TBD';

    const rangersCount = Array.isArray(patrol?.assignedRangerIds) ? patrol.assignedRangerIds.length : 0;
    const unitLabel = rangersCount ? `${rangersCount} ranger${rangersCount === 1 ? '' : 's'}` : 'Patrol';

    return {
        id: String(patrol?._id || patrol?.id || index),
        name: displayName,
        initials,
        unit: unitLabel,
        zone,
        status: displayStatus,
        color: index % 2 === 0 ? 'bg-primary-light' : 'bg-primary-medium/40',
    };
};

const formatRelativeTimeShort = (value) => {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return '—';
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 45) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
};

const RECENT_MOVEMENT_SWATCHES = ['bg-[#fab005]', 'bg-primary-medium', 'bg-primary-light'];

const mapMovementForRecentList = (move, index) => {
    const tagId = move?.tagId || move?.id || 'Unknown';
    const zone = move?.zoneName || move?.zone?.name || 'Unknown zone';
    const pa = move?.protectedAreaName || move?.protectedArea?.name || '';
    const description = pa ? `${zone} · ${pa}` : zone;
    const ts = move?.timestamp || move?.createdAt;
    return {
        id: String(move?.id || move?._id || `${tagId}-${ts || index}`),
        name: `Tag "${String(tagId)}"`,
        description,
        time: ts ? formatRelativeTimeShort(ts) : '—',
        statusColor: RECENT_MOVEMENT_SWATCHES[index % RECENT_MOVEMENT_SWATCHES.length],
    };
};

const formatIncidentTypeTitle = (type) => {
    if (!type || type === 'OTHER') return 'Incident reported';
    return String(type)
        .split('_')
        .map((w) => (w ? w.charAt(0) + w.slice(1).toLowerCase() : ''))
        .join(' ');
};

const DashboardPage = () => {
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState('');
    const [overview, setOverview] = useState({
        totalHectares: 0,
        areaCount: 0,
        zoneCount: 0,
        animalTotal: 0,
        activePatrols: 0,
        patrolTotal: 0,
        pendingAlerts: 0,
    });
    const [patrolListItems, setPatrolListItems] = useState([]);
    const [riskBuckets, setRiskBuckets] = useState({ safe: 0, elevated: 0, unassigned: 0 });
    const [recentMovements, setRecentMovements] = useState([]);
    const [recentIncident, setRecentIncident] = useState(null);
    const [liveMapMovements, setLiveMapMovements] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const loadOverview = async () => {
            setStatsLoading(true);
            setStatsError('');

            const [areasResult, animalsResult, patrolsResult, alertsResult, movementsResult, incidentsResult] =
                await Promise.allSettled([
                    protectedAreaService.getProtectedAreas(),
                    getAnimals({ page: 1, limit: OVERVIEW_LIST_LIMIT }),
                    fetchPatrols({ limit: OVERVIEW_LIST_LIMIT }),
                    fetchAlerts({ limit: OVERVIEW_LIST_LIMIT }),
                    getMovements({ page: 1, limit: OVERVIEW_LIST_LIMIT }),
                    fetchRecentIncidents(OVERVIEW_LIST_LIMIT),
                ]);

            if (cancelled) return;

            let totalHectares = 0;
            let areaCount = 0;
            let zoneCount = 0;

            if (areasResult.status === 'fulfilled') {
                const areas = areasResult.value;
                areaCount = areas.length;
                totalHectares = areas.reduce((sum, a) => {
                    const km2 = Number(a.areaSize) || 0;
                    return sum + km2 * 100;
                }, 0);

                const zoneLists = await Promise.allSettled(
                    areas.map((a) => protectedAreaService.getZonesByProtectedAreaId(a.id))
                );
                zoneCount = zoneLists.reduce((sum, zr) => {
                    if (zr.status === 'fulfilled' && Array.isArray(zr.value)) return sum + zr.value.length;
                    return sum;
                }, 0);
            }

            let animalTotal = 0;
            if (animalsResult.status === 'fulfilled') {
                const body = animalsResult.value;
                animalTotal =
                    body?.pagination?.total ??
                    body?.total ??
                    (Array.isArray(body?.data) ? body.data.length : 0);
            }

            let activePatrols = 0;
            let patrolTotal = 0;
            if (patrolsResult.status === 'fulfilled' && Array.isArray(patrolsResult.value)) {
                const list = patrolsResult.value;
                patrolTotal = list.length;
                activePatrols = list.filter((p) => String(p?.status || '').toUpperCase() === 'IN_PROGRESS').length;
            }

            let pendingAlerts = 0;
            if (alertsResult.status === 'fulfilled' && Array.isArray(alertsResult.value)) {
                pendingAlerts = alertsResult.value.filter((a) => {
                    const s = String(a?.status || 'NEW').toUpperCase();
                    return !CLOSED_ALERT_STATUSES.has(s);
                }).length;
            }

            let patrolRows = [];
            if (patrolsResult.status === 'fulfilled' && Array.isArray(patrolsResult.value)) {
                patrolRows = [...patrolsResult.value]
                    .filter((p) => {
                        const s = String(p?.status || '').toUpperCase();
                        return s === 'IN_PROGRESS' || s === 'PLANNED';
                    })
                    .sort((a, b) => patrolSortPriority(a) - patrolSortPriority(b))
                    .slice(0, 6)
                    .map(mapPatrolForDashboardList);
            }
            if (!cancelled) {
                setPatrolListItems(patrolRows);
            }

            let safe = 0;
            let elevated = 0;
            let unassigned = 0;
            let sawAnyRiskRow = false;
            if (areasResult.status === 'fulfilled' && areasResult.value.length > 0) {
                const riskOutcomes = await Promise.allSettled(
                    areasResult.value.map((a) => fetchRiskMapByProtectedArea(a.id))
                );
                if (!cancelled) {
                    riskOutcomes.forEach((ro) => {
                        if (ro.status !== 'fulfilled') return;
                        const zones = ro.value?.zones || [];
                        zones.forEach((z) => {
                            sawAnyRiskRow = true;
                            const L = String(z?.riskLevel || '').toUpperCase();
                            if (L === 'LOW') safe += 1;
                            else if (L === 'CRITICAL' || L === 'HIGH' || L === 'MEDIUM') elevated += 1;
                            else unassigned += 1;
                        });
                    });
                    if (!sawAnyRiskRow && zoneCount > 0) {
                        unassigned = zoneCount;
                    }
                    setRiskBuckets({ safe, elevated, unassigned });
                }
            } else if (!cancelled) {
                setRiskBuckets({ safe: 0, elevated: 0, unassigned: 0 });
            }

            let sortedMovementsRaw = [];
            if (!cancelled) {
                if (movementsResult.status === 'fulfilled') {
                    const raw = movementsResult.value?.data || [];
                    sortedMovementsRaw = [...raw].sort((a, b) => {
                        const ta = new Date(b?.timestamp || b?.createdAt || 0).getTime();
                        const tb = new Date(a?.timestamp || a?.createdAt || 0).getTime();
                        return ta - tb;
                    });
                    setRecentMovements(sortedMovementsRaw.slice(0, 3).map(mapMovementForRecentList));
                } else {
                    setRecentMovements([]);
                }

                if (incidentsResult.status === 'fulfilled') {
                    const list = incidentsResult.value;
                    setRecentIncident(Array.isArray(list) && list.length > 0 ? list[0] : null);
                } else {
                    setRecentIncident(null);
                }

                setLiveMapMovements(
                    sortedMovementsRaw.slice(0, 10).map((m, i) => ({
                        id: String(m.id || m._id || m.tagId || `m-${i}`),
                        tagId: m.tagId != null ? String(m.tagId) : '—',
                        lat: Number(m.lat ?? m.latitude),
                        lng: Number(m.lng ?? m.longitude),
                    }))
                );
            }

            const overviewRequests = [
                { label: 'protected areas', result: areasResult },
                { label: 'animals', result: animalsResult },
                { label: 'patrols', result: patrolsResult },
                { label: 'alerts', result: alertsResult },
            ];
            const failed = overviewRequests.filter(({ result }) => result.status === 'rejected');
            if (failed.length === 4) {
                setStatsError('Could not load overview metrics. Check your connection and try again.');
            } else if (failed.length > 0) {
                const names = failed.map(({ label }) => label).join(', ');
                const firstReason =
                    failed[0].result.status === 'rejected' ? failed[0].result.reason?.message || '' : '';
                setStatsError(
                    firstReason
                        ? `Could not load ${names} (${firstReason}). Other numbers are still shown.`
                        : `Could not load ${names}. Other numbers are still shown.`
                );
            }

            setOverview({
                totalHectares,
                areaCount,
                zoneCount,
                animalTotal,
                activePatrols,
                patrolTotal,
                pendingAlerts,
            });
            setStatsLoading(false);
        };

        loadOverview();
        return () => {
            cancelled = true;
        };
    }, []);

    const protectedTrend =
        overview.areaCount === 0
            ? 'No protected areas yet'
            : `${formatInt(overview.zoneCount)} Zones Active · ${formatInt(overview.areaCount)} areas`;

    const patrolTrend =
        overview.patrolTotal === 0
            ? 'No patrols scheduled'
            : `${formatInt(overview.patrolTotal)} in system · ${formatInt(overview.activePatrols)} in progress`;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end mb-0.5">
                <div className="mb-0">
                    <h1 className="text-[22px] font-semibold text-primary-dark mb-0.5 tracking-tighter">Overview</h1>
                    <p className="text-text-gray text-[12px]">Monitor protected areas, animals, movements, and alerts.</p>
                </div>
                <div className="flex gap-2 pb-1">
                    <Link
                        to="/dashboard/protected-areas"
                        className="bg-primary-medium text-white border-none px-3.5 py-2 rounded-2xl text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-primary-dark"
                    >
                        <span>Protected Areas</span>
                    </Link>
                    <Link
                        to="/dashboard/incidents/report"
                        className="bg-primary-dark text-white border-none px-3.5 py-2 rounded-2xl text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-black"
                    >
                        <Plus size={14} /> <span>Log Incident</span>
                    </Link>
                    <Link
                        to="/dashboard/incidents"
                        className="bg-transparent text-primary-dark border border-primary-medium px-3.5 py-2 rounded-2xl text-[12px] font-medium flex items-center gap-1.5 transition-colors hover:bg-primary-light/10"
                    >
                        <span>Export Report</span>
                    </Link>
                </div>
            </div>

            {statsError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                    {statsError}
                </div>
            )}

            <div className="grid grid-cols-4 gap-3">
                <StatsCard
                    title="Protected Areas"
                    value={statsLoading ? '—' : formatInt(overview.totalHectares)}
                    unit="ha"
                    icon={TreePine}
                    trend={statsLoading ? 'Loading…' : protectedTrend}
                    isDark={true}
                />
                <StatsCard
                    title="Tracked Animals"
                    value={statsLoading ? '—' : formatInt(overview.animalTotal)}
                    icon={Cat}
                    trend={statsLoading ? 'Loading…' : 'In wildlife registry'}
                />
                <StatsCard
                    title="Active Patrols"
                    value={statsLoading ? '—' : formatInt(overview.activePatrols)}
                    icon={Compass}
                    trend={statsLoading ? 'Loading…' : patrolTrend}
                />
                <StatsCard
                    title="Pending Alerts"
                    value={statsLoading ? '—' : formatInt(overview.pendingAlerts)}
                    icon={ShieldAlert}
                    trend={statsLoading ? 'Loading…' : overview.pendingAlerts > 0 ? 'Requires review' : 'All clear'}
                    trendColor={
                        statsLoading
                            ? 'text-[#868e96]'
                            : overview.pendingAlerts > 0
                              ? 'text-[#E63946] font-semibold'
                              : 'text-[#868e96]'
                    }
                />
            </div>

            {statsLoading && (
                <div className="flex items-center gap-2 text-[12px] text-text-gray -mt-1">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    <span>Refreshing metrics from the server…</span>
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                <LiveMap movements={liveMapMovements} loading={statsLoading} />
                <div className="flex flex-col gap-3 col-span-1">
                    <AlertCard
                        title="Critical Alert"
                        type="Perimeter Breach"
                        location="Zone C (North Edge)"
                        time="12 mins ago"
                        actionLabel="Dispatch Patrol"
                    />
                    <RecentMovements movements={recentMovements} loading={statsLoading} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <PatrolList patrols={patrolListItems} loading={statsLoading} />
                <RiskOverview
                    safe={riskBuckets.safe}
                    elevated={riskBuckets.elevated}
                    unassigned={riskBuckets.unassigned}
                    loading={statsLoading}
                />
                <IncidentCard
                    loading={statsLoading}
                    title={
                        recentIncident
                            ? formatIncidentTypeTitle(recentIncident.type)
                            : ''
                    }
                    description={
                        recentIncident
                            ? recentIncident.description?.trim() ||
                              `${recentIncident.zone?.name || 'Unknown zone'} · ${recentIncident.protectedArea?.name || 'Unknown area'}`
                            : ''
                    }
                    time={
                        recentIncident
                            ? `Reported ${formatRelativeTimeShort(recentIncident.createdAt)}`
                            : ''
                    }
                    incidentId={recentIncident?._id || ''}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
