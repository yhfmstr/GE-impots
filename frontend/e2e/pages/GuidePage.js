import { BasePage } from './BasePage.js';

/**
 * Guide/Declaration Page Object
 */
export class GuidePage extends BasePage {
  constructor(page) {
    super(page);

    // Page elements
    this.heading = page.getByRole('heading', { name: 'Déclaration d\'impôts 2024' });
    this.pageSelector = page.getByRole('combobox');
    this.uploadButton = page.getByRole('button', { name: /Télécharger un document/i });
    this.rubriquesHeading = page.getByRole('heading', { name: 'Rubriques à remplir' });
    this.chatButton = page.getByRole('button', { name: /Poser une question sur cette page/i });

    // Alert elements
    this.noDataAlert = page.getByText(/Commencez par importer vos documents/i);
  }

  async goto() {
    await super.goto('/declaration');
  }

  async isLoaded() {
    await this.heading.waitFor({ state: 'visible' });
    return await this.heading.isVisible();
  }

  async selectGeTaxPage(pageName) {
    await this.pageSelector.click();
    await this.page.getByRole('option', { name: new RegExp(pageName, 'i') }).click();
  }

  async getCurrentPageName() {
    return await this.pageSelector.innerText();
  }

  async openUploadSection() {
    await this.uploadButton.click();
    await this.page.waitForTimeout(300);
  }

  async selectDocumentType(docType) {
    await this.page.getByRole('button', { name: docType }).click();
  }

  async uploadFile(filePath) {
    const fileInput = await this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async isUploadSuccessVisible() {
    return await this.page.getByText(/analysé.*champs extraits/i).isVisible();
  }

  async getFieldValue(code) {
    const fieldRow = this.page.locator(`text=${code}`).locator('..').locator('..');
    const valueElement = fieldRow.locator('.font-mono');
    if (await valueElement.isVisible()) {
      return await valueElement.innerText();
    }
    return null;
  }

  async copyFieldValue(code) {
    const fieldRow = this.page.locator(`text=${code}`).locator('..').locator('..');
    const copyButton = fieldRow.getByRole('button', { name: /Copier/i });
    await copyButton.click();
  }

  async getVisibleRubriques() {
    // Look for code elements that contain patterns like "11.10", "31.40" etc.
    const codeElements = await this.page.locator('text=/^\\d{2}\\.\\d{2}$/').all();
    const codes = [];
    for (const element of codeElements) {
      const text = await element.innerText();
      if (/^\d{2}\.\d{2}$/.test(text.trim())) {
        codes.push(text.trim());
      }
    }
    return codes;
  }

  async openQuickChat() {
    await this.chatButton.click();
    await this.page.waitForTimeout(300);
  }

  async askQuickQuestion(question) {
    await this.openQuickChat();
    const input = this.page.getByPlaceholder(/Ex: Comment calculer/i);
    await input.fill(question);
    await this.page.getByRole('button', { name: 'Demander' }).click();
  }

  // GeTax pages configuration
  static getPages() {
    return [
      { id: 'annexe-a', name: 'Annexe A - Activité dépendante', codes: ['11.10', '11.15', '31.10', '31.12', '31.40', '31.50', '31.20'] },
      { id: 'annexe-c', name: 'Annexe C - Assurances et prévoyance', codes: ['52.21', '52.22', '52.11', '52.15'] },
      { id: 'annexe-d', name: 'Annexe D - Fortune immobilière', codes: ['15.10', '35.10', '35.11', '35.30', '65.10', '65.20'] },
      { id: 'annexe-f', name: 'Annexe F - Fortune mobilière', codes: ['60.10', '60.20', '60.30', '60.50', '60.70'] },
      { id: 'annexe-e', name: 'Annexe E - Dettes', codes: ['55.10', '66.10'] }
    ];
  }
}
