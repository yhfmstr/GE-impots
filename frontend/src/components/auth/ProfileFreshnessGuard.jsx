import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getFreshnessStatus, formatLastUpdate } from '@/lib/profileFreshness';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ICONS = {
  'alert-circle': AlertCircle,
  'calendar': Calendar,
  'clock': Clock,
  'check-circle': CheckCircle,
};

/**
 * Profile Freshness Guard
 * Shows a modal when user's profile needs to be updated
 * Can be dismissed but will show again on next session
 */
export function ProfileFreshnessGuard({ children }) {
  const { needsProfileUpdate, freshnessCheck, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show modal if profile needs update and not dismissed
    if (needsProfileUpdate && !dismissed) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [needsProfileUpdate, dismissed]);

  const handleUpdateNow = () => {
    setShowModal(false);
    navigate('/profile/update');
  };

  const handleRemindLater = () => {
    setShowModal(false);
    setDismissed(true);
    // Store dismissal in session storage (will reset on new session)
    sessionStorage.setItem('profile_update_dismissed', 'true');
  };

  const status = getFreshnessStatus(freshnessCheck);
  const IconComponent = ICONS[status.icon] || AlertCircle;

  return (
    <>
      {children}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-${status.color}-100`}>
                <IconComponent className={`h-6 w-6 text-${status.color}-600`} />
              </div>
              <DialogTitle>
                {freshnessCheck.reason === 'new_year'
                  ? 'Nouvelle année fiscale'
                  : 'Mise à jour du profil recommandée'
                }
              </DialogTitle>
            </div>
            <DialogDescription className="pt-4">
              {freshnessCheck.message}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dernière mise à jour</span>
                <span className="font-medium">
                  {formatLastUpdate(freshnessCheck.lastUpdateDate)}
                </span>
              </div>
              {freshnessCheck.daysSinceUpdate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jours écoulés</span>
                  <span className="font-medium">{freshnessCheck.daysSinceUpdate} jours</span>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Des informations à jour garantissent une déclaration fiscale précise et évitent les erreurs.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleRemindLater}>
              Me rappeler plus tard
            </Button>
            <Button onClick={handleUpdateNow}>
              Mettre à jour maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProfileFreshnessGuard;
