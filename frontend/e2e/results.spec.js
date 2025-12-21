import { test, expect } from '@playwright/test';
import { ResultsPage } from './pages/ResultsPage.js';

test.describe('Results Page Tests', () => {
  test.describe('Page Load', () => {
    test('should display results page with heading', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      expect(await resultsPage.isLoaded()).toBe(true);
    });

    test('should show insufficient data message when no documents uploaded', async ({ page }) => {
      // Clear localStorage first
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      expect(await resultsPage.hasInsufficientDataMessage()).toBe(true);
    });
  });

  test.describe('Tax Estimation Display', () => {
    test('should display results heading', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Check for main heading
      const heading = page.getByRole('heading', { level: 1, name: /Résultats/i });
      expect(await heading.isVisible()).toBe(true);
    });

    test('should display estimation description', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Check for page description - use first() to handle multiple matches
      const description = page.getByText(/Estimation de vos impôts/i).first();
      expect(await description.isVisible()).toBe(true);
    });

    test('should show insufficient data alert when no documents', async ({ page }) => {
      // Clear localStorage first
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Should show "Données insuffisantes" alert
      const alert = page.getByText(/Données insuffisantes/i);
      expect(await alert.isVisible()).toBe(true);
    });
  });

  test.describe('Data Requirements', () => {
    test('should indicate what data is needed for estimation', async ({ page }) => {
      // Clear localStorage first
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Should indicate need for documents or data
      const needDataText = page.getByText(/document|données|information|renseigner/i);
      expect(await needDataText.first().isVisible()).toBe(true);
    });

    test('should have link to upload documents', async ({ page }) => {
      // Clear localStorage first
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());

      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Should have navigation to documents or declaration
      const uploadLink = page.getByRole('link', { name: /document|déclaration|télécharger/i });
      const hasUploadLink = await uploadLink.first().isVisible().catch(() => false);

      // Or a button to navigate
      const uploadButton = page.getByRole('button', { name: /document|déclaration|commencer/i });
      const hasUploadButton = await uploadButton.first().isVisible().catch(() => false);

      expect(hasUploadLink || hasUploadButton).toBe(true);
    });
  });

  test.describe('Estimation Accuracy Indicators', () => {
    test('should display estimation disclaimer', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Should indicate this is an estimation, not exact
      const estimationText = page.getByText(/estimation|approximat|indicati/i);
      expect(await estimationText.first().isVisible()).toBe(true);
    });
  });

  test.describe('Tax Rate Information', () => {
    test('should reference Geneva tax rates', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Page should reference tax calculations
      const taxRef = page.getByText(/impôt|tax|barème|taux/i);
      expect(await taxRef.first().isVisible()).toBe(true);
    });
  });

  test.describe('Navigation from Results', () => {
    test('should allow navigation to other pages', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Should have navigation available - use first() to handle multiple nav elements
      const nav = page.locator('nav').first();
      expect(await nav.isVisible()).toBe(true);
    });

    test('should navigate to documents page', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Use navigation link
      await page.getByRole('link', { name: /Documents/i }).first().click();
      await page.waitForURL('/documents');
      expect(page.url()).toContain('/documents');
    });

    test('should navigate to declaration page', async ({ page }) => {
      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      // Use navigation link
      await page.getByRole('link', { name: /Déclaration/i }).first().click();
      await page.waitForURL('/declaration');
      expect(page.url()).toContain('/declaration');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      expect(await resultsPage.isLoaded()).toBe(true);
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const resultsPage = new ResultsPage(page);
      await resultsPage.goto();

      expect(await resultsPage.isLoaded()).toBe(true);
    });
  });
});
