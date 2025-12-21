import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Maximum messages to keep in memory to prevent unbounded growth
const MAX_MESSAGES = 100;

export default function Chat({ initialContext = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bonjour! Je suis votre assistant fiscal intelligent pour la déclaration d\'impôts genevoise 2024. Je peux vous aider sur tous les sujets: revenus, déductions, fortune, immobilier, et GeTax. Comment puis-je vous aider?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper to add message with bounded array
  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const updated = [...prev, message];
      // Keep only the last MAX_MESSAGES to prevent memory issues
      return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
    });
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await api.post('/chat', {
        message: userMessage,
        context: messages.slice(-10) // Send last 10 messages for context
      }, {
        signal: abortControllerRef.current.signal
      });

      // Check if component is still mounted (controller not aborted)
      if (!abortControllerRef.current.signal.aborted) {
        addMessage({ role: 'assistant', content: response.data.content });
      }
    } catch (error) {
      // Don't show error if request was intentionally aborted
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      const errorMessage = error.message || 'Désolé, une erreur s\'est produite. Veuillez réessayer.';
      addMessage({ role: 'assistant', content: errorMessage });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-red-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-red-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-red-600" />
            </div>
            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
