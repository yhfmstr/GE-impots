import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route Component
 * Redirects unauthenticated users to login
 * Redirects users who need onboarding to the onboarding page
 */
export function ProtectedRoute({ children }) {
  const { user, loading, needsOnboarding, isConfigured } = useAuth();
  const location = useLocation();

  // If Supabase is not configured, allow access (dev mode)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed (except if already on onboarding page)
  if (needsOnboarding && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

/**
 * Admin Route Component
 * Only allows access to users with admin or super_admin role
 */
export function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin, isConfigured } = useAuth();
  const location = useLocation();

  // If Supabase is not configured, allow access (dev mode)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Public Route Component
 * Redirects authenticated users away from auth pages (login, signup)
 */
export function PublicRoute({ children }) {
  const { user, loading, needsOnboarding, isConfigured } = useAuth();
  const location = useLocation();

  // If Supabase is not configured, show the page
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to intended destination or home
  if (user) {
    const from = location.state?.from?.pathname || '/';

    // If needs onboarding, redirect there
    if (needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
