import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { db, CIVIL_STATUS, EMPLOYMENT_TYPE } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Users,
  Briefcase,
  PiggyBank,
  ClipboardCheck,
  Plus,
  Trash2,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Informations personnelles', icon: User },
  { id: 2, title: 'État civil & famille', icon: Users },
  { id: 3, title: 'Situation professionnelle', icon: Briefcase },
  { id: 4, title: 'Aperçu financier', icon: PiggyBank },
  { id: 5, title: 'Confirmation', icon: ClipboardCheck },
];

const CIVIL_STATUS_OPTIONS = [
  { value: CIVIL_STATUS.CELIBATAIRE, label: 'Célibataire' },
  { value: CIVIL_STATUS.MARIE, label: 'Marié(e)' },
  { value: CIVIL_STATUS.PACS, label: 'Partenariat enregistré (PACS)' },
  { value: CIVIL_STATUS.DIVORCE, label: 'Divorcé(e)' },
  { value: CIVIL_STATUS.VEUF, label: 'Veuf/Veuve' },
];

const EMPLOYMENT_OPTIONS = [
  { value: EMPLOYMENT_TYPE.SALARIE, label: 'Salarié(e)' },
  { value: EMPLOYMENT_TYPE.INDEPENDANT, label: 'Indépendant(e)' },
  { value: EMPLOYMENT_TYPE.RETRAITE, label: 'Retraité(e)' },
  { value: EMPLOYMENT_TYPE.SANS_EMPLOI, label: 'Sans emploi' },
  { value: EMPLOYMENT_TYPE.ETUDIANT, label: 'Étudiant(e)' },
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Personal
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    street: '',
    postal_code: '',
    city: 'Genève',

    // Step 2: Civil status
    civil_status: '',
    spouse_first_name: '',
    spouse_last_name: '',
    spouse_date_of_birth: '',
    children: [],

    // Step 3: Professional
    employment_type: '',
    profession: '',
    employer: '',

    // Step 4: Financial
    has_real_estate: false,
    has_investments: false,
    has_3a: false,
    has_lpp_rachat: false,
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        date_of_birth: profile.date_of_birth || '',
        phone: profile.phone || '',
        street: profile.street || '',
        postal_code: profile.postal_code || '',
        city: profile.city || 'Genève',
        civil_status: profile.civil_status || '',
        spouse_first_name: profile.spouse_first_name || '',
        spouse_last_name: profile.spouse_last_name || '',
        spouse_date_of_birth: profile.spouse_date_of_birth || '',
        employment_type: profile.employment_type || '',
        profession: profile.profession || '',
        employer: profile.employer || '',
        has_real_estate: profile.has_real_estate || false,
        has_investments: profile.has_investments || false,
        has_3a: profile.has_3a || false,
        has_lpp_rachat: profile.has_lpp_rachat || false,
      }));
    }
  }, [profile]);

  // Load children
  useEffect(() => {
    if (user) {
      loadChildren();
    }
  }, [user]);

  const loadChildren = async () => {
    const { data } = await db.getChildren(user.id);
    if (data) {
      setFormData((prev) => ({ ...prev, children: data }));
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addChild = () => {
    setFormData((prev) => ({
      ...prev,
      children: [
        ...prev.children,
        { id: `new-${Date.now()}`, first_name: '', date_of_birth: '', in_formation: false, garde_partagee: false },
      ],
    }));
  };

  const updateChild = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      ),
    }));
  };

  const removeChild = (index) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
          setError('Veuillez remplir les champs obligatoires');
          return false;
        }
        break;
      case 2:
        if (!formData.civil_status) {
          setError('Veuillez sélectionner votre état civil');
          return false;
        }
        const isMarried = [CIVIL_STATUS.MARIE, CIVIL_STATUS.PACS].includes(formData.civil_status);
        if (isMarried && (!formData.spouse_first_name || !formData.spouse_last_name)) {
          setError('Veuillez remplir les informations de votre conjoint(e)');
          return false;
        }
        break;
      case 3:
        if (!formData.employment_type) {
          setError('Veuillez sélectionner votre situation professionnelle');
          return false;
        }
        break;
    }
    return true;
  };

  const saveProgress = async () => {
    setLoading(true);
    setError(null);

    try {
      // Save profile
      const { error: profileError } = await db.updateProfile(user.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone,
        street: formData.street,
        postal_code: formData.postal_code,
        city: formData.city,
        civil_status: formData.civil_status,
        spouse_first_name: formData.spouse_first_name,
        spouse_last_name: formData.spouse_last_name,
        spouse_date_of_birth: formData.spouse_date_of_birth || null,
        employment_type: formData.employment_type,
        profession: formData.profession,
        employer: formData.employer,
        has_real_estate: formData.has_real_estate,
        has_investments: formData.has_investments,
        has_3a: formData.has_3a,
        has_lpp_rachat: formData.has_lpp_rachat,
        number_of_children: formData.children.length,
      });

      if (profileError) throw profileError;

      // Save children
      for (const child of formData.children) {
        if (child.id?.startsWith('new-')) {
          // New child
          if (child.first_name && child.date_of_birth) {
            await db.addChild(user.id, {
              first_name: child.first_name,
              date_of_birth: child.date_of_birth,
              in_formation: child.in_formation,
              garde_partagee: child.garde_partagee,
            });
          }
        } else {
          // Existing child
          await db.updateChild(child.id, {
            first_name: child.first_name,
            date_of_birth: child.date_of_birth,
            in_formation: child.in_formation,
            garde_partagee: child.garde_partagee,
          });
        }
      }

      return true;
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < 5) {
      const saved = await saveProgress();
      if (saved) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Save final profile
      await saveProgress();

      // Mark onboarding as completed
      const { error } = await db.completeOnboarding(user.id);
      if (error) throw error;

      // Refresh profile in context
      await refreshProfile();

      // Navigate to home
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Complete error:', err);
      setError(err.message || 'Erreur lors de la finalisation');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;
  const isMarried = [CIVIL_STATUS.MARIE, CIVIL_STATUS.PACS].includes(formData.civil_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenue sur GE-Impôts</h1>
          <p className="text-muted-foreground">
            Complétez votre profil pour commencer votre déclaration fiscale
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-100 text-green-600'
                        : 'bg-muted'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Ces informations sont nécessaires pour votre déclaration'}
              {currentStep === 2 && 'Votre situation familiale influence vos déductions'}
              {currentStep === 3 && 'Votre situation professionnelle détermine vos revenus'}
              {currentStep === 4 && 'Ces informations nous aident à personnaliser votre parcours'}
              {currentStep === 5 && 'Vérifiez vos informations avant de continuer'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date de naissance *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => updateField('date_of_birth', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+41 22 123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Adresse</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    placeholder="Rue de la Gare 1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => updateField('postal_code', e.target.value)}
                      placeholder="1201"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Genève"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Civil Status */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="civil_status">État civil *</Label>
                  <Select
                    value={formData.civil_status}
                    onValueChange={(value) => updateField('civil_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre état civil" />
                    </SelectTrigger>
                    <SelectContent>
                      {CIVIL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isMarried && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium">Informations du conjoint</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouse_first_name">Prénom *</Label>
                        <Input
                          id="spouse_first_name"
                          value={formData.spouse_first_name}
                          onChange={(e) => updateField('spouse_first_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouse_last_name">Nom *</Label>
                        <Input
                          id="spouse_last_name"
                          value={formData.spouse_last_name}
                          onChange={(e) => updateField('spouse_last_name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_date_of_birth">Date de naissance</Label>
                      <Input
                        id="spouse_date_of_birth"
                        type="date"
                        value={formData.spouse_date_of_birth}
                        onChange={(e) => updateField('spouse_date_of_birth', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Children */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Enfants à charge</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addChild}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>

                  {formData.children.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun enfant ajouté
                    </p>
                  )}

                  {formData.children.map((child, index) => (
                    <div key={child.id} className="p-4 bg-muted rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Enfant {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prénom</Label>
                          <Input
                            value={child.first_name}
                            onChange={(e) => updateChild(index, 'first_name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date de naissance</Label>
                          <Input
                            type="date"
                            value={child.date_of_birth}
                            onChange={(e) => updateChild(index, 'date_of_birth', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`formation-${index}`}
                            checked={child.in_formation}
                            onCheckedChange={(checked) => updateChild(index, 'in_formation', checked)}
                          />
                          <label htmlFor={`formation-${index}`} className="text-sm">
                            En formation
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`garde-${index}`}
                            checked={child.garde_partagee}
                            onCheckedChange={(checked) => updateChild(index, 'garde_partagee', checked)}
                          />
                          <label htmlFor={`garde-${index}`} className="text-sm">
                            Garde partagée
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Professional */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Situation professionnelle *</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => updateField('employment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre situation" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => updateField('profession', e.target.value)}
                    placeholder="Ingénieur, Comptable, etc."
                  />
                </div>

                {formData.employment_type === EMPLOYMENT_TYPE.SALARIE && (
                  <div className="space-y-2">
                    <Label htmlFor="employer">Employeur</Label>
                    <Input
                      id="employer"
                      value={formData.employer}
                      onChange={(e) => updateField('employer', e.target.value)}
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Financial */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Ces informations nous permettent de personnaliser votre parcours de déclaration.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                    <Checkbox
                      id="has_real_estate"
                      checked={formData.has_real_estate}
                      onCheckedChange={(checked) => updateField('has_real_estate', checked)}
                    />
                    <div>
                      <label htmlFor="has_real_estate" className="font-medium cursor-pointer">
                        Je possède un bien immobilier
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Appartement, maison, terrain, etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                    <Checkbox
                      id="has_investments"
                      checked={formData.has_investments}
                      onCheckedChange={(checked) => updateField('has_investments', checked)}
                    />
                    <div>
                      <label htmlFor="has_investments" className="font-medium cursor-pointer">
                        J'ai des placements/investissements
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Actions, obligations, fonds de placement, etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                    <Checkbox
                      id="has_3a"
                      checked={formData.has_3a}
                      onCheckedChange={(checked) => updateField('has_3a', checked)}
                    />
                    <div>
                      <label htmlFor="has_3a" className="font-medium cursor-pointer">
                        Je cotise au 3ème pilier A
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Prévoyance liée (déductible des impôts)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                    <Checkbox
                      id="has_lpp_rachat"
                      checked={formData.has_lpp_rachat}
                      onCheckedChange={(checked) => updateField('has_lpp_rachat', checked)}
                    />
                    <div>
                      <label htmlFor="has_lpp_rachat" className="font-medium cursor-pointer">
                        J'ai effectué un rachat LPP
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Rachat dans la caisse de pension (2ème pilier)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Informations personnelles</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Nom complet</span>
                      <span>{formData.first_name} {formData.last_name}</span>
                      <span className="text-muted-foreground">Date de naissance</span>
                      <span>{formData.date_of_birth || '—'}</span>
                      <span className="text-muted-foreground">Adresse</span>
                      <span>{formData.street ? `${formData.street}, ${formData.postal_code} ${formData.city}` : '—'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">État civil & famille</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">État civil</span>
                      <span>{CIVIL_STATUS_OPTIONS.find(o => o.value === formData.civil_status)?.label || '—'}</span>
                      {isMarried && (
                        <>
                          <span className="text-muted-foreground">Conjoint(e)</span>
                          <span>{formData.spouse_first_name} {formData.spouse_last_name}</span>
                        </>
                      )}
                      <span className="text-muted-foreground">Enfants</span>
                      <span>{formData.children.length}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Situation professionnelle</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Statut</span>
                      <span>{EMPLOYMENT_OPTIONS.find(o => o.value === formData.employment_type)?.label || '—'}</span>
                      <span className="text-muted-foreground">Profession</span>
                      <span>{formData.profession || '—'}</span>
                      {formData.employer && (
                        <>
                          <span className="text-muted-foreground">Employeur</span>
                          <span>{formData.employer}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Aperçu financier</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.has_real_estate && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Immobilier</span>
                      )}
                      {formData.has_investments && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Placements</span>
                      )}
                      {formData.has_3a && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">3ème pilier A</span>
                      )}
                      {formData.has_lpp_rachat && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Rachat LPP</span>
                      )}
                      {!formData.has_real_estate && !formData.has_investments && !formData.has_3a && !formData.has_lpp_rachat && (
                        <span className="text-sm text-muted-foreground">Aucune option sélectionnée</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>

            {currentStep < 5 ? (
              <Button onClick={handleNext} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Terminer
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
