import { useState } from 'react';
import {
  Briefcase,
  Home,
  Users,
  Armchair,
  FileStack,
  HelpCircle,
  Clock,
  ChevronRight,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  WIZARD_PROFILES,
  PROFILING_QUESTIONS,
  determineBestProfile
} from '@/config/wizardConfig';

// Icon mapping
const ICONS = {
  Briefcase,
  Home,
  Users,
  Armchair,
  FileStack
};

/**
 * WizardSelector - Profile picker for guided mode
 *
 * Props:
 * - onSelectProfile: Callback when a profile is selected
 */
export default function WizardSelector({ onSelectProfile }) {
  const [showProfiling, setShowProfiling] = useState(false);
  const [profilingAnswers, setProfilingAnswers] = useState({});
  const [suggestedProfile, setSuggestedProfile] = useState(null);

  const handleSelectProfile = (profileId) => {
    onSelectProfile?.(profileId);
  };

  const handleProfilingAnswer = (questionId, value) => {
    const newAnswers = { ...profilingAnswers, [questionId]: value };
    setProfilingAnswers(newAnswers);

    // Check if all questions answered
    if (Object.keys(newAnswers).length === PROFILING_QUESTIONS.length) {
      const bestProfile = determineBestProfile(newAnswers);
      setSuggestedProfile(bestProfile);
    }
  };

  const resetProfiling = () => {
    setProfilingAnswers({});
    setSuggestedProfile(null);
    setShowProfiling(false);
  };

  // Profiling mode
  if (showProfiling) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Trouvons le bon profil
          </h2>
          <p className="text-gray-600">
            Répondez à quelques questions pour déterminer les sections pertinentes
          </p>
        </div>

        {/* Profiling Questions */}
        {!suggestedProfile ? (
          <div className="space-y-6">
            {PROFILING_QUESTIONS.map((question, index) => (
              <Card
                key={question.id}
                className={profilingAnswers[question.id] ? 'border-green-200 bg-green-50' : ''}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm flex items-center justify-center">
                      {index + 1}
                    </span>
                    {question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleProfilingAnswer(question.id, option.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          profilingAnswers[question.id] === option.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {profilingAnswers[question.id] === option.value && (
                            <Check className="w-4 h-4 text-red-600" />
                          )}
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center">
              <Button variant="ghost" onClick={resetProfiling}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          // Suggested Profile
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Profil recommandé
                </h3>
                <p className="text-2xl font-bold text-green-700 mb-2">
                  {WIZARD_PROFILES[suggestedProfile].name}
                </p>
                <p className="text-gray-600 mb-4">
                  {WIZARD_PROFILES[suggestedProfile].description}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <Clock className="w-4 h-4" />
                  <span>Environ {WIZARD_PROFILES[suggestedProfile].estimatedTime} minutes</span>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={resetProfiling}>
                    Choisir un autre profil
                  </Button>
                  <Button onClick={() => handleSelectProfile(suggestedProfile)}>
                    Commencer
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Profile Selection Grid
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choisissez votre profil
        </h2>
        <p className="text-gray-600">
          Sélectionnez le profil correspondant à votre situation pour une déclaration simplifiée
        </p>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.values(WIZARD_PROFILES).map((profile) => {
          const IconComponent = ICONS[profile.icon] || FileStack;

          return (
            <Card
              key={profile.id}
              className="cursor-pointer hover:border-red-300 hover:shadow-md transition-all"
              onClick={() => handleSelectProfile(profile.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {profile.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        ~{profile.estimatedTime} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {profile.sections.length} sections
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Characteristics */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ul className="space-y-1">
                    {profile.characteristics.slice(0, 3).map((char, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-500" />
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help link */}
      <div className="text-center">
        <button
          onClick={() => setShowProfiling(true)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Je ne sais pas quel profil choisir
        </button>
      </div>
    </div>
  );
}
