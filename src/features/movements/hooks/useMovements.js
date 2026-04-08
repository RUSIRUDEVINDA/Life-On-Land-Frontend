import { useQuery } from '@tanstack/react-query';
import { getMovements, getMovementSummary } from '../api/movementsApi';

export const useMovements = (params) => {
    return useQuery({
        queryKey: ['movements', params],
        queryFn: () => getMovements(params),
        keepPreviousData: true,
    });
};

export const useMovementSummary = (dateRange) => {
    return useQuery({
        queryKey: ['movement-summary', dateRange],
        queryFn: () => getMovementSummary(dateRange),
        enabled: !!dateRange,
    });
};
