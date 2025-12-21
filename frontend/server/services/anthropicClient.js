import Anthropic from '@anthropic-ai/sdk';

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

export default { getClient };
