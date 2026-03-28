import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token && !user) {
        // Not logged in or session missing, redirect to login page
        return <Navigate to="/login" replace />;
    }



    // Authenticated, render child routes (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;
