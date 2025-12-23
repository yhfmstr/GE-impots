import { useLocation, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText,
  FolderOpen,
  Calculator,
  Shield,
  Users,
  LayoutDashboard,
  Settings,
  Home,
  Sparkles,
} from 'lucide-react';

import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth';

// Navigation items for regular users
const mainNavItems = [
  {
    title: 'Accueil',
    url: '/',
    icon: Home,
  },
  {
    title: 'Déclaration',
    url: '/declaration',
    icon: FileText,
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FolderOpen,
  },
  {
    title: 'Résultats',
    url: '/results',
    icon: Calculator,
  },
];

// Quick actions
const quickActions = [
  {
    title: 'Déclaration guidée',
    url: '/wizard',
    icon: Sparkles,
  },
];

// Admin navigation items
const adminNavItems = [
  {
    title: 'Tableau de bord',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Utilisateurs',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Déclarations',
    url: '/admin/declarations',
    icon: FileText,
  },
  {
    title: 'Paramètres',
    url: '/admin/settings',
    icon: Settings,
  },
];

export function AppSidebar({ ...props }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie', {
      description: 'À bientôt!'
    });
    navigate('/');
  };

  const userData = {
    name: profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.email?.split('@')[0] || 'Utilisateur',
    email: profile?.email || user?.email || '',
    avatar: '', // Could be profile?.avatar_url
    role: profile?.role || 'user',
  };

  const isActive = (url) => {
    if (url === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white font-bold">
                  GE
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GE-Impôts</span>
                  <span className="truncate text-xs text-muted-foreground">Canton de Genève</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  isActive={isActive(item.url)}
                >
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions rapides</SidebarGroupLabel>
          <SidebarMenu>
            {quickActions.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  isActive={isActive(item.url)}
                >
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>
                <Shield className="mr-2 h-4 w-4" />
                Administration
              </SidebarGroupLabel>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      isActive={isActive(item.url)}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} onSignOut={handleSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;

