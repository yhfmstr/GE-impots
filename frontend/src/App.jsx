import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import { AuthProvider, useAuth } from './lib/auth';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/auth/ProtectedRoute';
import { ProfileFreshnessGuard } from './components/auth/ProfileFreshnessGuard';

// Pages
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import ResultsPage from './pages/ResultsPage';
import GuidePage from './pages/GuidePage';
import WizardPage from './pages/WizardPage';
import ProfilerPage from './pages/ProfilerPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';

// Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Profile
import ProfileUpdatePage from './pages/profile/ProfileUpdatePage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminDeclarationsPage from './pages/admin/DeclarationsPage';

// Routes that don't use the main Layout
const STANDALONE_ROUTES = ['/start', '/login', '/signup', '/forgot-password', '/auth/callback', '/onboarding'];

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isStandalone = STANDALONE_ROUTES.some(route => location.pathname.startsWith(route));
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Show nothing while loading auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Standalone routes (no layout)
  if (isStandalone) {
    return (
      <Routes>
        <Route path="/start" element={<ProfilerPage />} />

        {/* Auth routes - public only */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Onboarding - protected but no layout */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
      </Routes>
    );
  }

  // Admin routes - use their own admin layout
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="declarations" element={<AdminDeclarationsPage />} />
        </Route>
      </Routes>
    );
  }

  // Authenticated users get the new sidebar layout
  if (isAuthenticated) {
    return (
      <ProfileFreshnessGuard>
        <AuthenticatedLayout>
          <Routes>
            {/* Dashboard for authenticated users */}
            <Route path="/" element={<DashboardPage />} />

            {/* Protected routes */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/declaration" element={<GuidePage />} />
            <Route path="/guide" element={<Navigate to="/declaration" replace />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/results" element={<ResultsPage />} />

            {/* Profile routes */}
            <Route path="/profile/update" element={<ProfileUpdatePage />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthenticatedLayout>
      </ProfileFreshnessGuard>
    );
  }

  // Non-authenticated users get the original public layout
  return (
    <Layout>
      <Routes>
        {/* Public home page */}
        <Route path="/" element={<Home />} />

        {/* Redirect protected routes to login */}
        <Route path="/chat" element={<Navigate to="/login" replace />} />
        <Route path="/declaration" element={<Navigate to="/login" replace />} />
        <Route path="/guide" element={<Navigate to="/login" replace />} />
        <Route path="/wizard" element={<Navigate to="/login" replace />} />
        <Route path="/documents" element={<Navigate to="/login" replace />} />
        <Route path="/results" element={<Navigate to="/login" replace />} />
        <Route path="/profile/update" element={<Navigate to="/login" replace />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
