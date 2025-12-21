import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';

test.describe('Home Page Tests', () => {
  test.describe('Page Load', () => {
    test('should display home page with main heading', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      expect(await homePage.isLoaded()).toBe(true);
    });

    test('should display navigation header', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Check that navigation links exist
      const navLinks = page.locator('nav a');
      expect(await navLinks.count()).toBeGreaterThan(0);
    });

    test('should display hero section with call-to-action buttons', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Check for the main CTA buttons
      const startLink = page.getByRole('link', { name: /Commencer ma déclaration/i });
      const questionLink = page.getByRole('link', { name: /Poser une question/i });

      expect(await startLink.isVisible()).toBe(true);
      expect(await questionLink.isVisible()).toBe(true);
    });
  });

  test.describe('Feature Cards', () => {
    test('should display all 4 feature cards', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      expect(await homePage.declarationCard.isVisible()).toBe(true);
      expect(await homePage.assistantCard.isVisible()).toBe(true);
      expect(await homePage.documentsCard.isVisible()).toBe(true);
      expect(await homePage.estimationCard.isVisible()).toBe(true);
    });

    test('should display correct feature card titles', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Check card titles - matching actual UI
      const declarationTitle = page.getByRole('heading', { name: /Déclaration pas à pas/i });
      const assistantTitle = page.getByRole('heading', { name: /Assistant fiscal/i });
      const documentsTitle = page.getByRole('heading', { name: /Mes documents/i });
      const estimationTitle = page.getByRole('heading', { name: /Estimation d'impôts/i });

      expect(await declarationTitle.isVisible()).toBe(true);
      expect(await assistantTitle.isVisible()).toBe(true);
      expect(await documentsTitle.isVisible()).toBe(true);
      expect(await estimationTitle.isVisible()).toBe(true);
    });
  });

  test.describe('Tax Information Display', () => {
    test('should display 2024 tax year reference', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const yearText = page.getByText(/2024/);
      expect(await yearText.first().isVisible()).toBe(true);
    });

    test('should display Geneva-specific content', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const genevaText = page.getByText(/Genève|Geneva|GE/i);
      expect(await genevaText.first().isVisible()).toBe(true);
    });
  });

  test.describe('Deduction Limits Display', () => {
    test('should display key deduction information', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Check for the deduction limits section heading
      const limitsHeading = page.getByRole('heading', { name: /Limites de déductions 2024/i });
      expect(await limitsHeading.isVisible()).toBe(true);

      // Check for specific values displayed (CHF format with apostrophe)
      const pilier3a = page.getByText(/7'056|7056/);
      expect(await pilier3a.isVisible()).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const homePage = new HomePage(page);
      await homePage.goto();

      expect(await homePage.isLoaded()).toBe(true);
      // On mobile, check that main CTA is visible
      const startLink = page.getByRole('link', { name: /Commencer ma déclaration/i });
      expect(await startLink.isVisible()).toBe(true);
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const homePage = new HomePage(page);
      await homePage.goto();

      expect(await homePage.isLoaded()).toBe(true);
      expect(await homePage.declarationCard.isVisible()).toBe(true);
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const homePage = new HomePage(page);
      await homePage.goto();

      expect(await homePage.isLoaded()).toBe(true);

      // All cards should be visible on desktop
      expect(await homePage.declarationCard.isVisible()).toBe(true);
      expect(await homePage.assistantCard.isVisible()).toBe(true);
      expect(await homePage.documentsCard.isVisible()).toBe(true);
      expect(await homePage.estimationCard.isVisible()).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Should have an h1
      const h1 = page.locator('h1');
      expect(await h1.count()).toBeGreaterThanOrEqual(1);
    });

    test('should have accessible navigation links', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Navigation should be in a nav element or have nav role
      const nav = page.locator('nav, [role="navigation"]');
      expect(await nav.count()).toBeGreaterThanOrEqual(1);
    });

    test('should have accessible buttons', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Start declaration button should be accessible
      const startButton = page.getByRole('link', { name: /Commencer ma déclaration/i });
      expect(await startButton.isVisible()).toBe(true);
    });
  });
});
