
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Simple helper if we don't want to add dependency just yet
const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const StoreProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/store-login" replace />;
    }

    const payload = parseJwt(token);
    // Check if role is store (or admin can also access POS? Maybe admin should login as store to use POS properly)
    // For now, let's allow "store" role.
    if (!payload || payload.role !== "store") {
        // If logged in as Admin, redirect to Admin dashboard?
        // Or if invalid, login.
        if (payload?.role === "admin") {
            // Admin shouldn't really be using POS directly without selecting a store context
            // But for now, let's block admin from POS unless we implement "Admin acting as Store"
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/store-login" replace />;
    }

    return <Outlet />;
};

export default StoreProtectedRoute;
