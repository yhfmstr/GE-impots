import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, FileText, Upload, Calculator, Sun, Moon, User, LogOut, Settings, Shield, LogIn } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/chat', icon: MessageSquare, label: 'Assistant' },
  { path: '/declaration', icon: FileText, label: 'Déclaration' },
  { path: '/documents', icon: Upload, label: 'Documents' },
  { path: '/results', icon: Calculator, label: 'Résultats' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, profile, isAuthenticated, isAdmin, signOut, isConfigured } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie', {
      description: 'À bientôt!'
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Aller au contenu principal
      </a>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GE</span>
              </div>
              <span className="font-semibold text-foreground">Impôts Genève</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}

              {/* Admin Link - Only for admins */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'text-text-secondary hover:bg-secondary'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="ml-2"
                title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* User Menu / Login Button */}
              {isConfigured ? (
                isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {profile?.first_name
                              ? `${profile.first_name} ${profile.last_name || ''}`
                              : 'Mon compte'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile/update')}>
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Administration
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="outline" size="sm" className="ml-2">
                    <Link to="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Connexion
                    </Link>
                  </Button>
                )
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs ${
                location.pathname === path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}

          {/* Mobile Admin Link */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs ${
                location.pathname.startsWith('/admin')
                  ? 'text-purple-600'
                  : 'text-muted-foreground'
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin
            </Link>
          )}

          {/* Mobile User/Login */}
          {isConfigured && (
            isAuthenticated ? (
              <Link
                to="/profile/update"
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs text-muted-foreground"
              >
                <User className="w-5 h-5" />
                Profil
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs text-muted-foreground"
              >
                <LogIn className="w-5 h-5" />
                Connexion
              </Link>
            )
          )}

          {/* Mobile Theme Toggle */}
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-xs text-muted-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {isDark ? 'Clair' : 'Sombre'}
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
