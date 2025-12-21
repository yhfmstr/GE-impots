import { BasePage } from './BasePage.js';

/**
 * Results Page Object
 */
export class ResultsPage extends BasePage {
  constructor(page) {
    super(page);

    // Page elements
    this.heading = page.getByRole('heading', { name: 'Résultats' });
    this.insufficientDataAlert = page.getByText(/Données insuffisantes/i);
    this.iccResult = page.locator('text=ICC').locator('..');
    this.ifdResult = page.locator('text=IFD').locator('..');
    this.totalResult = page.locator('text=/Total estimé/i');
  }

  async goto() {
    await super.goto('/results');
  }

  async isLoaded() {
    await this.heading.waitFor({ state: 'visible' });
    return await this.heading.isVisible();
  }

  async hasInsufficientDataMessage() {
    return await this.insufficientDataAlert.isVisible();
  }

  async getICCEstimate() {
    if (await this.iccResult.isVisible()) {
      const text = await this.iccResult.innerText();
      const match = text.match(/CHF\s*([\d',]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  async getIFDEstimate() {
    if (await this.ifdResult.isVisible()) {
      const text = await this.ifdResult.innerText();
      const match = text.match(/CHF\s*([\d',]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  async getTotalEstimate() {
    if (await this.totalResult.isVisible()) {
      const text = await this.totalResult.innerText();
      const match = text.match(/CHF\s*([\d',]+)/);
      return match ? match[1] : null;
    }
    return null;
  }
}
