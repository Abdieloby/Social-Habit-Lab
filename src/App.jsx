import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeedPage from './pages/Feed';
import SquadPage from './pages/Squad';
import StorePage from './pages/Store';
import ProfilePage from './pages/Profile';
import Toast from './components/ui/Toast';
import { Zap } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { authUser, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Zap className="animate-pulse text-indigo-500" size={32} /></div>;
    if (!authUser) return <Navigate to="/login" replace />;
    return children ? children : <Outlet />;
};

const AppRoutes = () => {
    return (
        <>
            <Toast />
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="feed" element={<FeedPage />} />
                    <Route path="squad" element={<SquadPage />} />
                    <Route path="store" element={<StorePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>
            </Routes>
        </>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <UIProvider>
                    <AppRoutes />
                </UIProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
