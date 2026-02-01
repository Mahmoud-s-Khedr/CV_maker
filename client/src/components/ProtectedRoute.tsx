import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { getRoleHomePath } from '../lib/roleHome';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps & { allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login, preserving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to role home if role doesn't match
        return <Navigate to={getRoleHomePath(user.role)} replace />;
    }

    return <>{children}</>;
};
