import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Plus, History, Trash2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMarkdown } from '@/components/ui/markdown';
import { TAX_YEAR } from '@/config/taxYear';
import { STORAGE_KEYS, saveSecure, loadSecure } from '@/lib/storage';

// Maximum messages to keep per conversation
const MAX_MESSAGES = 100;
// Maximum conversations to keep
const MAX_CONVERSATIONS = 20;

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Bonjour! Je suis votre assistant fiscal intelligent pour la déclaration d'impôts genevoise ${TAX_YEAR}. Je peux vous aider sur tous les sujets: revenus, déductions, fortune, immobilier, et GeTax. Comment puis-je vous aider?`
};

// Generate unique ID for conversations
const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Get conversation title from first user message or default
const getConversationTitle = (messages) => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const text = firstUserMessage.content.slice(0, 40);
    return text.length < firstUserMessage.content.length ? `${text}...` : text;
  }
  return 'Nouvelle conversation';
};

export default function Chat({ initialContext = [] }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    const saved = loadSecure(STORAGE_KEYS.CHAT_HISTORY, []);
    if (saved.length > 0) {
      setConversations(saved);
      // Load the most recent conversation
      const latest = saved[0];
      setCurrentConversationId(latest.id);
      setMessages(latest.messages);
    } else {
      // Create first conversation
      const newConv = {
        id: generateId(),
        title: 'Nouvelle conversation',
        messages: [WELCOME_MESSAGE],
        updatedAt: new Date().toISOString()
      };
      setConversations([newConv]);
      setCurrentConversationId(newConv.id);
      saveSecure(STORAGE_KEYS.CHAT_HISTORY, [newConv]);
    }
  }, []);

  // Save conversations when they change
  const saveConversations = useCallback((convs) => {
    // Keep only MAX_CONVERSATIONS most recent
    const trimmed = convs.slice(0, MAX_CONVERSATIONS);
    saveSecure(STORAGE_KEYS.CHAT_HISTORY, trimmed);
  }, []);

  // Update current conversation in storage
  const updateCurrentConversation = useCallback((newMessages) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: newMessages,
            title: getConversationTitle(newMessages),
            updatedAt: new Date().toISOString()
          };
        }
        return conv;
      });
      // Sort by most recent
      updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      saveConversations(updated);
      return updated;
    });
  }, [currentConversationId, saveConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Add message with bounded array
  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const updated = [...prev, message];
      const trimmed = updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
      // Save to storage after state update
      setTimeout(() => updateCurrentConversation(trimmed), 0);
      return trimmed;
    });
  }, [updateCurrentConversation]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    const newConv = {
      id: generateId(),
      title: 'Nouvelle conversation',
      messages: [WELCOME_MESSAGE],
      updatedAt: new Date().toISOString()
    };
    setConversations(prev => {
      const updated = [newConv, ...prev].slice(0, MAX_CONVERSATIONS);
      saveConversations(updated);
      return updated;
    });
    setCurrentConversationId(newConv.id);
    setMessages([WELCOME_MESSAGE]);
    setShowHistory(false);
  }, [saveConversations]);

  // Switch to conversation
  const switchConversation = useCallback((convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages);
      setShowHistory(false);
    }
  }, [conversations]);

  // Delete conversation
  const deleteConversation = useCallback((convId, e) => {
    e.stopPropagation();
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== convId);
      saveConversations(updated);

      // If deleting current conversation, switch to another or create new
      if (convId === currentConversationId) {
        if (updated.length > 0) {
          setCurrentConversationId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          startNewConversation();
        }
      }
      return updated;
    });
  }, [currentConversationId, saveConversations, startNewConversation]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await api.post('/chat', {
        message: userMessage,
        context: messages.slice(-10)
      }, {
        signal: abortControllerRef.current.signal
      });

      if (!abortControllerRef.current.signal.aborted) {
        addMessage({ role: 'assistant', content: response.data.content });
      }
    } catch (error) {
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

  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-CH');
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header with history toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Historique</span>
          </Button>
          <span className="text-sm text-gray-500">
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={startNewConversation}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* History sidebar */}
        {showHistory && (
          <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => switchConversation(conv.id)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors group ${
                    conv.id === currentConversationId
                      ? 'bg-red-100 text-red-900'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate font-medium">{conv.title}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(conv.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
                <ChatMarkdown variant={msg.role}>{msg.content}</ChatMarkdown>
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
      </div>

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
