import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

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
    // Load saved data from localStorage on init
    const saved = localStorage.getItem('taxDeclarationData');
    return saved ? JSON.parse(saved) : {};
  });
  const [saving, setSaving] = useState(false);

  const section = SECTIONS[currentSection];
  const isLastSection = currentSection === SECTIONS.length - 1;

  const handleChange = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    // Save to localStorage on every change
    localStorage.setItem('taxDeclarationData', JSON.stringify(newData));
  };

  const shouldShowField = (field) => {
    if (!field.condition) return true;
    return formData[field.condition] === true;
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/declaration/questionnaire/${currentSection}`, {
        data: formData
      });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const nextSection = async () => {
    await saveSection();
    if (isLastSection) {
      onComplete?.(formData);
    } else {
      setCurrentSection(prev => prev + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Progress */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Section {currentSection + 1} sur {SECTIONS.length}</span>
          <span className="text-sm font-medium text-gray-900">{section.title}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentSection + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 space-y-6">
        {section.fields.filter(shouldShowField).map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.max && <span className="text-gray-400 ml-2">(max {field.max.toLocaleString()} CHF)</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
                max={field.max}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            )}

            {field.type === 'select' && (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'boolean' && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleChange(field.name, true)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    formData[field.name] === true
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => handleChange(field.name, false)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    formData[field.name] === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Non
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={prevSection}
          disabled={currentSection === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <button
          onClick={nextSection}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? (
            <Save className="w-4 h-4 animate-pulse" />
          ) : isLastSection ? (
            <>
              <Check className="w-4 h-4" />
              Terminer
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
