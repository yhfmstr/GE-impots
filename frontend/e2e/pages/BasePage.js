/**
 * Base Page Object - Common functionality for all pages
 */
export class BasePage {
  constructor(page) {
    this.page = page;

    // Navigation elements
    this.navAccueil = page.getByRole('link', { name: 'Accueil' });
    this.navAssistant = page.getByRole('link', { name: 'Assistant' });
    this.navDeclaration = page.getByRole('link', { name: 'Déclaration' });
    this.navDocuments = page.getByRole('link', { name: 'Documents' });
    this.navResults = page.getByRole('link', { name: 'Résultats' });
    this.logo = page.getByRole('link', { name: 'GE Impôts Genève 2024' });
  }

  async goto(path = '/') {
    await this.page.goto(path);
  }

  async navigateToHome() {
    await this.navAccueil.click();
    await this.page.waitForURL('/');
  }

  async navigateToAssistant() {
    await this.navAssistant.click();
    await this.page.waitForURL('/chat');
  }

  async navigateToDeclaration() {
    await this.navDeclaration.click();
    await this.page.waitForURL('/declaration');
  }

  async navigateToDocuments() {
    await this.navDocuments.click();
    await this.page.waitForURL('/documents');
  }

  async navigateToResults() {
    await this.navResults.click();
    await this.page.waitForURL('/results');
  }

  async getTitle() {
    return await this.page.title();
  }

  async isNavigationVisible() {
    return await this.navAccueil.isVisible() &&
           await this.navAssistant.isVisible() &&
           await this.navDeclaration.isVisible() &&
           await this.navDocuments.isVisible() &&
           await this.navResults.isVisible();
  }
}
