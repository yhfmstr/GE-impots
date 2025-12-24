import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Save, Sparkles } from 'lucide-react';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import SuggestionIndicator, { SuggestionBadge } from '@/components/SuggestionIndicator';
import AutoFillPanel from '@/components/AutoFillPanel';
import ContextualHelp from './ContextualHelp';
import WizardProgress from './WizardProgress';
import { WIZARD_PROFILES, SECTION_METADATA, getFieldHelp } from '@/config/wizardConfig';

/**
 * Section definitions (same as Questionnaire.jsx but exported for filtering)
 */
const ALL_SECTIONS = [
  {
    id: 0,
    title: 'Informations personnelles',
    fields: [
      { name: 'civilStatus', label: 'État civil', type: 'select', options: ['Célibataire', 'Marié(e)', 'Pacsé(e)', 'Divorcé(e)', 'Veuf/Veuve'] },
      { name: 'hasChildren', label: 'Avez-vous des enfants à charge?', type: 'boolean' },
      { name: 'childrenCount', label: 'Nombre d\'enfants', type: 'number', condition: 'hasChildren' },
      { name: 'commune', label: 'Commune de résidence', type: 'text' },
    ]
  },
  {
    id: 1,
    title: 'Revenus professionnels',
    fields: [
      { name: 'activityType', label: 'Situation professionnelle', type: 'select', options: ['Salarié(e)', 'Indépendant(e)', 'Retraité(e)', 'Sans activité'] },
      { name: 'grossSalary', label: 'Salaire brut annuel (CHF)', type: 'number' },
      { name: 'avsContributions', label: 'Cotisations AVS/AI (CHF)', type: 'number' },
      { name: 'lppContributions', label: 'Cotisations LPP (CHF)', type: 'number' },
    ]
  },
  {
    id: 2,
    title: 'Prestations et rentes',
    fields: [
      { name: 'hasUnemployment', label: 'Indemnités chômage', type: 'boolean' },
      { name: 'unemploymentAmount', label: 'Montant chômage (CHF)', type: 'number', condition: 'hasUnemployment' },
      { name: 'hasPension', label: 'Rentes (AVS, AI, LPP)', type: 'boolean' },
      { name: 'pensionAmount', label: 'Montant rentes (CHF)', type: 'number', condition: 'hasPension' },
    ]
  },
  {
    id: 3,
    title: 'Prévoyance',
    fields: [
      { name: 'hasLPP', label: 'Affilié à une caisse de pension (LPP)?', type: 'boolean' },
      { name: 'pilier3a', label: 'Versement 3ème pilier A (CHF)', type: 'number', max: 7056 },
      { name: 'pilier3b', label: 'Prime 3ème pilier B (CHF)', type: 'number' },
      { name: 'rachatLPP', label: 'Rachat 2ème pilier (CHF)', type: 'number' },
    ]
  },
  {
    id: 4,
    title: 'Frais professionnels',
    fields: [
      { name: 'deductionType', label: 'Type de déduction', type: 'select', options: ['Forfait (3%)', 'Frais effectifs'] },
      { name: 'transportCosts', label: 'Frais de transport (CHF)', type: 'number' },
      { name: 'mealDays', label: 'Jours de repas hors domicile', type: 'number' },
      { name: 'trainingCosts', label: 'Formation continue (CHF)', type: 'number', max: 12640 },
    ]
  },
  {
    id: 5,
    title: 'Autres déductions',
    fields: [
      { name: 'healthInsurance', label: 'Primes assurance maladie (CHF)', type: 'number' },
      { name: 'medicalExpenses', label: 'Frais médicaux non remboursés (CHF)', type: 'number' },
      { name: 'childcareCosts', label: 'Frais de garde (CHF)', type: 'number', max: 26080 },
      { name: 'donations', label: 'Dons (CHF)', type: 'number' },
    ]
  },
  {
    id: 6,
    title: 'Fortune',
    fields: [
      { name: 'bankAccounts', label: 'Solde comptes bancaires au 31.12 (CHF)', type: 'number' },
      { name: 'securities', label: 'Valeur titres au 31.12 (CHF)', type: 'number' },
      { name: 'vehicleValue', label: 'Valeur véhicules (CHF)', type: 'number' },
      { name: 'otherAssets', label: 'Autres actifs (CHF)', type: 'number' },
    ]
  },
  {
    id: 7,
    title: 'Immobilier',
    fields: [
      { name: 'hasProperty', label: 'Êtes-vous propriétaire?', type: 'boolean' },
      { name: 'propertyValue', label: 'Valeur fiscale du bien (CHF)', type: 'number', condition: 'hasProperty' },
      { name: 'rentalValue', label: 'Valeur locative annuelle (CHF)', type: 'number', condition: 'hasProperty' },
      { name: 'mortgageBalance', label: 'Solde hypothèque (CHF)', type: 'number', condition: 'hasProperty' },
      { name: 'mortgageInterest', label: 'Intérêts hypothécaires (CHF)', type: 'number', condition: 'hasProperty' },
    ]
  },
  {
    id: 8,
    title: 'Dettes',
    fields: [
      { name: 'personalLoans', label: 'Crédits personnels (CHF)', type: 'number' },
      { name: 'leasingDebt', label: 'Leasing véhicule (CHF)', type: 'number' },
      { name: 'otherDebts', label: 'Autres dettes (CHF)', type: 'number' },
    ]
  },
];

/**
 * WizardQuestionnaire - Filtered questionnaire for wizard mode
 *
 * Props:
 * - profileId: Selected wizard profile
 * - onComplete: Callback when wizard is completed
 * - onExit: Callback to exit wizard mode
 */
export default function WizardQuestionnaire({ profileId, onComplete, onExit }) {
  const profile = WIZARD_PROFILES[profileId];
  const filteredSections = ALL_SECTIONS.filter(s => profile.sections.includes(s.id));

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState([]);
  const [formData, setFormData] = useState(() => loadSecure(STORAGE_KEYS.TAX_DATA, {}));
  const [suggestions, setSuggestions] = useState([]);
  const [showAutoFillPanel, setShowAutoFillPanel] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentSection = filteredSections[currentSectionIndex];
  const isLastSection = currentSectionIndex === filteredSections.length - 1;

  // Calculate estimated time remaining
  const sectionsRemaining = filteredSections.length - currentSectionIndex;
  const avgTimePerSection = profile.estimatedTime / profile.sections.length;
  const estimatedTimeRemaining = Math.round(sectionsRemaining * avgTimePerSection);

  // Load suggestions on mount
  useEffect(() => {
    const loadedSuggestions = loadSecure(STORAGE_KEYS.SUGGESTIONS, []);
    setSuggestions(loadedSuggestions);
  }, []);

  // Pending suggestions
  const pendingSuggestions = suggestions.filter(s => s.accepted === null);
  const sectionSuggestions = pendingSuggestions.filter(s =>
    currentSection?.fields.some(f => f.name === s.fieldKey)
  );

  const handleChange = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    saveSecure(STORAGE_KEYS.TAX_DATA, newData);
  };

  const shouldShowField = (field) => {
    if (!field.condition) return true;
    return formData[field.condition] === true;
  };

  const getSuggestionForField = (fieldName) => {
    return suggestions.find(s => s.fieldKey === fieldName && s.accepted === null);
  };

  const handleAcceptSuggestion = (suggestion) => {
    handleChange(suggestion.fieldKey, suggestion.value);
    const updatedSuggestions = suggestions.map(s =>
      s.id === suggestion.id ? { ...s, accepted: true } : s
    );
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  const handleRejectSuggestion = (suggestion) => {
    const updatedSuggestions = suggestions.map(s =>
      s.id === suggestion.id ? { ...s, accepted: false } : s
    );
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  const handleAcceptAll = (suggestionsList) => {
    const newData = { ...formData };
    const updatedSuggestions = [...suggestions];

    suggestionsList.forEach(suggestion => {
      newData[suggestion.fieldKey] = suggestion.value;
      const idx = updatedSuggestions.findIndex(s => s.id === suggestion.id);
      if (idx !== -1) {
        updatedSuggestions[idx] = { ...updatedSuggestions[idx], accepted: true };
      }
    });

    setFormData(newData);
    saveSecure(STORAGE_KEYS.TAX_DATA, newData);
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  const handleRejectAll = (suggestionsList) => {
    const updatedSuggestions = suggestions.map(s => {
      const shouldReject = suggestionsList.some(r => r.id === s.id);
      return shouldReject ? { ...s, accepted: false } : s;
    });
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  const nextSection = () => {
    // Mark current as completed using functional updater to avoid stale closure
    setCompletedSections(prev =>
      prev.includes(currentSection.id) ? prev : [...prev, currentSection.id]
    );

    if (isLastSection) {
      onComplete?.(formData);
    } else {
      setCurrentSectionIndex(prev => prev + 1);
    }
  };

  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  const jumpToSection = (index) => {
    setCurrentSectionIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <WizardProgress
        sections={filteredSections.map(s => s.id)}
        currentIndex={currentSectionIndex}
        completedSections={completedSections}
        estimatedTimeRemaining={estimatedTimeRemaining}
        onSectionClick={jumpToSection}
      />

      {/* Main Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        {/* Section Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {currentSection?.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {SECTION_METADATA[currentSection?.id]?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pendingSuggestions.length > 0 && (
                <SuggestionBadge
                  count={pendingSuggestions.length}
                  onClick={() => setShowAutoFillPanel(!showAutoFillPanel)}
                />
              )}
            </div>
          </div>

          {sectionSuggestions.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-info">
              <Sparkles className="h-4 w-4" />
              <span>{sectionSuggestions.length} suggestion{sectionSuggestions.length > 1 ? 's' : ''} pour cette section</span>
            </div>
          )}
        </div>

        {/* AutoFill Panel */}
        {showAutoFillPanel && (
          <div className="p-4 border-b border-border bg-muted">
            <AutoFillPanel
              suggestions={suggestions}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
              onAcceptAll={handleAcceptAll}
              onRejectAll={handleRejectAll}
              onClose={() => setShowAutoFillPanel(false)}
            />
          </div>
        )}

        {/* Fields */}
        <div className="p-6 space-y-6">
          {currentSection?.fields.filter(shouldShowField).map((field) => {
            const suggestion = getSuggestionForField(field.name);
            const hasSuggestion = !!suggestion;
            const customHelp = getFieldHelp(profileId, field.name);

            return (
              <div key={field.name}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    {field.label}
                    {field.max && <span className="text-text-muted">(max {field.max.toLocaleString()} CHF)</span>}
                    <ContextualHelp fieldName={field.name} customHelp={customHelp} />
                  </label>
                  {hasSuggestion && (
                    <SuggestionIndicator
                      suggestion={suggestion}
                      currentValue={formData[field.name]}
                      onAccept={handleAcceptSuggestion}
                      onReject={handleRejectSuggestion}
                      compact
                    />
                  )}
                </div>

                {hasSuggestion && (field.type === 'number' || field.type === 'text') && (
                  <SuggestionIndicator
                    suggestion={suggestion}
                    currentValue={formData[field.name]}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                  />
                )}

                {field.type === 'text' && (
                  <Input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={cn(
                      hasSuggestion && 'border-dashed border-info mt-2'
                    )}
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    type="number"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
                    max={field.max}
                    className={cn(
                      hasSuggestion && 'border-dashed border-info mt-2'
                    )}
                  />
                )}

                {field.type === 'select' && (
                  <Select
                    value={formData[field.name] || ''}
                    onValueChange={(value) => handleChange(field.name, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'boolean' && (
                  <RadioGroup
                    value={formData[field.name] === true ? 'true' : formData[field.name] === false ? 'false' : ''}
                    onValueChange={(value) => handleChange(field.name, value === 'true')}
                    className="flex gap-4"
                  >
                    <div className="flex-1">
                      <RadioGroupItem
                        value="true"
                        id={`${field.name}-yes`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`${field.name}-yes`}
                        className={cn(
                          'flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors',
                          formData[field.name] === true
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-muted-foreground'
                        )}
                      >
                        Oui
                      </Label>
                    </div>
                    <div className="flex-1">
                      <RadioGroupItem
                        value="false"
                        id={`${field.name}-no`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`${field.name}-no`}
                        className={cn(
                          'flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors',
                          formData[field.name] === false
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-muted-foreground'
                        )}
                      >
                        Non
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t border-border flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            <Button
              variant="ghost"
              onClick={onExit}
              className="text-muted-foreground"
            >
              Quitter l'assistant
            </Button>
          </div>

          <Button
            onClick={nextSection}
            disabled={saving}
          >
            {saving ? (
              <Save className="h-4 w-4 animate-pulse" />
            ) : isLastSection ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Terminer
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
