import api from '../../../utils/api';

export const getAnimals = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/animals?${query}`);
};

export const getAnimalById = async (tagId) => {
    return api(`/animals/${tagId}`);
};

export const createAnimal = async (animalData) => {
    return api('/animals', {
        method: 'POST',
        body: JSON.stringify(animalData)
    });
};

export const updateAnimal = async (tagId, animalData) => {
    return api(`/animals/${tagId}`, {
        method: 'PUT',
        body: JSON.stringify(animalData)
    });
};

export const deleteAnimal = async (tagId) => {
    return api(`/animals/${tagId}`, {
        method: 'DELETE'
    });
};
