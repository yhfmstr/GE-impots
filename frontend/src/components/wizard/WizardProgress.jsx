import { Check, Clock } from 'lucide-react';
import {
  User,
  Briefcase,
  HandCoins,
  PiggyBank,
  Receipt,
  FileCheck,
  Wallet,
  Home,
  CreditCard
} from 'lucide-react';
import { SECTION_METADATA } from '@/config/wizardConfig';

// Icon mapping for sections
const SECTION_ICONS = {
  User,
  Briefcase,
  HandCoins,
  PiggyBank,
  Receipt,
  FileCheck,
  Wallet,
  Home,
  CreditCard
};

/**
 * WizardProgress - Step indicator for wizard mode
 *
 * Props:
 * - sections: Array of section IDs for the current profile
 * - currentIndex: Current section index (0-based)
 * - completedSections: Array of completed section IDs
 * - estimatedTimeRemaining: Minutes remaining (optional)
 * - onSectionClick: Callback when clicking on a section
 */
export default function WizardProgress({
  sections,
  currentIndex,
  completedSections = [],
  estimatedTimeRemaining,
  onSectionClick
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header with time estimate */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700">
          Étape {currentIndex + 1} sur {sections.length}
        </span>
        {estimatedTimeRemaining !== undefined && (
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            ~{estimatedTimeRemaining} min restantes
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div
          className="bg-red-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / sections.length) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between">
        {sections.map((sectionId, index) => {
          const metadata = SECTION_METADATA[sectionId];
          const isCompleted = completedSections.includes(sectionId);
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex || completedSections.includes(sectionId);
          const IconComponent = SECTION_ICONS[metadata?.icon] || FileCheck;

          return (
            <button
              key={sectionId}
              onClick={() => isClickable && onSectionClick?.(index)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1 group ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              title={metadata?.title}
            >
              {/* Dot/Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-red-600 text-white ring-4 ring-red-100'
                    : 'bg-gray-200 text-gray-400'
                } ${isClickable && !isCurrent ? 'group-hover:ring-2 group-hover:ring-gray-300' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>

              {/* Label (visible on larger screens) */}
              <span
                className={`text-xs hidden md:block max-w-[80px] text-center truncate ${
                  isCurrent ? 'text-red-600 font-medium' : 'text-gray-500'
                }`}
              >
                {metadata?.title?.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact horizontal progress for mobile
 */
export function WizardProgressCompact({
  sections,
  currentIndex,
  completedSections = []
}) {
  return (
    <div className="flex items-center gap-1">
      {sections.map((sectionId, index) => {
        const isCompleted = completedSections.includes(sectionId);
        const isCurrent = index === currentIndex;

        return (
          <div
            key={sectionId}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              isCompleted
                ? 'bg-green-500'
                : isCurrent
                ? 'bg-red-600'
                : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}
