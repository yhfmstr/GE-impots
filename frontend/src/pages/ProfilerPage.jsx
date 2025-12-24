import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Users, UserMinus, Heart, Baby, X,
  Briefcase, Building, Coffee, Clock, GraduationCap,
  Home, Building2, Landmark, PiggyBank, TrendingUp,
  Key, HandCoins, Globe, ChevronRight, ChevronLeft,
  Calculator, FileText, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  PROFILER_QUESTIONS,
  getProfileFromAnswers,
  getDocumentChecklist
} from '@/config/profilerConfig';
import { estimateTax, formatCHF, formatRange } from '@/lib/estimator';
import { saveSecure, STORAGE_KEYS } from '@/lib/storage';

// Icon mapping
const ICONS = {
  User, Users, UserMinus, Heart, Baby, X,
  Briefcase, Building, Coffee, Clock, GraduationCap,
  Home, Building2, Landmark, PiggyBank, TrendingUp,
  Key, HandCoins, Globe, FileText, CheckCircle
};

function getIcon(iconName) {
  return ICONS[iconName] || FileText;
}

export default function ProfilerPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Filter questions based on conditional logic
  const visibleQuestions = PROFILER_QUESTIONS.filter(q =>
    !q.showIf || q.showIf(answers)
  );

  const currentQuestion = visibleQuestions[currentStep];
  const isLastQuestion = currentStep === visibleQuestions.length - 1;
  const progress = ((currentStep + 1) / visibleQuestions.length) * 100;

  // Handle single selection
  const handleSelect = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Auto-advance for single select
    if (currentQuestion.type === 'single') {
      setTimeout(() => {
        if (isLastQuestion) {
          calculateResults(newAnswers);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }, 300);
    }
  };

  // Handle multi selection
  const handleMultiSelect = (value) => {
    const current = answers[currentQuestion.id] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setAnswers({ ...answers, [currentQuestion.id]: newValue });
  };

  // Go back
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Continue for multi-select
  const handleContinue = () => {
    if (isLastQuestion) {
      calculateResults(answers);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Calculate and show results
  const calculateResults = (finalAnswers) => {
    const taxEstimate = estimateTax(finalAnswers);
    const userProfile = getProfileFromAnswers(finalAnswers);
    const docList = getDocumentChecklist(finalAnswers);

    setEstimate(taxEstimate);
    setProfile(userProfile);
    setDocuments(docList);
    setShowResults(true);

    // Save to storage for later use
    saveSecure(STORAGE_KEYS.PROFILER_ANSWERS, finalAnswers);
    saveSecure(STORAGE_KEYS.PROFILER_PROFILE, userProfile);
  };

  // Start declaration with profile
  const startDeclaration = () => {
    navigate('/wizard', { state: { profile: profile.key, fromProfiler: true } });
  };

  // Results view
  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GE</span>
              </div>
              <span className="font-semibold text-foreground">Impôts Genève</span>
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-success-light text-success px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Analyse terminée</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Votre estimation fiscale
            </h1>
            <p className="text-text-secondary">
              Basée sur les informations fournies
            </p>
          </div>

          {/* Tax Estimate Card */}
          <Card className="mb-6 overflow-hidden animate-fade-in-up animation-delay-100">
            <div className="bg-gradient-to-r from-primary to-warning p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5" />
                <span className="text-sm opacity-90">Impôt estimé</span>
              </div>
              <div className="text-4xl font-bold mb-1">
                {formatRange(estimate.range.min, estimate.range.max)}
              </div>
              <p className="text-sm opacity-80">
                Taux effectif: ~{estimate.effectiveRate}%
              </p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-text-muted">Revenu brut estimé</p>
                  <p className="text-lg font-semibold">{formatCHF(estimate.grossIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Déductions estimées</p>
                  <p className="text-lg font-semibold text-success">{formatCHF(estimate.deductions)}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">ICC (cantonal)</span>
                  <span>{formatCHF(estimate.breakdown.icc)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">Centimes additionnels</span>
                  <span>{formatCHF(estimate.breakdown.centimes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">IFD (fédéral)</span>
                  <span>{formatCHF(estimate.breakdown.ifd)}</span>
                </div>
              </div>
              <p className="text-xs text-text-light mt-4 italic">
                {estimate.disclaimer}
              </p>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="mb-6 animate-fade-in-up animation-delay-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-info-light rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Votre profil: {profile.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-3">
                    {profile.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span>~{profile.estimatedTime} minutes</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <FileText className="w-4 h-4" />
                      <span>{documents.length} documents</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Checklist */}
          <Card className="mb-8 animate-fade-in-up animation-delay-300">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Documents à préparer
              </h3>
              <div className="grid gap-2">
                {documents.map((doc, index) => {
                  const Icon = getIcon(doc.icon);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <Icon className="w-5 h-5 text-text-muted" />
                      <span className="text-foreground">{doc.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
            <Button
              size="lg"
              className="flex-1"
              onClick={startDeclaration}
            >
              Commencer ma déclaration
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowResults(false);
                setCurrentStep(0);
                setAnswers({});
              }}
            >
              Recommencer
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Survey view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GE</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Impôts Genève</span>
          </Link>
          <div className="text-sm text-text-muted">
            Question {currentStep + 1} / {visibleQuestions.length}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {/* Question text */}
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {currentQuestion.question}
            </h2>
            {currentQuestion.subtitle && (
              <p className="text-text-secondary">
                {currentQuestion.subtitle}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 animate-fade-in-up animation-delay-100">
            {currentQuestion.options.map((option) => {
              const Icon = option.icon ? getIcon(option.icon) : null;
              const isSelected = currentQuestion.type === 'multi'
                ? (answers[currentQuestion.id] || []).includes(option.value)
                : answers[currentQuestion.id] === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() =>
                    currentQuestion.type === 'multi'
                      ? handleMultiSelect(option.value)
                      : handleSelect(option.value)
                  }
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-card hover:border-muted-foreground'
                  }`}
                >
                  {Icon && (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-text-muted'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <span className={`text-lg ${
                    isSelected ? 'text-primary font-medium' : 'text-foreground'
                  }`}>
                    {option.label}
                  </span>
                  {currentQuestion.type === 'multi' && (
                    <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Multi-select continue button */}
          {currentQuestion.type === 'multi' && (
            <div className="mt-6 flex justify-center animate-fade-in animation-delay-200">
              <Button
                size="lg"
                onClick={handleContinue}
              >
                {isLastQuestion ? 'Voir mes résultats' : 'Continuer'}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            Quitter
          </Button>
        </div>
      </footer>
    </div>
  );
}
