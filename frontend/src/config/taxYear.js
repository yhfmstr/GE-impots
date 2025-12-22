/**
 * Tax Year Configuration
 *
 * Central configuration for the current tax year.
 * Update VITE_TAX_YEAR in .env when transitioning to a new year.
 *
 * Annual Update Checklist:
 * 1. Update VITE_TAX_YEAR in .env
 * 2. Update knowledge base files (deductions, baremes, etc.)
 * 3. Verify GeTax field mappings are still valid
 * 4. Test with new year's documents
 */

export const TAX_YEAR = parseInt(import.meta.env.VITE_TAX_YEAR) || 2024;
export const TAX_YEAR_LABEL = `${TAX_YEAR}`;

// Helper for generating year-specific text
export const withYear = (text) => text.replace(/{year}/g, TAX_YEAR_LABEL);

// Export filename helpers
export const getExportFilename = (prefix) => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${TAX_YEAR}-${date}`;
};
