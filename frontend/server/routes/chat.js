import { Router } from 'express';
import { chat, AVAILABLE_AGENTS } from '../services/claude.js';

console.log('Chat routes loaded, chat function:', typeof chat);

const router = Router();

// Get available agents
router.get('/agents', (req, res) => {
  res.json(AVAILABLE_AGENTS);
});

// Chat with an agent
router.post('/', async (req, res) => {
  try {
    const { message, context = [], agent = 'tax-coordinator' } = req.body;
    console.log(`Chat request: "${message}" (agent: ${agent})`);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chat(message, context, agent);
    console.log('Chat response received');
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to get response from assistant', details: error.message });
  }
});

export default router;
