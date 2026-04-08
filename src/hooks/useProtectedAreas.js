import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { protectedAreaService } from '../services/protectedAreaService';

export const useProtectedAreas = () => {
    return useQuery({
        queryKey: ['protected-areas'],
        queryFn: () => protectedAreaService.getProtectedAreas(),
    });
};

export const useProtectedArea = (id) => {
    return useQuery({
        queryKey: ['protected-areas', id],
        queryFn: () => protectedAreaService.getProtectedAreaById(id),
        enabled: !!id,
    });
};

export const useCreateProtectedArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => protectedAreaService.createProtectedArea(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['protected-areas'] });
        },
    });
};

export const useUpdateProtectedArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => protectedAreaService.updateProtectedArea(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['protected-areas'] });
            queryClient.invalidateQueries({ queryKey: ['protected-areas', variables.id] });
        },
    });
};

export const useDeleteProtectedArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => protectedAreaService.deleteProtectedArea(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['protected-areas'] });
        },
    });
};

export const useZones = (areaId) => {
    return useQuery({
        queryKey: ['zones', areaId],
        queryFn: () => protectedAreaService.getZonesByProtectedAreaId(areaId),
        enabled: !!areaId,
    });
};

export const useCreateZone = (areaId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => protectedAreaService.createZone(areaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones', areaId] });
        },
    });
};

export const useUpdateZone = (areaId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ zoneId, data }) => protectedAreaService.updateZone(areaId, zoneId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones', areaId] });
        },
    });
};

export const useDeleteZone = (areaId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (zoneId) => protectedAreaService.deleteZone(areaId, zoneId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones', areaId] });
        },
    });
};
