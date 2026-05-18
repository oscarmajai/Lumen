import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/app/context/AuthContext';
import { Lightbulb } from 'lucide-react';

interface Props {
  allowedRoles?: Array<'OWNER' | 'ADMIN' | 'EMPLOYEE'>;
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, isLoading, user, mustChangePassword } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center animate-pulse">
            <Lightbulb className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (mustChangePassword && pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
