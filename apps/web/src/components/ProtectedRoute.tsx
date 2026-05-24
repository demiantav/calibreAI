import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-secondary">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user hasn't completed onboarding, redirect to the appropriate step
  if (!user?.onboarding_completed && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to={`/onboarding?step=${user?.onboarding_step || 1}`} replace />;
  }

  return <>{children}</>;
}
