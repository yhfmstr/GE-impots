/**
 * Profile Freshness Check
 * Determines if a user's profile needs to be updated based on:
 * - Time since last update (> 60 days)
 * - Year change (profile last updated in previous year)
 * - Onboarding completion status
 */

const FRESHNESS_THRESHOLD_DAYS = 60;

/**
 * Check if a user's profile needs to be updated
 * @param {Object} profile - User profile from database
 * @returns {Object} Freshness check result
 */
export function checkProfileFreshness(profile) {
  if (!profile) {
    return {
      needsUpdate: true,
      reason: 'no_profile',
      daysSinceUpdate: -1,
      lastUpdateDate: null,
      message: 'Veuillez compléter votre profil pour continuer.',
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  // Check if onboarding completed
  if (!profile.onboarding_completed_at) {
    return {
      needsUpdate: true,
      reason: 'incomplete',
      daysSinceUpdate: -1,
      lastUpdateDate: null,
      message: 'Veuillez compléter votre profil pour commencer votre déclaration.',
    };
  }

  const lastUpdate = new Date(profile.profile_updated_at);
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check if new tax year (profile last updated in previous year)
  if (lastUpdate.getFullYear() < currentYear) {
    return {
      needsUpdate: true,
      reason: 'new_year',
      daysSinceUpdate,
      lastUpdateDate: lastUpdate,
      message: `Nouvelle année fiscale ! Veuillez vérifier que vos informations sont à jour pour ${currentYear}.`,
    };
  }

  // Check if profile is stale (> 60 days)
  if (daysSinceUpdate > FRESHNESS_THRESHOLD_DAYS) {
    return {
      needsUpdate: true,
      reason: 'expired',
      daysSinceUpdate,
      lastUpdateDate: lastUpdate,
      message: `Vos informations n'ont pas été mises à jour depuis ${daysSinceUpdate} jours. Veuillez vérifier qu'elles sont toujours exactes.`,
    };
  }

  return {
    needsUpdate: false,
    reason: null,
    daysSinceUpdate,
    lastUpdateDate: lastUpdate,
    message: null,
  };
}

/**
 * Format the last update date for display
 * @param {Date|string} date - Last update date
 * @returns {string} Formatted date string
 */
export function formatLastUpdate(date) {
  if (!date) return 'Jamais';
  const d = new Date(date);
  return d.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get a user-friendly freshness status
 * @param {Object} freshnessCheck - Result from checkProfileFreshness
 * @returns {Object} Status with color and icon
 */
export function getFreshnessStatus(freshnessCheck) {
  if (freshnessCheck.needsUpdate) {
    switch (freshnessCheck.reason) {
      case 'incomplete':
      case 'no_profile':
        return {
          status: 'incomplete',
          color: 'red',
          icon: 'alert-circle',
          label: 'Profil incomplet',
        };
      case 'new_year':
        return {
          status: 'new_year',
          color: 'orange',
          icon: 'calendar',
          label: 'Nouvelle année',
        };
      case 'expired':
        return {
          status: 'expired',
          color: 'yellow',
          icon: 'clock',
          label: 'À vérifier',
        };
      default:
        return {
          status: 'unknown',
          color: 'gray',
          icon: 'help-circle',
          label: 'Inconnu',
        };
    }
  }

  return {
    status: 'fresh',
    color: 'green',
    icon: 'check-circle',
    label: 'À jour',
  };
}

export default checkProfileFreshness;
