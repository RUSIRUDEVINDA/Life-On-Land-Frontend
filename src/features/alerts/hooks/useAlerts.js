import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, updateAlertStatus } from '../api/alertsApi';

export const useAlerts = () => {
    return useQuery({
        queryKey: ['alerts'],
        queryFn: fetchAlerts,
    });
};

export const useUpdateAlertStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => updateAlertStatus(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
};
