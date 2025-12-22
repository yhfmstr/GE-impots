import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage.js';
import { ChatPage } from './pages/ChatPage.js';
import { GuidePage } from './pages/GuidePage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { ResultsPage } from './pages/ResultsPage.js';

test.describe('Navigation Tests', () => {
  test.describe('Main Navigation', () => {
    test('should display all navigation links', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Check navigation links exist
      const navLinks = page.locator('nav a');
      expect(await navLinks.count()).toBeGreaterThan(0);

      // Check for specific nav items
      expect(await page.getByRole('link', { name: /Accueil/i }).first().isVisible()).toBe(true);
      expect(await page.getByRole('link', { name: /Assistant/i }).first().isVisible()).toBe(true);
      expect(await page.getByRole('link', { name: /Déclaration/i }).first().isVisible()).toBe(true);
    });

    test('should navigate to all main pages from navigation', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Navigate to Assistant
      await page.getByRole('link', { name: /Assistant/i }).first().click();
      await page.waitForURL('/chat');
      expect(page.url()).toContain('/chat');

      // Navigate to Declaration
      await page.getByRole('link', { name: /Déclaration/i }).first().click();
      await page.waitForURL('/declaration');
      expect(page.url()).toContain('/declaration');

      // Navigate to Documents
      await page.getByRole('link', { name: /Documents/i }).first().click();
      await page.waitForURL('/documents');
      expect(page.url()).toContain('/documents');

      // Navigate to Results
      await page.getByRole('link', { name: /Résultats/i }).first().click();
      await page.waitForURL('/results');
      expect(page.url()).toContain('/results');

      // Navigate back to Home
      await page.getByRole('link', { name: /Accueil/i }).first().click();
      await page.waitForURL('/');
      expect(page.url()).toMatch(/\/$/);
    });

    test('should navigate home via logo click', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.logo.click();
      await page.waitForURL('/');
      expect(page.url()).toMatch(/\/$/);
    });
  });

  test.describe('Page Title Verification', () => {
    test('all pages should have correct title', async ({ page }) => {
      const expectedTitle = 'Impôts Genève - Déclaration fiscale';

      // Home
      await page.goto('/');
      expect(await page.title()).toBe(expectedTitle);

      // Chat
      await page.goto('/chat');
      expect(await page.title()).toBe(expectedTitle);

      // Declaration
      await page.goto('/declaration');
      expect(await page.title()).toBe(expectedTitle);

      // Documents
      await page.goto('/documents');
      expect(await page.title()).toBe(expectedTitle);

      // Results
      await page.goto('/results');
      expect(await page.title()).toBe(expectedTitle);
    });
  });

  test.describe('Home Page Links', () => {
    test('should navigate to declaration from "Commencer ma déclaration" button', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.clickStartDeclaration();
      expect(page.url()).toContain('/declaration');
    });

    test('should navigate to chat from "Poser une question" button', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.clickAskQuestion();
      expect(page.url()).toContain('/chat');
    });

    test('feature cards should navigate to correct pages', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Declaration card
      await homePage.declarationCard.click();
      await page.waitForURL('/declaration');
      expect(page.url()).toContain('/declaration');

      // Go back and test assistant card
      await homePage.goto();
      await homePage.assistantCard.click();
      await page.waitForURL('/chat');
      expect(page.url()).toContain('/chat');

      // Go back and test documents card
      await homePage.goto();
      await homePage.documentsCard.click();
      await page.waitForURL('/documents');
      expect(page.url()).toContain('/documents');

      // Go back and test estimation card
      await homePage.goto();
      await homePage.estimationCard.click();
      await page.waitForURL('/results');
      expect(page.url()).toContain('/results');
    });
  });

  test.describe('Redirect Handling', () => {
    test('should redirect /guide to /declaration', async ({ page }) => {
      await page.goto('/guide');
      await page.waitForURL('/declaration');
      expect(page.url()).toContain('/declaration');
    });
  });
});
