import { test, expect } from '@playwright/test';
import { DocumentsPage } from './pages/DocumentsPage.js';

test.describe('Documents Page Tests', () => {
  test.describe('Page Load', () => {
    test('should display documents page with heading', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      // Check for the h1 heading "Documents"
      const heading = page.getByRole('heading', { level: 1, name: 'Documents' });
      expect(await heading.isVisible()).toBe(true);
    });

    test('should display auto-detect toggle', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      expect(await docsPage.autoDetectToggle.isVisible()).toBe(true);
    });

    test('should display upload zone', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      expect(await docsPage.uploadZone.isVisible()).toBe(true);
    });

    test('should display supported documents list', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      expect(await docsPage.supportedDocsHeading.isVisible()).toBe(true);
    });
  });

  test.describe('Supported Documents', () => {
    test('should list all expected document types', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      const expectedTypes = DocumentsPage.getSupportedDocumentTypes();

      for (const docType of expectedTypes) {
        const isVisible = await page.getByText(docType, { exact: false }).isVisible();
        expect(isVisible).toBe(true);
      }
    });
  });

  test.describe('Auto-Detect Toggle', () => {
    test('should toggle auto-detect feature', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      const initialText = await docsPage.autoDetectToggle.innerText();

      await docsPage.toggleAutoDetect();

      const newText = await docsPage.autoDetectToggle.innerText();

      // Text should have changed (Activé -> Désactivé or vice versa)
      expect(newText).not.toBe(initialText);
    });
  });

  test.describe('Documents List', () => {
    test('should show documents section or empty state', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      // Documents page should be loaded - check for either:
      // 1. "Documents analysés" section (when documents exist)
      // 2. OR the documents page is showing the upload area (empty state)

      const analyzedHeading = page.getByText('Documents analysés');
      const uploadZone = page.getByText(/Glissez votre document ici/i);

      const hasAnalyzed = await analyzedHeading.isVisible().catch(() => false);
      const hasUploadZone = await uploadZone.isVisible().catch(() => false);

      // Either documents are shown OR the upload zone is visible
      expect(hasAnalyzed || hasUploadZone).toBe(true);
    });
  });

  test.describe('Upload Functionality', () => {
    test('should have file input available', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      expect(await docsPage.fileInput.count()).toBe(1);
    });

    test('should accept correct file types', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      const acceptAttr = await docsPage.fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('.pdf');
      expect(acceptAttr).toContain('.jpg');
      expect(acceptAttr).toContain('.png');
    });
  });

  test.describe('Drag and Drop Zone', () => {
    test('should display drop instructions', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      const dropText = page.getByText(/Glissez votre document ici/i);
      expect(await dropText.isVisible()).toBe(true);
    });

    test('should display "Choisir un fichier" button', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      const chooseButton = page.getByText('Choisir un fichier');
      expect(await chooseButton.isVisible()).toBe(true);
    });

    test('should display file format info', async ({ page }) => {
      const docsPage = new DocumentsPage(page);
      await docsPage.goto();

      const formatInfo = page.getByText(/JPG.*PNG.*PDF.*10 MB/i);
      expect(await formatInfo.isVisible()).toBe(true);
    });
  });
});
