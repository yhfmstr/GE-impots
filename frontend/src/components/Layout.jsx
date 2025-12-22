import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, FileText, Upload, Calculator, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { path: '/chat', icon: MessageSquare, label: 'Assistant' },
  { path: '/declaration', icon: FileText, label: 'Déclaration' },
  { path: '/documents', icon: Upload, label: 'Documents' },
  { path: '/results', icon: Calculator, label: 'Résultats' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen bg-muted">
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

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-lg text-text-secondary hover:bg-secondary transition-colors"
                title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
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
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs text-muted-foreground"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Clair' : 'Sombre'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
