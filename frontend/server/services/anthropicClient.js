import Anthropic from '@anthropic-ai/sdk';

// Default model - Claude Opus 4.5
const DEFAULT_MODEL = 'claude-opus-4-5-20251101';

// Singleton Anthropic client - lazy initialized
let client = null;

export function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Get configured model from environment or use default
export function getModel() {
  return process.env.CLAUDE_MODEL || DEFAULT_MODEL;
}

export default { getClient, getModel };
