import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage.js';

test.describe('Chat/Assistant Tests', () => {
  test.describe('Page Load', () => {
    test('should display chat page with welcome message', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      expect(await chatPage.isLoaded()).toBe(true);
      expect(await chatPage.welcomeMessage.isVisible()).toBe(true);
    });

    test('should have message input enabled', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      expect(await chatPage.isInputEnabled()).toBe(true);
    });

    test('should have send button disabled when input is empty', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      // Button should be disabled when input is empty
      const sendButton = page.getByRole('button').filter({ has: page.locator('svg') });
      expect(await sendButton.isDisabled()).toBe(true);
    });

    test('should enable send button when text is entered', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.messageInput.fill('Test message');

      const sendButton = page.getByRole('button').filter({ has: page.locator('svg') });
      expect(await sendButton.isDisabled()).toBe(false);
    });
  });

  test.describe('Chat Functionality', () => {
    // Increase timeout for API calls
    test.setTimeout(60000);

    test('should send message and receive response about 3ème pilier A', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.askAboutDeduction('pilier3a');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastAssistantMessage();
      expect(response).toBeTruthy();
      // Should mention the 7,056 CHF limit
      expect(response).toMatch(/7['\s,.]?056|7056/i);
    });

    test('should send message and receive response about immobilier', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.askAboutDeduction('immobilier');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastAssistantMessage();
      expect(response).toBeTruthy();
      // Should mention forfait percentages
      expect(response).toMatch(/25%|20%|15%|10%|forfait/i);
    });

    test('should handle multiple messages in conversation', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      // First message
      await chatPage.sendMessage('Bonjour');
      await chatPage.waitForResponse();
      const count1 = await chatPage.getMessagesCount();

      // Second message
      await chatPage.sendMessage('Merci');
      await chatPage.waitForResponse();
      const count2 = await chatPage.getMessagesCount();

      // Should have more messages after second exchange
      expect(count2).toBeGreaterThan(count1);
    });

    test('should disable input while waiting for response', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.messageInput.fill('Test question sur les impôts');
      await chatPage.sendButton.click();

      // Input should be disabled while loading
      expect(await chatPage.messageInput.isDisabled()).toBe(true);

      // Wait for response
      await chatPage.waitForResponse();

      // Input should be enabled again
      expect(await chatPage.messageInput.isDisabled()).toBe(false);
    });
  });

  test.describe('Tax Knowledge Verification', () => {
    test.setTimeout(60000);

    test('should know about frais de garde limits', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.sendMessage('Quelle est la limite de déduction pour les frais de garde en 2024?');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastAssistantMessage();
      // Should mention 26,080 CHF (ICC) or 25,500 CHF (IFD)
      expect(response).toMatch(/26['\s,.]?080|25['\s,.]?500|26080|25500/i);
    });

    test('should know about formation continue limits', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.sendMessage('Combien puis-je déduire pour la formation continue?');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastAssistantMessage();
      // Should mention 12,640 CHF (ICC) or 12,900 CHF (IFD)
      expect(response).toMatch(/12['\s,.]?640|12['\s,.]?900|12640|12900/i);
    });

    test('should know about health insurance premium limits', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.sendMessage('Quelle est la limite de déduction pour les primes d\'assurance maladie?');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastAssistantMessage();
      // Should mention 16,207 CHF for adults
      expect(response).toMatch(/16['\s,.]?207|16207/i);
    });

    test('should explain difference between ICC and IFD', async ({ page }) => {
      const chatPage = new ChatPage(page);
      await chatPage.goto();

      await chatPage.sendMessage('Quelle est la différence entre ICC et IFD pour les déductions?');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastAssistantMessage();
      // Should mention both ICC (cantonal) and IFD (fédéral)
      expect(response).toMatch(/ICC|cantonal/i);
      expect(response).toMatch(/IFD|fédéral/i);
    });
  });
});
