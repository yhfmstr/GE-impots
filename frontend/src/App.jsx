import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/auth/ProtectedRoute';
import { ProfileFreshnessGuard } from './components/auth/ProfileFreshnessGuard';

// Pages
import Home from './pages/Home';
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
  const isStandalone = STANDALONE_ROUTES.some(route => location.pathname.startsWith(route));
  const isAdminRoute = location.pathname.startsWith('/admin');

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

  // Admin routes
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

  // Main app routes with Layout
  return (
    <ProfileFreshnessGuard>
      <Layout>
        <Routes>
          {/* Public home page */}
          <Route path="/" element={<Home />} />

          {/* Protected routes */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/declaration" element={
            <ProtectedRoute>
              <GuidePage />
            </ProtectedRoute>
          } />
          <Route path="/guide" element={<Navigate to="/declaration" replace />} />
          <Route path="/wizard" element={
            <ProtectedRoute>
              <WizardPage />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } />

          {/* Profile routes */}
          <Route path="/profile/update" element={
            <ProtectedRoute>
              <ProfileUpdatePage />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ProfileFreshnessGuard>
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
