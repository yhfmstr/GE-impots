import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db, CIVIL_STATUS, EMPLOYMENT_TYPE } from '@/lib/supabase';
import { formatLastUpdate } from '@/lib/profileFreshness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  Check,
  User,
  Users,
  Briefcase,
  PiggyBank,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';

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

export default function ProfileUpdatePage() {
  const { user, profile, refreshProfile, freshnessCheck } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    street: '',
    postal_code: '',
    city: 'Genève',
    civil_status: '',
    spouse_first_name: '',
    spouse_last_name: '',
    spouse_date_of_birth: '',
    children: [],
    employment_type: '',
    profession: '',
    employer: '',
    has_real_estate: false,
    has_investments: false,
    has_3a: false,
    has_lpp_rachat: false,
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setFormData({
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
        children: [],
        employment_type: profile.employment_type || '',
        profession: profile.profession || '',
        employer: profile.employer || '',
        has_real_estate: profile.has_real_estate || false,
        has_investments: profile.has_investments || false,
        has_3a: profile.has_3a || false,
        has_lpp_rachat: profile.has_lpp_rachat || false,
      });
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
    setSuccess(false);
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
    const child = formData.children[index];
    if (child.id && !child.id.startsWith('new-')) {
      // Delete from database
      db.deleteChild(child.id);
    }
    setFormData((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

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
          if (child.first_name && child.date_of_birth) {
            await db.addChild(user.id, {
              first_name: child.first_name,
              date_of_birth: child.date_of_birth,
              in_formation: child.in_formation,
              garde_partagee: child.garde_partagee,
            });
          }
        } else {
          await db.updateChild(child.id, {
            first_name: child.first_name,
            date_of_birth: child.date_of_birth,
            in_formation: child.in_formation,
            garde_partagee: child.garde_partagee,
          });
        }
      }

      // Refresh profile in context
      await refreshProfile();
      setSuccess(true);

      // Reload children to get new IDs
      await loadChildren();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const isMarried = [CIVIL_STATUS.MARIE, CIVIL_STATUS.PACS].includes(formData.civil_status);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground">
          Mettez à jour vos informations personnelles
        </p>
      </div>

      <div className="space-y-4">

        {freshnessCheck?.needsUpdate && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>{freshnessCheck.message}</AlertDescription>
          </Alert>
        )}

        {profile?.profile_updated_at && (
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {formatLastUpdate(profile.profile_updated_at)}
          </p>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-success bg-success-light text-success">
          <Check className="h-4 w-4" />
          <AlertDescription>Profil mis à jour avec succès</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personnel</span>
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Famille</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Profession</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            <span className="hidden sm:inline">Finances</span>
          </TabsTrigger>
        </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Vos coordonnées de base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date de naissance</Label>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Adresse</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => updateField('street', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => updateField('postal_code', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle>État civil & famille</CardTitle>
                <CardDescription>Votre situation familiale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="civil_status">État civil</Label>
                  <Select
                    value={formData.civil_status}
                    onValueChange={(value) => updateField('civil_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
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
                    <h4 className="font-medium">Conjoint(e)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prénom</Label>
                        <Input
                          value={formData.spouse_first_name}
                          onChange={(e) => updateField('spouse_first_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={formData.spouse_last_name}
                          onChange={(e) => updateField('spouse_last_name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de naissance</Label>
                      <Input
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
                            checked={child.in_formation}
                            onCheckedChange={(checked) => updateChild(index, 'in_formation', checked)}
                          />
                          <label className="text-sm">En formation</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={child.garde_partagee}
                            onCheckedChange={(checked) => updateChild(index, 'garde_partagee', checked)}
                          />
                          <label className="text-sm">Garde partagée</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle>Situation professionnelle</CardTitle>
                <CardDescription>Votre emploi et profession</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Statut</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => updateField('employment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
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
                  />
                </div>

                {formData.employment_type === EMPLOYMENT_TYPE.SALARIE && (
                  <div className="space-y-2">
                    <Label htmlFor="employer">Employeur</Label>
                    <Input
                      id="employer"
                      value={formData.employer}
                      onChange={(e) => updateField('employer', e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu financier</CardTitle>
                <CardDescription>Vos avoirs et investissements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="has_real_estate"
                    checked={formData.has_real_estate}
                    onCheckedChange={(checked) => updateField('has_real_estate', checked)}
                  />
                  <div>
                    <label htmlFor="has_real_estate" className="font-medium cursor-pointer">
                      Bien immobilier
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Appartement, maison, terrain
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
                      Placements/Investissements
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Actions, obligations, fonds
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
                      3ème pilier A
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Prévoyance liée
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
                      Rachat LPP
                    </label>
                    <p className="text-sm text-muted-foreground">
                      2ème pilier
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
      </div>
    </div>
  );
}
