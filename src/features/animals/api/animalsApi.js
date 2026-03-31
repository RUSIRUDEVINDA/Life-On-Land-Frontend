import api from '../../../utils/api';

export const getAnimals = async (params = {}) => {
    // Strip empty/undefined values so they don't pollute the query string
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const query = new URLSearchParams(cleanParams).toString();
    return api(`/animals${query ? `?${query}` : ''}`);
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
