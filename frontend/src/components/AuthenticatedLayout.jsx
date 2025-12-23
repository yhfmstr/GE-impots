import { useLocation, Link } from 'react-router-dom';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import ChatWidget from '@/components/ChatWidget';
import { ChatProvider } from '@/lib/chatContext';
import { useAuth } from '@/lib/auth';

// Map routes to breadcrumb labels
const routeLabels = {
  '/': 'Accueil',
  '/declaration': 'Déclaration',
  '/documents': 'Documents',
  '/results': 'Résultats',
  '/wizard': 'Déclaration guidée',
  '/profile': 'Profil',
  '/profile/update': 'Modifier le profil',
  '/admin': 'Administration',
  '/admin/users': 'Utilisateurs',
  '/admin/declarations': 'Déclarations',
  '/admin/settings': 'Paramètres',
};

// Get breadcrumb items from current path
function getBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      path: currentPath,
      label,
    });
  }
  
  return breadcrumbs;
}

export function AuthenticatedLayout({ children }) {
  const location = useLocation();
  const { profile } = useAuth();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  
  // Get current page title
  const currentPageTitle = routeLabels[location.pathname] || 'Page';

  return (
    <ChatProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header with sidebar trigger and breadcrumbs */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">Accueil</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.length > 0 && location.pathname !== '/' && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    {breadcrumbs.map((crumb, index) => (
                      <BreadcrumbItem key={crumb.path}>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <>
                            <BreadcrumbLink asChild>
                              <Link to={crumb.path}>{crumb.label}</Link>
                            </BreadcrumbLink>
                            <BreadcrumbSeparator className="hidden md:block" />
                          </>
                        )}
                      </BreadcrumbItem>
                    ))}
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* Main content area */}
          <div className="flex flex-1 flex-col gap-4 overflow-auto isolate">
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </div>
        </SidebarInset>
        <ChatWidget />
      </SidebarProvider>
    </ChatProvider>
  );
}

export default AuthenticatedLayout;

