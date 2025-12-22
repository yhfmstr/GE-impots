/**
 * Formatting utilities for GE-impots
 * Consistent formatting for currency, percentages, dates across the app
 */

/**
 * Format amount as Swiss Francs
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showDecimals - Show decimal places (default: false)
 * @param {boolean} options.showSymbol - Show CHF symbol (default: true)
 * @returns {string} Formatted amount
 */
export const formatCHF = (amount, options = {}) => {
  const { showDecimals = false, showSymbol = true } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? 'CHF 0' : '0';
  }

  const formatted = showDecimals
    ? amount.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(amount).toLocaleString('fr-CH');

  return showSymbol ? `CHF ${formatted}` : formatted;
};

/**
 * Format percentage
 * @param {number} rate - Rate as decimal (0.15 = 15%)
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (default: 1)
 * @param {boolean} options.showSymbol - Show % symbol (default: true)
 * @returns {string} Formatted percentage
 */
export const formatPercent = (rate, options = {}) => {
  const { decimals = 1, showSymbol = true } = options;

  if (rate === null || rate === undefined || isNaN(rate)) {
    return showSymbol ? '0%' : '0';
  }

  const percentage = (rate * 100).toFixed(decimals);
  return showSymbol ? `${percentage}%` : percentage;
};

/**
 * Format date in Swiss French format
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showTime - Include time (default: false)
 * @param {boolean} options.shortMonth - Use abbreviated month (default: false)
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  const { showTime = false, shortMonth = false } = options;

  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  const formatOptions = {
    day: 'numeric',
    month: shortMonth ? 'short' : 'long',
    year: 'numeric',
    ...(showTime && { hour: '2-digit', minute: '2-digit' })
  };

  return dateObj.toLocaleDateString('fr-CH', formatOptions);
};

/**
 * Format date as relative time (e.g., "il y a 2 jours")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'à l\'instant';
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`;

  return formatDate(date, { shortMonth: true });
};

/**
 * Format number with thousands separator
 * @param {number} value - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('fr-CH');
};

/**
 * Parse Swiss formatted number (with apostrophe as thousands separator)
 * @param {string} value - String to parse (e.g., "120'000")
 * @returns {number} Parsed number
 */
export const parseSwissNumber = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;

  // Remove apostrophes and spaces, replace comma with dot
  const cleaned = value.toString()
    .replace(/[''\s]/g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format confidence level as color class
 * @param {number} confidence - Confidence as decimal (0-1)
 * @returns {Object} Tailwind classes and label
 */
export const formatConfidence = (confidence) => {
  if (confidence >= 0.8) {
    return {
      bgClass: 'bg-green-100',
      textClass: 'text-green-700',
      borderClass: 'border-green-200',
      label: 'Élevée',
      icon: 'check'
    };
  }
  if (confidence >= 0.6) {
    return {
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-700',
      borderClass: 'border-yellow-200',
      label: 'Moyenne',
      icon: 'alert'
    };
  }
  return {
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    label: 'Faible',
    icon: 'warning'
  };
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export default {
  formatCHF,
  formatPercent,
  formatDate,
  formatRelativeTime,
  formatNumber,
  parseSwissNumber,
  formatConfidence,
  formatFileSize,
  truncate
};
