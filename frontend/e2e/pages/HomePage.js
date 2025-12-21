import { BasePage } from './BasePage.js';

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  constructor(page) {
    super(page);

    // Home page specific elements
    this.mainHeading = page.getByRole('heading', { level: 1 });
    this.startDeclarationButton = page.getByRole('link', { name: /Commencer ma déclaration/i });
    this.askQuestionButton = page.getByRole('link', { name: /Poser une question/i });

    // Feature cards - using href for more reliable selection
    this.declarationCard = page.locator('a[href="/declaration"]').filter({ hasText: /Déclaration pas à pas/i });
    this.assistantCard = page.locator('a[href="/chat"]').filter({ hasText: /Assistant fiscal/i });
    this.documentsCard = page.locator('a[href="/documents"]').filter({ hasText: /Mes documents/i });
    this.estimationCard = page.locator('a[href="/results"]').filter({ hasText: /Estimation/i });

    // Deduction limits section
    this.deductionLimitsHeading = page.getByRole('heading', { name: /Limites de déductions 2024/i });
  }

  async goto() {
    await super.goto('/');
  }

  async isLoaded() {
    await this.mainHeading.waitFor({ state: 'visible' });
    return await this.mainHeading.isVisible();
  }

  async clickStartDeclaration() {
    await this.startDeclarationButton.click();
    await this.page.waitForURL('/declaration');
  }

  async clickAskQuestion() {
    await this.askQuestionButton.click();
    await this.page.waitForURL('/chat');
  }

  async getDeductionLimitText(limitName) {
    const limitElement = this.page.getByText(limitName);
    return await limitElement.isVisible();
  }

  async verifyDeductionLimits() {
    // Verify key 2024 deduction limits are displayed
    const limits = [
      { name: '3ème pilier A', value: '7\'056' },
      { name: 'Frais de garde', value: '26\'080' },
      { name: 'Formation continue', value: '12\'640' },
      { name: 'Assurance maladie', value: '16\'207' }
    ];

    for (const limit of limits) {
      const isVisible = await this.page.getByText(limit.value).isVisible();
      if (!isVisible) {
        return false;
      }
    }
    return true;
  }
}
