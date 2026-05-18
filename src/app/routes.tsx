import { createBrowserRouter, Navigate } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import MainDashboard from './pages/MainDashboard';
import LumenStation from './pages/LumenStation';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },

  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },

  // Protected — any authenticated user
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard',        element: <MainDashboard /> },
      { path: '/lumen-station',    element: <LumenStation /> },
      { path: '/settings',         element: <Settings /> },
      { path: '/change-password',  element: <ChangePassword /> },
    ],
  },

  // Protected — OWNER or ADMIN only
  {
    element: <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />,
    children: [
      { path: '/admin', element: <AdminPanel /> },
    ],
  },
]);
