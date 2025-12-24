import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Save, Sparkles, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import SuggestionIndicator, { SuggestionBadge } from '@/components/SuggestionIndicator';
import AutoFillPanel from '@/components/AutoFillPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SECTIONS = [
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

export default function Questionnaire({ onComplete }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState(() => {
    // Load saved data from secure storage on init
    return loadSecure(STORAGE_KEYS.TAX_DATA, {});
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showAutoFillPanel, setShowAutoFillPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const section = SECTIONS[currentSection];
  const isLastSection = currentSection === SECTIONS.length - 1;

  // Validation function
  const validateField = (field, value) => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return 'Ce champ est requis';
    }
    if (field.type === 'number' && field.max && value > field.max) {
      return `La valeur maximum est ${field.max.toLocaleString()} CHF`;
    }
    if (field.type === 'number' && field.min !== undefined && value < field.min) {
      return `La valeur minimum est ${field.min.toLocaleString()} CHF`;
    }
    if (field.type === 'number' && value < 0) {
      return 'La valeur ne peut pas être négative';
    }
    return null;
  };

  // Validate current section
  const validateSection = () => {
    const newErrors = {};
    let isValid = true;

    section.fields.filter(shouldShowField).forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Load suggestions on mount
  useEffect(() => {
    const loadedSuggestions = loadSecure(STORAGE_KEYS.SUGGESTIONS, []);
    setSuggestions(loadedSuggestions);
  }, []);

  // Get pending suggestions count
  const pendingSuggestions = suggestions.filter(s => s.accepted === null);
  const sectionSuggestions = pendingSuggestions.filter(s =>
    section.fields.some(f => f.name === s.fieldKey)
  );

  const handleChange = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    // Save to secure storage on every change
    saveSecure(STORAGE_KEYS.TAX_DATA, newData);
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const shouldShowField = (field) => {
    if (!field.condition) return true;
    return formData[field.condition] === true;
  };

  // Get suggestion for a specific field
  const getSuggestionForField = (fieldName) => {
    return suggestions.find(s => s.fieldKey === fieldName && s.accepted === null);
  };

  // Handle accepting a suggestion
  const handleAcceptSuggestion = (suggestion) => {
    // Apply the value to form
    handleChange(suggestion.fieldKey, suggestion.value);

    // Mark suggestion as accepted
    const updatedSuggestions = suggestions.map(s =>
      s.id === suggestion.id ? { ...s, accepted: true } : s
    );
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  // Handle rejecting a suggestion
  const handleRejectSuggestion = (suggestion) => {
    const updatedSuggestions = suggestions.map(s =>
      s.id === suggestion.id ? { ...s, accepted: false } : s
    );
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  // Handle accepting all suggestions (from panel)
  const handleAcceptAll = (suggestionsList) => {
    const newData = { ...formData };
    const updatedSuggestions = [...suggestions];

    suggestionsList.forEach(suggestion => {
      // Apply value
      newData[suggestion.fieldKey] = suggestion.value;

      // Mark as accepted
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

  // Handle rejecting all suggestions (from panel)
  const handleRejectAll = (suggestionsList) => {
    const updatedSuggestions = suggestions.map(s => {
      const shouldReject = suggestionsList.some(r => r.id === s.id);
      return shouldReject ? { ...s, accepted: false } : s;
    });
    setSuggestions(updatedSuggestions);
    saveSecure(STORAGE_KEYS.SUGGESTIONS, updatedSuggestions);
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      await api.post(`/declaration/questionnaire/${currentSection}`, {
        data: formData
      });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const nextSection = async () => {
    // Validate before proceeding (validation is optional, show warnings but allow proceed)
    validateSection();

    await saveSection();
    if (isLastSection) {
      onComplete?.(formData);
    } else {
      setCurrentSection(prev => prev + 1);
      setErrors({}); // Clear errors when moving to new section
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      {/* Progress */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Section {currentSection + 1} sur {SECTIONS.length}</span>
          <div className="flex items-center gap-3">
            {pendingSuggestions.length > 0 && (
              <SuggestionBadge
                count={pendingSuggestions.length}
                onClick={() => setShowAutoFillPanel(!showAutoFillPanel)}
              />
            )}
            <span className="text-sm font-medium text-foreground">{section.title}</span>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentSection + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>

        {/* Section-specific suggestions indicator */}
        {sectionSuggestions.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-info">
            <Sparkles className="w-4 h-4" />
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
        {section.fields.filter(shouldShowField).map((field) => {
          const suggestion = getSuggestionForField(field.name);
          const hasSuggestion = !!suggestion;
          const fieldError = errors[field.name];
          const fieldId = `field-${field.name}`;

          return (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={fieldId}
                  className={fieldError ? 'text-destructive' : ''}
                >
                  {field.label}
                  {field.max && <span className="text-muted-foreground ml-2 font-normal">(max {field.max.toLocaleString()} CHF)</span>}
                </Label>
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

              {/* Suggestion inline indicator for number/text fields */}
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
                  id={fieldId}
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={hasSuggestion ? 'border-dashed border-info' : ''}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? `${fieldId}-error` : undefined}
                />
              )}

              {field.type === 'number' && (
                <Input
                  id={fieldId}
                  type="number"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
                  max={field.max}
                  min={0}
                  className={hasSuggestion ? 'border-dashed border-info' : ''}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? `${fieldId}-error` : undefined}
                />
              )}

              {field.type === 'select' && (
                <Select
                  value={formData[field.name] || ''}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger id={fieldId} aria-invalid={!!fieldError}>
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
                <div className="flex gap-4" role="radiogroup" aria-labelledby={fieldId}>
                  <Button
                    type="button"
                    variant={formData[field.name] === true ? 'default' : 'outline'}
                    onClick={() => handleChange(field.name, true)}
                    className="flex-1"
                    aria-pressed={formData[field.name] === true}
                  >
                    Oui
                  </Button>
                  <Button
                    type="button"
                    variant={formData[field.name] === false ? 'default' : 'outline'}
                    onClick={() => handleChange(field.name, false)}
                    className="flex-1"
                    aria-pressed={formData[field.name] === false}
                  >
                    Non
                  </Button>
                </div>
              )}

              {/* Error message */}
              {fieldError && (
                <p id={`${fieldId}-error`} className="text-sm text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-border flex justify-between">
        <Button
          variant="ghost"
          onClick={prevSection}
          disabled={currentSection === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        <Button
          onClick={nextSection}
          disabled={saving}
        >
          {saving ? (
            <Save className="w-4 h-4 animate-pulse mr-2" />
          ) : isLastSection ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Terminer
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
