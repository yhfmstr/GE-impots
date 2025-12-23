import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, DECLARATION_STATUS } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const STATUS_COLORS = {
  [DECLARATION_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [DECLARATION_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [DECLARATION_STATUS.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
  [DECLARATION_STATUS.UNDER_REVIEW]: 'bg-purple-100 text-purple-800',
  [DECLARATION_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [DECLARATION_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  [DECLARATION_STATUS.DRAFT]: 'Brouillon',
  [DECLARATION_STATUS.IN_PROGRESS]: 'En cours',
  [DECLARATION_STATUS.SUBMITTED]: 'Soumise',
  [DECLARATION_STATUS.UNDER_REVIEW]: 'En révision',
  [DECLARATION_STATUS.APPROVED]: 'Approuvée',
  [DECLARATION_STATUS.REJECTED]: 'Rejetée',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeclarations: 0,
    submittedDeclarations: 0,
    pendingReviews: 0,
  });
  const [recentDeclarations, setRecentDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const { data: statsData } = await db.admin.getStats();
      if (statsData) {
        setStats(statsData);
      }

      // Load recent declarations
      const { data: declarations } = await db.admin.getAllDeclarations(1, 5, null, null);
      if (declarations) {
        setRecentDeclarations(declarations);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      description: 'Comptes enregistrés',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Déclarations',
      value: stats.totalDeclarations,
      icon: FileText,
      description: 'Total toutes années',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Soumises',
      value: stats.submittedDeclarations,
      icon: CheckCircle,
      description: 'En attente de traitement',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'À réviser',
      value: stats.pendingReviews,
      icon: Clock,
      description: 'Nécessitent une action',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de l'activité de la plateforme
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {loading ? '—' : stat.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Declarations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Déclarations récentes</CardTitle>
              <CardDescription>Dernières soumissions</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/declarations">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentDeclarations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune déclaration</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeclarations.map((declaration) => (
                  <div
                    key={declaration.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {declaration.profiles?.first_name
                          ? `${declaration.profiles.first_name} ${declaration.profiles.last_name || ''}`
                          : declaration.profiles?.email || 'Utilisateur'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Année {declaration.tax_year}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[declaration.status]}>
                      {STATUS_LABELS[declaration.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Tâches fréquentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/declarations?status=submitted">
                <Clock className="h-4 w-4 mr-3" />
                Voir les déclarations en attente
                {stats.submittedDeclarations > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.submittedDeclarations}
                  </Badge>
                )}
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/declarations?status=under_review">
                <AlertCircle className="h-4 w-4 mr-3" />
                Révisions en cours
                {stats.pendingReviews > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.pendingReviews}
                  </Badge>
                )}
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/users">
                <Users className="h-4 w-4 mr-3" />
                Gérer les utilisateurs
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/declarations?status=approved">
                <CheckCircle className="h-4 w-4 mr-3" />
                Déclarations approuvées
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
