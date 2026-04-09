import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAnimals, deleteAnimal } from '../api/animalsApi';

export const useAnimals = (params) => {
    return useQuery({
        queryKey: ['animals', params],
        queryFn: () => getAnimals(params),
        keepPreviousData: true,
    });
};

export const useDeleteAnimal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tagId) => deleteAnimal(tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['animals'] });
        },
    });
};
