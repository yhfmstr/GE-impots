import { BasePage } from './BasePage.js';

/**
 * Guide/Declaration Page Object
 */
export class GuidePage extends BasePage {
  constructor(page) {
    super(page);

    // Page elements
    this.heading = page.getByRole('heading', { name: /Déclaration d'impôts \d{4}/ });
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

  // GeTax pages configuration (must match GuidePage.jsx GETAX_PAGES)
  static getPages() {
    return [
      { id: 'annexe-a', name: 'Annexe A - Activité dépendante', codes: ['11.10', '11.15', '11.30', '11.40', '11.50', '11.60', '11.70', '11.90', '11.91', '11.92', '31.10', '31.12', '31.30', '31.40', '31.50', '31.20', '31.60', '31.70', '31.71', '31.63', '31.90', '31.95'] },
      { id: 'annexe-b', name: 'Annexe B - Activité indépendante', codes: ['12.01', '12.28', '12.29', '22.01', '32.10', '42.10', '32.20', '42.20', '32.30', '32.40'] },
      { id: 'annexe-c', name: 'Annexe C - Autres revenus et déductions', codes: ['17.10', '17.20', '13.10', '13.15', '13.20', '13.30', '13.40', '13.50', '16.10', '16.20', '16.30', '16.35', '16.40', '16.50', '16.63', '16.64', '16.80', '52.21', '52.22', '52.11', '52.00', '52.15', '59.10', '59.12', '59.20', '59.50', '59.40', '59.70', '59.75', '53.10', '54.10', '33.20', '56.30', '59.65', '59.66', '58.10', '52.30', '80.10', '80.20'] },
      { id: 'annexe-d', name: 'Annexe D - Fortune immobilière', codes: ['15.10', '15.13', '15.20', '15.30', '15.40', '15.43', '15.50', '35.10', '35.11', '35.20', '35.30', '65.10', '65.20'] },
      { id: 'annexe-e', name: 'Annexe E - Dettes', codes: ['55.10', '55.20', '66.10'] },
      { id: 'annexe-f', name: 'Annexe F - Fortune mobilière', codes: ['60.10', '60.20', '60.30', '60.40', '60.50', '60.60', '60.70', '60.80'] }
    ];
  }
}
