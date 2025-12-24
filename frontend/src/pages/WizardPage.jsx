import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import WizardSelector from '@/components/wizard/WizardSelector';
import WizardQuestionnaire from '@/components/wizard/WizardQuestionnaire';
import { WIZARD_PROFILES } from '@/config/wizardConfig';

/**
 * Wizard states
 */
const WIZARD_STATES = {
  SELECT_PROFILE: 'SELECT_PROFILE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETE: 'COMPLETE'
};

/**
 * WizardPage - Entry point for guided tax declaration
 */
export default function WizardPage() {
  const navigate = useNavigate();

  // Try to restore wizard state
  const [wizardState, setWizardState] = useState(() => {
    const saved = loadSecure(STORAGE_KEYS.WIZARD_PROFILE, null);
    if (saved?.profileId && saved?.state === WIZARD_STATES.IN_PROGRESS) {
      return WIZARD_STATES.IN_PROGRESS;
    }
    return WIZARD_STATES.SELECT_PROFILE;
  });

  const [selectedProfile, setSelectedProfile] = useState(() => {
    const saved = loadSecure(STORAGE_KEYS.WIZARD_PROFILE, null);
    return saved?.profileId || null;
  });

  // Beforeunload warning when wizard is in progress
  useEffect(() => {
    if (wizardState !== WIZARD_STATES.IN_PROGRESS) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = 'Vous avez des données non sauvegardées. Êtes-vous sûr de vouloir quitter?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [wizardState]);

  // Handle profile selection
  const handleSelectProfile = (profileId) => {
    setSelectedProfile(profileId);
    setWizardState(WIZARD_STATES.IN_PROGRESS);

    // Save wizard state
    saveSecure(STORAGE_KEYS.WIZARD_PROFILE, {
      profileId,
      state: WIZARD_STATES.IN_PROGRESS,
      startedAt: new Date().toISOString()
    });
  };

  // Handle wizard completion
  const handleComplete = (formData) => {
    setWizardState(WIZARD_STATES.COMPLETE);

    // Update wizard state
    saveSecure(STORAGE_KEYS.WIZARD_PROFILE, {
      profileId: selectedProfile,
      state: WIZARD_STATES.COMPLETE,
      completedAt: new Date().toISOString()
    });
  };

  // Handle exit wizard
  const handleExit = () => {
    // Keep the data but return to selection
    setWizardState(WIZARD_STATES.SELECT_PROFILE);
    setSelectedProfile(null);

    // Clear wizard profile
    saveSecure(STORAGE_KEYS.WIZARD_PROFILE, null);
  };

  // Go to results
  const goToResults = () => {
    navigate('/results');
  };

  // Go to home
  const goHome = () => {
    navigate('/');
  };

  // Render based on state
  const renderContent = () => {
    switch (wizardState) {
      case WIZARD_STATES.SELECT_PROFILE:
        return (
          <WizardSelector onSelectProfile={handleSelectProfile} />
        );

      case WIZARD_STATES.IN_PROGRESS:
        return (
          <WizardQuestionnaire
            profileId={selectedProfile}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        );

      case WIZARD_STATES.COMPLETE:
        const profile = WIZARD_PROFILES[selectedProfile];
        return (
          <div className="max-w-lg mx-auto text-center">
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-light flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Déclaration terminée!
                </h2>

                <p className="text-text-secondary mb-6">
                  Vous avez complété le profil "{profile?.name}".
                  Consultez vos résultats pour voir le calcul estimatif de vos impôts.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={goToResults}
                    className="w-full"
                  >
                    Voir mes résultats
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setWizardState(WIZARD_STATES.SELECT_PROFILE);
                      setSelectedProfile(null);
                    }}
                    className="w-full"
                  >
                    Changer de profil
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={goHome}
                    className="w-full text-muted-foreground"
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      {wizardState !== WIZARD_STATES.SELECT_PROFILE && (
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Assistant déclaration guidée
          </h1>
          {selectedProfile && (
            <p className="text-muted-foreground">
              Profil: {WIZARD_PROFILES[selectedProfile]?.name}
            </p>
          )}
        </div>
      )}

      {renderContent()}
    </div>
  );
}
