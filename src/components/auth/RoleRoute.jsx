import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getDefaultDashboardPathByRole, getUserRole } from '../../utils/auth';

const RoleRoute = ({ allowedRoles = [], fallbackPath }) => {
    const currentRole = getUserRole();
    const normalizedAllowed = allowedRoles.map((role) => String(role).toUpperCase());

    if (!normalizedAllowed.includes(currentRole)) {
        return <Navigate to={fallbackPath || getDefaultDashboardPathByRole(currentRole)} replace />;
    }

    return <Outlet />;
};

export default RoleRoute;
