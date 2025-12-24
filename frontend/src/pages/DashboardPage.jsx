import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/lib/chatContext';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import { uploadApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  User,
  RefreshCw,
} from 'lucide-react';
import { TaxHistorySection, ComparisonPanel } from '@/components/dashboard';
import { useTaxHistoryStore } from '@/stores/taxHistoryStore';

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

// Calculate profile completion
function calculateProfileCompletion(profile) {
  if (!profile) return { percent: 0, missing: [] };

  const fields = [
    { key: 'first_name', label: 'Prénom', weight: 15 },
    { key: 'last_name', label: 'Nom', weight: 15 },
    { key: 'birth_date', label: 'Date de naissance', weight: 10 },
    { key: 'address', label: 'Adresse', weight: 15 },
    { key: 'postal_code', label: 'NPA', weight: 10 },
    { key: 'city', label: 'Ville', weight: 10 },
    { key: 'marital_status', label: 'État civil', weight: 10 },
    { key: 'numero_contribuable', label: 'N° contribuable', weight: 15 },
  ];

  const missing = [];
  let completed = 0;

  fields.forEach(({ key, label, weight }) => {
    if (profile[key] && profile[key] !== '') {
      completed += weight;
    } else {
      missing.push(label);
    }
  });

  return { percent: Math.min(100, completed), missing };
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { openChat } = useChat();
  const navigate = useNavigate();

  // Tax history store
  const {
    getAvailableYears,
    getMostRecentDeclaration
  } = useTaxHistoryStore();

  // Load declaration data from storage
  const taxData = loadSecure(STORAGE_KEYS.TAX_DATA) || {};
  const extractions = loadSecure(STORAGE_KEYS.EXTRACTIONS) || [];

  const progress = calculateProgress(taxData);
  const status = getDeclarationStatus(progress);
  const daysLeft = getDaysUntilDeadline();
  const StatusIcon = status.icon;

  // Profile completion
  const profileStatus = useMemo(() => calculateProfileCompletion(profile), [profile]);
  const profileLastUpdate = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString('fr-CH')
    : null;

  // Tax history
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.length > 0 ? availableYears[0] : new Date().getFullYear() - 1
  );
  const mostRecentDeclaration = getMostRecentDeclaration();

  // Get user's first name for greeting
  const firstName = profile?.first_name || profile?.email?.split('@')[0] || 'Utilisateur';

  // Handlers
  const handleUploadClick = () => navigate('/documents');
  const handleViewDetails = (type, id) => {
    if (type === 'year') {
      navigate(`/history/${id}`);
    } else if (type === 'bordereau') {
      navigate(`/documents?highlight=${id}`);
    }
  };

  // Handle file drop from TaxHistorySection
  const handleFileDrop = useCallback(async (files) => {
    const { importDeclarationFromExtraction, importBordereauFromExtraction } = useTaxHistoryStore.getState();

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('document', file);

        toast.loading(`Analyse de ${file.name}...`, { id: `upload-${file.name}` });

        const response = await uploadApi.post('/documents/extract-auto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success && response.data.extractedData) {
          const { detectedType, extractedData } = response.data;

          // Save to extractions list
          const saved = loadSecure(STORAGE_KEYS.EXTRACTIONS, []);
          const newExtraction = {
            id: Date.now(),
            type: detectedType,
            fileName: file.name,
            extractedData,
            timestamp: new Date().toISOString()
          };
          saveSecure(STORAGE_KEYS.EXTRACTIONS, [...saved, newExtraction]);

          // Import to tax history store based on type
          if (detectedType === 'declaration-fiscale') {
            importDeclarationFromExtraction(extractedData);
            toast.success(`Déclaration ${extractedData.taxYear || ''} importée`, {
              id: `upload-${file.name}`,
              description: 'Les données ont été ajoutées à votre historique fiscal'
            });
          } else if (detectedType === 'bordereau-icc') {
            importBordereauFromExtraction(extractedData, 'icc');
            toast.success(`Bordereau ICC ${extractedData.taxYear || ''} importé`, {
              id: `upload-${file.name}`,
              description: 'Le bordereau cantonal a été ajouté'
            });
          } else if (detectedType === 'bordereau-ifd') {
            importBordereauFromExtraction(extractedData, 'ifd');
            toast.success(`Bordereau IFD ${extractedData.taxYear || ''} importé`, {
              id: `upload-${file.name}`,
              description: 'Le bordereau fédéral a été ajouté'
            });
          } else {
            toast.success(`Document analysé: ${detectedType}`, {
              id: `upload-${file.name}`,
              description: 'Consultez la page Documents pour plus de détails'
            });
          }
        } else {
          toast.error(`Échec de l'analyse de ${file.name}`, {
            id: `upload-${file.name}`,
            description: response.data.error || 'Type de document non reconnu'
          });
        }
      } catch (err) {
        toast.error(`Erreur: ${file.name}`, {
          id: `upload-${file.name}`,
          description: err.response?.data?.error || err.message || 'Erreur lors de l\'analyse'
        });
      }
    }
  }, []);

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Profile Completion */}
        <Card className={profileStatus.percent < 100 ? 'border-amber-200 dark:border-amber-800' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profil</CardTitle>
            <User className={`h-4 w-4 ${profileStatus.percent === 100 ? 'text-green-500' : 'text-amber-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileStatus.percent}%</div>
            <Progress value={profileStatus.percent} className="mt-2" />
            <div className="flex items-center justify-between mt-2">
              <p className={`text-xs ${profileStatus.percent === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {profileStatus.percent === 100 ? 'Complet' : `${profileStatus.missing.length} champ(s) manquant(s)`}
              </p>
              {profileLastUpdate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {profileLastUpdate}
                </p>
              )}
            </div>
            {profileStatus.percent < 100 && (
              <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                <Link to="/profile/update">Compléter →</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Declaration Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déclaration 2024</CardTitle>
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

      {/* Tax History and Comparison Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tax History Section */}
        <TaxHistorySection
          onUploadClick={handleUploadClick}
          onViewDetails={handleViewDetails}
          onFileDrop={handleFileDrop}
        />

        {/* Comparison Panel */}
        <ComparisonPanel
          selectedYear={selectedYear}
          previousYear={selectedYear > 0 ? selectedYear - 1 : null}
        />
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
