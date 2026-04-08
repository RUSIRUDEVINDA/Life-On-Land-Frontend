import { useQuery, useQueries } from '@tanstack/react-query';
import { protectedAreaService } from '../services/protectedAreaService';
import { getAnimals } from '../features/animals/api/animalsApi';
import { fetchPatrols } from '../features/patrols/api/patrolsApi';
import { fetchAlerts } from '../features/alerts/api/alertsApi';
import { fetchRiskMapByProtectedArea } from '../features/risk-map/api/riskMapApi';
import { getMovements } from '../features/movements/api/movementsApi';
import { fetchRecentIncidents } from '../features/incidents/api/incidentsApi';

const OVERVIEW_LIST_LIMIT = 50;

export const useDashboardOverview = () => {
    // Stage 1: Primary data
    const areasQuery = useQuery({
        queryKey: ['protected-areas'],
        queryFn: () => protectedAreaService.getProtectedAreas(),
    });

    const animalsQuery = useQuery({
        queryKey: ['animals', { limit: OVERVIEW_LIST_LIMIT }],
        queryFn: () => getAnimals({ page: 1, limit: OVERVIEW_LIST_LIMIT }),
    });

    const patrolsQuery = useQuery({
        queryKey: ['patrols', { limit: OVERVIEW_LIST_LIMIT }],
        queryFn: () => fetchPatrols({ limit: OVERVIEW_LIST_LIMIT }),
    });

    const alertsQuery = useQuery({
        queryKey: ['alerts', { limit: OVERVIEW_LIST_LIMIT }],
        queryFn: () => fetchAlerts({ limit: OVERVIEW_LIST_LIMIT }),
    });

    const movementsQuery = useQuery({
        queryKey: ['movements', { limit: OVERVIEW_LIST_LIMIT }],
        queryFn: () => getMovements({ page: 1, limit: OVERVIEW_LIST_LIMIT }),
    });

    const incidentsQuery = useQuery({
        queryKey: ['incidents', { limit: OVERVIEW_LIST_LIMIT }],
        queryFn: () => fetchRecentIncidents(OVERVIEW_LIST_LIMIT),
    });

    // Stage 2: Dependent data (Zones and Risk Maps for each area)
    const areas = areasQuery.data || [];

    const zonesQueries = useQueries({
        queries: areas.map(area => ({
            queryKey: ['zones', area.id],
            queryFn: () => protectedAreaService.getZonesByProtectedAreaId(area.id),
            enabled: !!area.id,
        }))
    });

    const riskMapQueries = useQueries({
        queries: areas.map(area => ({
            queryKey: ['risk-map', area.id],
            queryFn: () => fetchRiskMapByProtectedArea(area.id),
            enabled: !!area.id,
        }))
    });

    const isLoading =
        areasQuery.isLoading ||
        animalsQuery.isLoading ||
        patrolsQuery.isLoading ||
        alertsQuery.isLoading ||
        movementsQuery.isLoading ||
        incidentsQuery.isLoading;

    const error =
        areasQuery.error ||
        animalsQuery.error ||
        patrolsQuery.error ||
        alertsQuery.error ||
        movementsQuery.error ||
        incidentsQuery.error;

    return {
        areas: areasQuery,
        animals: animalsQuery,
        patrols: patrolsQuery,
        alerts: alertsQuery,
        movements: movementsQuery,
        incidents: incidentsQuery,
        zones: zonesQueries,
        riskMaps: riskMapQueries,
        isLoading,
        error
    };
};
