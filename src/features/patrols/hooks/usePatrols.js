import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPatrolById, addCheckIn, updatePatrol, deleteCheckIn } from '../api/patrolsApi';

export const usePatrol = (id) => {
    return useQuery({
        queryKey: ['patrol', id],
        queryFn: () => fetchPatrolById(id),
        enabled: !!id,
    });
};

export const useAddCheckIn = (id) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (checkInData) => addCheckIn(id, checkInData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patrol', id] });
        },
    });
};

export const useUpdatePatrolStatus = (id) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updateData) => updatePatrol(id, updateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patrol', id] });
        },
    });
};

export const useDeleteCheckIn = (id) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (checkInId) => deleteCheckIn(id, checkInId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patrol', id] });
        },
    });
};
