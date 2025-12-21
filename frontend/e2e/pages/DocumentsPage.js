import { BasePage } from './BasePage.js';

/**
 * Documents Page Object
 */
export class DocumentsPage extends BasePage {
  constructor(page) {
    super(page);

    // Page elements
    this.heading = page.getByRole('heading', { name: 'Documents' });
    this.autoDetectToggle = page.getByRole('button', { name: /Activé|Désactivé/i });
    this.uploadZone = page.getByText(/Glissez votre document ici/i);
    this.fileInput = page.locator('input[type="file"]');
    this.documentsHeading = page.getByRole('heading', { name: 'Documents analysés' });

    // Supported documents list
    this.supportedDocsHeading = page.getByRole('heading', { name: 'Documents supportés' });
  }

  async goto() {
    await super.goto('/documents');
  }

  async isLoaded() {
    await this.heading.waitFor({ state: 'visible' });
    return await this.heading.isVisible();
  }

  async toggleAutoDetect() {
    await this.autoDetectToggle.click();
  }

  async uploadDocument(filePath) {
    await this.fileInput.setInputFiles(filePath);
  }

  async getUploadedDocumentsCount() {
    const countText = await this.page.getByText(/\d+ document\(s\)/i).innerText();
    const match = countText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isDocumentInList(documentName) {
    return await this.page.getByText(documentName).isVisible();
  }

  async deleteDocument(documentName) {
    const docRow = this.page.getByText(documentName).locator('..').locator('..');
    await docRow.getByRole('button').first().click();
    // Confirm deletion if dialog appears
    const confirmButton = this.page.getByRole('button', { name: /Confirmer|Supprimer/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async getSupportedDocumentTypes() {
    const items = await this.page.locator('text=• ').all();
    const types = [];
    for (const item of items) {
      types.push(await item.innerText());
    }
    return types;
  }

  static getSupportedDocumentTypes() {
    return [
      'Certificat de salaire',
      'Attestation 3ème pilier A',
      'Attestation rachat LPP',
      'Relevés bancaires',
      'État des titres',
      'Attestation assurance maladie',
      'Attestation assurance-vie',
      'Factures frais de garde',
      'Attestation hypothécaire',
      'Factures formation',
      'Relevés de crédit/leasing',
      'Estimation immobilière'
    ];
  }
}
