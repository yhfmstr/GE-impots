import { test, expect } from '@playwright/test';
import { GuidePage } from './pages/GuidePage.js';

test.describe('Declaration Guide Tests', () => {
  test.describe('Page Load', () => {
    test('should display guide page with heading', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      expect(await guidePage.isLoaded()).toBe(true);
    });

    test('should show no data warning when no documents uploaded', async ({ page }) => {
      // Clear localStorage first
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      const guidePage = new GuidePage(page);
      await guidePage.goto();

      expect(await guidePage.noDataAlert.isVisible()).toBe(true);
    });

    test('should display GeTax page selector', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      expect(await guidePage.pageSelector.isVisible()).toBe(true);
    });

    test('should display rubriques section', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      expect(await guidePage.rubriquesHeading.isVisible()).toBe(true);
    });
  });

  test.describe('GeTax Page Navigation', () => {
    test('should default to Annexe A - Activité dépendante', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      const currentPage = await guidePage.getCurrentPageName();
      expect(currentPage).toContain('Annexe A');
    });

    test('should switch to Annexe C - Assurances', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.selectGeTaxPage('Annexe C');

      const currentPage = await guidePage.getCurrentPageName();
      expect(currentPage).toContain('Annexe C');
    });

    test('should switch to Annexe D - Fortune immobilière', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.selectGeTaxPage('Annexe D');

      const currentPage = await guidePage.getCurrentPageName();
      expect(currentPage).toContain('Annexe D');
    });

    test('should display all GeTax pages in selector', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.pageSelector.click();

      const pages = GuidePage.getPages();
      for (const pageConfig of pages) {
        const option = page.getByRole('option', { name: new RegExp(pageConfig.name.substring(0, 15), 'i') });
        expect(await option.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Rubriques Display', () => {
    test('should display correct codes for Annexe A', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      // Check that some rubrique codes are visible (format XX.XX)
      const codePattern = page.getByText(/^\d{2}\.\d{2}$/);
      expect(await codePattern.first().isVisible()).toBe(true);

      // Check for specific codes in Annexe A
      const code11_10 = page.getByText('11.10', { exact: true });
      expect(await code11_10.isVisible()).toBe(true);
    });

    test('should display correct codes for Annexe C', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.selectGeTaxPage('Annexe C');

      // Check that rubriques section exists
      const rubriquesHeading = page.getByRole('heading', { name: /Rubriques à remplir/i });
      expect(await rubriquesHeading.isVisible()).toBe(true);

      // Check for code patterns
      const codePattern = page.getByText(/^\d{2}\.\d{2}$/);
      expect(await codePattern.first().isVisible()).toBe(true);
    });

    test('should display correct codes for Annexe F (Fortune mobilière)', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.selectGeTaxPage('Annexe F');

      // Check that rubriques section exists
      const rubriquesHeading = page.getByRole('heading', { name: /Rubriques à remplir/i });
      expect(await rubriquesHeading.isVisible()).toBe(true);

      // Check for code patterns
      const codePattern = page.getByText(/^\d{2}\.\d{2}$/);
      expect(await codePattern.first().isVisible()).toBe(true);
    });
  });

  test.describe('Upload Section', () => {
    test('should toggle upload section', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      // Open upload section
      await guidePage.openUploadSection();

      // Check if upload zone is visible
      const uploadZone = page.getByText(/Glissez votre/i);
      expect(await uploadZone.isVisible()).toBe(true);
    });

    test('should display document type buttons for current page', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.openUploadSection();

      // Annexe A should have certificat-salaire option
      const certButton = page.getByRole('button', { name: 'Certificat de salaire' });
      expect(await certButton.isVisible()).toBe(true);
    });

    test('should change document types when switching pages', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      // Switch to Annexe D (immobilier)
      await guidePage.selectGeTaxPage('Annexe D');
      await guidePage.openUploadSection();

      // Should have attestation hypothécaire option
      const hypoButton = page.getByRole('button', { name: 'Attestation hypothécaire' });
      expect(await hypoButton.isVisible()).toBe(true);
    });
  });

  test.describe('Quick Chat', () => {
    test('should toggle quick chat section', async ({ page }) => {
      const guidePage = new GuidePage(page);
      await guidePage.goto();

      await guidePage.openQuickChat();

      const chatInput = page.getByPlaceholder(/Ex: Comment calculer/i);
      expect(await chatInput.isVisible()).toBe(true);
    });
  });

  test.describe('Missing Documents Hints', () => {
    test('should show recommended documents for Annexe A', async ({ page }) => {
      // Clear localStorage first
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      const guidePage = new GuidePage(page);
      await guidePage.goto();

      // Should recommend documents
      const recommendedDocs = page.getByText(/Documents recommandés/i);
      expect(await recommendedDocs.isVisible()).toBe(true);
    });
  });
});
