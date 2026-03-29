export const getStoredUser = () => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    try {
        const parsed = JSON.parse(rawUser);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

export const getUserRole = () => {
    const role = getStoredUser()?.role;
    return String(role || '').trim().toUpperCase();
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = getStoredUser();
    return Boolean(token || user);
};

export const getUserId = () => {
    const user = getStoredUser();
    const id = user?._id ?? user?.id;
    return id ? String(id) : '';
};

export const getDefaultDashboardPathByRole = (role) => {
    const normalized = String(role || getUserRole()).trim().toUpperCase();
    return normalized === 'RANGER' ? '/dashboard/ranger' : '/dashboard/admin';
};

