import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/lib/chatContext';
import { loadSecure, STORAGE_KEYS } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  MessageSquare,
  Calculator,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';

// Calculate declaration completion percentage
function calculateProgress(taxData) {
  if (!taxData) return 0;

  const sections = [
    { key: 'personal', weight: 15 },
    { key: 'income', weight: 25 },
    { key: 'deductions', weight: 25 },
    { key: 'wealth', weight: 20 },
    { key: 'grossSalary', weight: 15 },
  ];

  let completed = 0;
  sections.forEach(({ key, weight }) => {
    if (taxData[key] && Object.keys(taxData[key]).length > 0) {
      completed += weight;
    } else if (taxData[key] !== undefined && taxData[key] !== null && taxData[key] !== '') {
      completed += weight;
    }
  });

  return Math.min(100, completed);
}

// Get declaration status
function getDeclarationStatus(progress) {
  if (progress === 0) return { label: 'Non commencée', color: 'text-muted-foreground', icon: Clock };
  if (progress < 50) return { label: 'En cours', color: 'text-warning', icon: AlertCircle };
  if (progress < 100) return { label: 'Presque terminée', color: 'text-info', icon: TrendingUp };
  return { label: 'Complète', color: 'text-success', icon: CheckCircle2 };
}

// Calculate days until deadline
function getDaysUntilDeadline() {
  const deadline = new Date('2026-03-31');
  const today = new Date();
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { openChat } = useChat();

  // Load declaration data from storage
  const taxData = loadSecure(STORAGE_KEYS.TAX_DATA) || {};
  const extractions = loadSecure(STORAGE_KEYS.EXTRACTIONS) || [];

  const progress = calculateProgress(taxData);
  const status = getDeclarationStatus(progress);
  const daysLeft = getDaysUntilDeadline();
  const StatusIcon = status.icon;

  // Get user's first name for greeting
  const firstName = profile?.first_name || profile?.email?.split('@')[0] || 'Utilisateur';

  // Quick actions based on progress
  const quickActions = [
    {
      title: 'Déclaration guidée',
      description: 'Assistant pas à pas',
      icon: Sparkles,
      href: '/wizard',
      variant: 'default',
      highlight: progress === 0,
    },
    {
      title: 'Mes documents',
      description: `${extractions.length} document${extractions.length !== 1 ? 's' : ''} importé${extractions.length !== 1 ? 's' : ''}`,
      icon: FolderOpen,
      href: '/documents',
      variant: 'outline',
    },
    {
      title: 'Déclaration directe',
      description: 'Formulaire complet',
      icon: FileText,
      href: '/declaration',
      variant: 'outline',
    },
    {
      title: 'Assistant fiscal',
      description: 'Poser une question',
      icon: MessageSquare,
      onClick: openChat,
      variant: 'outline',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Déclaration fiscale 2024 - Canton de Genève
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Declaration Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression</CardTitle>
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="mt-2" />
            <p className={`text-xs mt-2 ${status.color}`}>
              {status.label}
            </p>
          </CardContent>
        </Card>

        {/* Days Until Deadline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai de dépôt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysLeft}</div>
            <p className="text-xs text-muted-foreground mt-2">
              jours restants (31 mars 2026)
            </p>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extractions.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {extractions.length === 0 ? 'Aucun document' : extractions.length === 1 ? 'document importé' : 'documents importés'}
            </p>
          </CardContent>
        </Card>

        {/* Estimation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimation</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress >= 50 ? '~' : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {progress >= 50 ? 'Voir résultats' : 'Compléter pour estimer'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actions rapides</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const CardWrapper = action.href ? Link : 'button';
            const wrapperProps = action.href
              ? { to: action.href }
              : { onClick: action.onClick, type: 'button' };

            return (
              <Card
                key={action.title}
                className={`group hover:border-primary/50 transition-colors ${action.highlight ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <CardWrapper {...wrapperProps} className="block w-full text-left">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <action.icon className={`h-5 w-5 ${action.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </CardWrapper>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Getting Started / Next Steps */}
      {progress < 100 && (
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {progress === 0 ? 'Commencer votre déclaration' : 'Continuer votre déclaration'}
            </CardTitle>
            <CardDescription>
              {progress === 0
                ? 'Notre assistant vous guide étape par étape pour compléter votre déclaration fiscale en toute simplicité.'
                : `Vous avez complété ${progress}% de votre déclaration. Continuez pour finaliser.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/wizard">
                  {progress === 0 ? 'Commencer' : 'Continuer'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {progress === 0 && (
                <Button variant="outline" asChild>
                  <Link to="/documents">
                    <Upload className="mr-2 h-4 w-4" />
                    Importer des documents
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed State */}
      {progress === 100 && (
        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Déclaration complète
            </CardTitle>
            <CardDescription>
              Votre déclaration est prête. Vous pouvez consulter vos résultats ou effectuer des modifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/results">
                  <Calculator className="mr-2 h-4 w-4" />
                  Voir mes résultats
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/declaration">
                  <FileText className="mr-2 h-4 w-4" />
                  Modifier ma déclaration
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Besoin d'aide?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="sm" onClick={openChat}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Poser une question
          </Button>
          <p className="text-sm text-muted-foreground self-center">
            Notre assistant fiscal est disponible 24/7 pour répondre à vos questions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
