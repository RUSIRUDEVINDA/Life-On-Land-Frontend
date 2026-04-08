import React, { useEffect, useState } from 'react';
import { Plus, TreePine, ShieldAlert, Compass, Cat, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../../components/dashboard/StatsCard';
import BarChartCard from '../../components/dashboard/BarChartCard';
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
import { useDashboardOverview } from '../../hooks/useDashboardData';

const CLOSED_ALERT_STATUSES = new Set(['RESOLVED', 'CLOSED', 'DISMISSED']);

/** Many APIs reject limit > 50 or 100 with 400; keep in sync with backend pagination rules. */
const OVERVIEW_LIST_LIMIT = 50;

const formatInt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0');

const normalizeLookupId = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        return String(value._id || value.id || '');
    }
    return '';
};

const patrolSortPriority = (p) => {
    const s = String(p?.status || '').toUpperCase();
    if (s === 'IN_PROGRESS') return 0;
    if (s === 'PLANNED') return 1;
    return 2;
};

const mapPatrolForDashboardList = (patrol, index, zoneLookup = {}, areaLookup = {}) => {
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

    const areaId = normalizeLookupId(patrol?.protectedAreaId || patrol?.protectedArea);
    const zoneId = normalizeLookupId(Array.isArray(patrol?.zoneIds) ? patrol.zoneIds[0] : patrol?.zoneId);
    const zone =
        patrol?.zoneName ||
        (typeof patrol?.zone === 'object' ? patrol.zone?.name : '') ||
        zoneLookup[zoneId] ||
        'Zone TBD';

    const resolvedArea =
        patrol?.protectedArea?.name ||
        (typeof patrol?.protectedAreaId === 'object' ? patrol.protectedAreaId?.name : '') ||
        areaLookup[areaId] ||
        '';

    const rangersCount = Array.isArray(patrol?.assignedRangerIds) ? patrol.assignedRangerIds.length : 0;
    const unitLabel = rangersCount ? `${rangersCount} ranger${rangersCount === 1 ? '' : 's'}` : 'Patrol';

    return {
        id: String(patrol?._id || patrol?.id || index),
        name: displayName,
        initials,
        unit: unitLabel,
        zone: resolvedArea ? `${zone} - ${resolvedArea}` : zone,
        status: displayStatus,
        color: index % 2 === 0 ? 'bg-primary-light' : 'bg-primary-medium/40',
    };
};

const formatRelativeTimeShort = (value) => {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return '--';
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

const mapMovementForRecentList = (move, index, zoneLookup = {}, areaLookup = {}, zoneAreaLookup = {}) => {
    const tagId = move?.tagId || move?.id || 'Unknown';
    const zoneId = normalizeLookupId(move?.zoneId || move?.zone);
    const areaId = normalizeLookupId(move?.protectedAreaId || move?.protectedArea) || zoneAreaLookup[zoneId] || '';
    const zone =
        move?.zoneName ||
        move?.zone?.name ||
        zoneLookup[zoneId] ||
        'Unknown zone';
    const pa =
        move?.protectedAreaName ||
        move?.protectedArea?.name ||
        areaLookup[areaId] ||
        '';
    const description = pa ? `${zone} - ${pa}` : zone;
    const ts = move?.timestamp || move?.createdAt;
    return {
        id: String(move?.id || move?._id || `${tagId}-${ts || index}`),
        name: `Tag "${String(tagId)}"`,
        description,
        time: ts ? formatRelativeTimeShort(ts) : '--',
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
    const dashboard = useDashboardOverview();
    const {
        areas: areasQuery,
        animals: animalsQuery,
        patrols: patrolsQuery,
        alerts: alertsQuery,
        movements: movementsQuery,
        incidents: incidentsQuery,
        zones: zonesQueries,
        riskMaps: riskMapQueries,
        isLoading: statsLoading,
        error: dashboardError
    } = dashboard;

    const statsError = dashboardError?.message || '';

    // Data Processing derived from queries
    const processedData = React.useMemo(() => {
        let totalHectares = 0;
        let areaCount = 0;
        let zoneCount = 0;
        let areaLookup = {};
        let zoneLookup = {};
        let zoneAreaLookup = {};
        let riskByZoneId = {};

        // Process Areas
        if (areasQuery.data) {
            const areas = areasQuery.data;
            areaLookup = areas.reduce((acc, area) => {
                if (area?.id) acc[area.id] = area.name || 'Unknown Area';
                return acc;
            }, {});
            areaCount = areas.length;
            totalHectares = areas.reduce((sum, a) => {
                const km2 = Number(a.areaSize) || 0;
                return sum + km2 * 100;
            }, 0);
        }

        // Process Zones (from parallel queries)
        zonesQueries.forEach((zr) => {
            if (zr.data && Array.isArray(zr.data)) {
                zoneCount += zr.data.length;
                zr.data.forEach((zone) => {
                    if (!zone?.id) return;
                    zoneLookup[zone.id] = zone.name || 'Unknown Zone';
                    zoneAreaLookup[zone.id] = zone.protectedAreaId || '';
                });
            }
        });

        // Process Animals
        let animalTotal = 0;
        if (animalsQuery.data) {
            const body = animalsQuery.data;
            const animalsList = Array.isArray(body?.data) ? body.data : (Array.isArray(body?.animals) ? body.animals : (Array.isArray(body) ? body : []));
            animalTotal = body?.pagination?.total ?? body?.total ?? animalsList.length;
        }

        // Process Patrols
        let activePatrols = 0;
        let patrolTotal = 0;
        let patrolBars = [];
        let patrolListItems = [];
        if (patrolsQuery.data && Array.isArray(patrolsQuery.data)) {
            const list = patrolsQuery.data;
            patrolTotal = list.length;
            activePatrols = list.filter((p) => String(p?.status || '').toUpperCase() === 'IN_PROGRESS').length;

            const counts = { IN_PROGRESS: 0, PLANNED: 0, COMPLETED: 0, CANCELLED: 0 };
            list.forEach((patrol) => {
                const status = String(patrol?.status || 'PLANNED').toUpperCase();
                if (counts[status] !== undefined) counts[status] += 1;
            });
            patrolBars = [
                { label: 'In Progress', value: counts.IN_PROGRESS, color: '#2a5a45' },
                { label: 'Planned', value: counts.PLANNED, color: '#91c4a5' },
                { label: 'Completed', value: counts.COMPLETED, color: '#adb5bd' },
                { label: 'Cancelled', value: counts.CANCELLED, color: '#E63946' },
            ];

            patrolListItems = [...list]
                .filter((p) => {
                    const s = String(p?.status || '').toUpperCase();
                    return s === 'IN_PROGRESS' || s === 'PLANNED';
                })
                .sort((a, b) => patrolSortPriority(a) - patrolSortPriority(b))
                .slice(0, 6)
                .map((patrol, index) => mapPatrolForDashboardList(patrol, index, zoneLookup, areaLookup));
        }

        // Process Alerts
        let pendingAlerts = 0;
        let latestAlert = null;
        if (alertsQuery.data && Array.isArray(alertsQuery.data)) {
            const list = alertsQuery.data;
            pendingAlerts = list.filter((a) => {
                const s = String(a?.status || 'NEW').toUpperCase();
                return !CLOSED_ALERT_STATUSES.has(s);
            }).length;

            const sorted = [...list].sort((a, b) => {
                const ta = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
                const tb = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
                return ta - tb;
            });
            const top = sorted[0];
            if (top) {
                const zoneId = normalizeLookupId(top?.zoneId || top?.zone);
                const areaId = normalizeLookupId(top?.protectedAreaId || top?.protectedArea) || zoneAreaLookup[zoneId] || '';
                latestAlert = {
                    ...top,
                    zoneName: top?.zoneName || zoneLookup[zoneId] || 'Unknown zone',
                    protectedAreaName: top?.protectedAreaName || areaLookup[areaId] || 'Unknown area',
                };
            }
        }

        // Process Risk Maps
        let safe = 0, elevated = 0, unassigned = 0;
        let sawAnyRiskRow = false;
        riskMapQueries.forEach((ro) => {
            if (ro.data) {
                const zones = ro.data?.zones || [];
                zones.forEach((z) => {
                    sawAnyRiskRow = true;
                    const L = String(z?.riskLevel || '').toUpperCase();
                    const zoneId = normalizeLookupId(z?.zoneId || z?.zone || z?._id || z?.id);
                    if (zoneId) riskByZoneId[zoneId] = L || 'UNASSIGNED';
                    if (L === 'LOW') safe += 1;
                    else if (['CRITICAL', 'HIGH', 'MEDIUM'].includes(L)) elevated += 1;
                    else unassigned += 1;
                });
            }
        });
        if (!sawAnyRiskRow && zoneCount > 0) unassigned = zoneCount;

        // Process Movements
        let recentMovements = [];
        let movementBars = [];
        if (movementsQuery.data) {
            const raw = Array.isArray(movementsQuery.data?.data) ? movementsQuery.data.data : (Array.isArray(movementsQuery.data) ? movementsQuery.data : []);
            const sortedMovementsRaw = [...raw].sort((a, b) => {
                const ta = new Date(b?.timestamp || b?.createdAt || 0).getTime();
                const tb = new Date(a?.timestamp || a?.createdAt || 0).getTime();
                return ta - tb;
            });
            recentMovements = sortedMovementsRaw.slice(0, 3).map((move, index) => mapMovementForRecentList(move, index, zoneLookup, areaLookup, zoneAreaLookup));

            const riskCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
            sortedMovementsRaw.forEach((move) => {
                const zoneId = normalizeLookupId(move?.zoneId || move?.zone);
                const riskLevel = String(riskByZoneId[zoneId] || '').toUpperCase();
                if (riskCounts[riskLevel] !== undefined) riskCounts[riskLevel] += 1;
            });
            const totalRisk = Object.values(riskCounts).reduce((sum, v) => sum + v, 0);
            movementBars = totalRisk === 0 ? [] : [
                { label: 'Critical', value: riskCounts.CRITICAL, color: '#E63946' },
                { label: 'High', value: riskCounts.HIGH, color: '#f76707' },
                { label: 'Medium', value: riskCounts.MEDIUM, color: '#fab005' },
                { label: 'Low', value: riskCounts.LOW, color: '#2a5a45' },
            ];
        }

        // Process Incidents
        let recentIncident = null;
        let incidentBars = [];
        if (incidentsQuery.data) {
            const list = Array.isArray(incidentsQuery.data) ? incidentsQuery.data : [];
            const enriched = list.map((incident) => {
                const zoneId = normalizeLookupId(incident?.zone?.id || incident?.zoneId);
                const areaId = normalizeLookupId(incident?.protectedArea?.id || incident?.protectedAreaId) || zoneAreaLookup[zoneId] || '';
                return {
                    ...incident,
                    zone: { ...(incident.zone || {}), name: incident?.zone?.name && !/unknown/i.test(incident.zone.name) ? incident.zone.name : zoneLookup[zoneId] || 'Unknown zone' },
                    protectedArea: { ...(incident.protectedArea || {}), name: incident?.protectedArea?.name && !/unknown/i.test(incident.protectedArea.name) ? incident.protectedArea.name : areaLookup[areaId] || 'Unknown area' },
                };
            });
            recentIncident = enriched.length > 0 ? enriched[0] : null;

            const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
            enriched.forEach((incident) => {
                const sev = String(incident?.severity || 'LOW').toUpperCase();
                if (severityCounts[sev] !== undefined) severityCounts[sev] += 1;
            });
            incidentBars = [
                { label: 'Low', value: severityCounts.LOW, color: '#2a5a45' },
                { label: 'Medium', value: severityCounts.MEDIUM, color: '#fab005' },
                { label: 'High', value: severityCounts.HIGH, color: '#f76707' },
                { label: 'Critical', value: severityCounts.CRITICAL, color: '#E63946' },
            ];
        }

        return {
            overview: { totalHectares, areaCount, zoneCount, animalTotal, activePatrols, patrolTotal, pendingAlerts },
            patrolListItems,
            riskBuckets: { safe, elevated, unassigned },
            recentMovements,
            recentIncident,
            latestAlert,
            incidentBars,
            movementBars,
            patrolBars
        };
    }, [areasQuery.data, animalsQuery.data, patrolsQuery.data, alertsQuery.data, movementsQuery.data, incidentsQuery.data, zonesQueries, riskMapQueries]);

    const {
        overview,
        patrolListItems,
        riskBuckets,
        recentMovements,
        recentIncident,
        latestAlert,
        incidentBars,
        movementBars,
        patrolBars
    } = processedData;

    const protectedTrend =
        overview.areaCount === 0
            ? 'No protected areas yet'
            : `${formatInt(overview.zoneCount)} Zones Active - ${formatInt(overview.areaCount)} areas`;

    const patrolTrend =
        overview.patrolTotal === 0
            ? 'No patrols scheduled'
            : `${formatInt(overview.patrolTotal)} in system - ${formatInt(overview.activePatrols)} in progress`;

    const alertSeverityLabel = latestAlert?.severity
        ? String(latestAlert.severity).toUpperCase()
        : '';
    const alertTitle = latestAlert
        ? `${alertSeverityLabel || 'New'} Alert`
        : 'No Alerts';
    const alertType = latestAlert
        ? latestAlert.type === 'INCIDENT'
            ? 'Incident Alert'
            : 'Movement Alert'
        : 'All clear';
    const alertLocation = latestAlert
        ? `${latestAlert.zoneName || 'Unknown zone'} - ${latestAlert.protectedAreaName || 'Unknown area'}`
        : 'No active alerts';
    const alertTime = latestAlert?.createdAt
        ? formatRelativeTimeShort(latestAlert.createdAt)
        : '--';
    const alertActionLabel = latestAlert ? 'View Alert' : 'View Alerts';

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
                    value={statsLoading ? '--' : formatInt(overview.totalHectares)}
                    unit="ha"
                    icon={TreePine}
                    trend={statsLoading ? 'Loading...' : protectedTrend}
                    isDark={true}
                />
                <StatsCard
                    title="Tracked Animals"
                    value={statsLoading ? '--' : formatInt(overview.animalTotal)}
                    icon={Cat}
                    trend={statsLoading ? 'Loading...' : 'In wildlife registry'}
                />
                <StatsCard
                    title="Active Patrols"
                    value={statsLoading ? '--' : formatInt(overview.activePatrols)}
                    icon={Compass}
                    trend={statsLoading ? 'Loading...' : patrolTrend}
                />
                <StatsCard
                    title="Pending Alerts"
                    value={statsLoading ? '--' : formatInt(overview.pendingAlerts)}
                    icon={ShieldAlert}
                    trend={statsLoading ? 'Loading...' : overview.pendingAlerts > 0 ? 'Requires review' : 'All clear'}
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
                    <span>Refreshing metrics from the server...</span>
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                <BarChartCard
                    title="Movement Risk Overview"
                    subtitle="Latest movements by risk tier"
                    items={movementBars}
                    loading={statsLoading}
                    emptyLabel="No movement logs yet."
                />
                <BarChartCard
                    title="Incident Severity"
                    subtitle="Reported incidents by severity"
                    items={incidentBars}
                    loading={statsLoading}
                    emptyLabel="No incidents reported yet."
                />
                <BarChartCard
                    title="Patrol Status"
                    subtitle="Current patrol activity"
                    items={patrolBars}
                    loading={statsLoading}
                    emptyLabel="No patrols scheduled yet."
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                    <RecentMovements movements={recentMovements} loading={statsLoading} />
                </div>
                <AlertCard
                    title={statsLoading ? 'Loading Alerts' : alertTitle}
                    type={statsLoading ? 'Fetching latest alerts' : alertType}
                    location={statsLoading ? 'Please wait' : alertLocation}
                    time={statsLoading ? '--' : alertTime}
                    actionLabel={alertActionLabel}
                    actionTo="/dashboard/alerts"
                />
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
                            `${recentIncident.zone?.name || 'Unknown zone'} - ${recentIncident.protectedArea?.name || 'Unknown area'}`
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
