import { BasePage } from './BasePage.js';

/**
 * Chat/Assistant Page Object
 */
export class ChatPage extends BasePage {
  constructor(page) {
    super(page);

    // Chat page elements
    this.heading = page.getByRole('heading', { name: 'Assistant fiscal' });
    this.welcomeMessage = page.getByText(/assistant fiscal intelligent/i);
    this.messageInput = page.getByRole('textbox', { name: 'Posez votre question...' });
    this.sendButton = page.getByRole('button').filter({ has: page.locator('svg') });
    this.loadingIndicator = page.locator('.animate-spin');
  }

  async goto() {
    await super.goto('/chat');
  }

  async isLoaded() {
    await this.heading.waitFor({ state: 'visible' });
    return await this.heading.isVisible();
  }

  async sendMessage(message) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    // Wait for loading to start
    await this.page.waitForTimeout(500);
  }

  async waitForResponse(timeout = 30000) {
    // Wait for loading to disappear and new message to appear
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout });
    await this.page.waitForTimeout(500);
  }

  async getLastAssistantMessage() {
    const messages = await this.page.locator('.bg-gray-100').all();
    if (messages.length === 0) return null;
    return await messages[messages.length - 1].innerText();
  }

  async getMessagesCount() {
    const messages = await this.page.locator('.rounded-2xl').all();
    return messages.length;
  }

  async isInputEnabled() {
    return await this.messageInput.isEnabled();
  }

  async askAboutDeduction(topic) {
    const questions = {
      'pilier3a': 'Quel est le montant maximum déductible pour le 3ème pilier A en 2024?',
      'frais-garde': 'Quelles sont les limites de déduction pour les frais de garde en 2024?',
      'immobilier': 'Quel est le forfait pour les frais d\'entretien immobilier?',
      'fortune': 'Comment déclarer ma fortune mobilière?',
      'transport': 'Quels sont les frais de transport déductibles?'
    };
    await this.sendMessage(questions[topic] || topic);
  }
}
