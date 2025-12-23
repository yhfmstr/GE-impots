import { useRef, useEffect, useCallback, useState } from 'react';
import { Send, Bot, User, Loader2, Plus, MessageCircle, Minimize2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMarkdown } from '@/components/ui/markdown';
import { TAX_YEAR } from '@/config/taxYear';
import { STORAGE_KEYS, saveSecure, loadSecure } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { useChat } from '@/lib/chatContext';

// Maximum messages to keep per conversation
const MAX_MESSAGES = 100;

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Bonjour! Je suis votre assistant fiscal pour la déclaration ${TAX_YEAR}. Comment puis-je vous aider?`
};

export default function ChatWidget() {
  const { isOpen, setIsOpen } = useChat();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages on mount
  useEffect(() => {
    const saved = loadSecure(STORAGE_KEYS.CHAT_HISTORY, []);
    if (saved.length > 0 && saved[0]?.messages) {
      setMessages(saved[0].messages);
    }
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasUnread(false);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save messages
  const saveMessages = useCallback((msgs) => {
    const conv = {
      id: 'widget_conv',
      title: 'Conversation',
      messages: msgs,
      updatedAt: new Date().toISOString()
    };
    saveSecure(STORAGE_KEYS.CHAT_HISTORY, [conv]);
  }, []);

  // Add message
  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const updated = [...prev, message];
      const trimmed = updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
      saveMessages(trimmed);
      return trimmed;
    });
    if (!isOpen && message.role === 'assistant') {
      setHasUnread(true);
    }
  }, [saveMessages, isOpen]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    saveMessages([WELCOME_MESSAGE]);
  }, [saveMessages]);

  // Send message
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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Ouvrir l'assistant"
      >
        <MessageCircle className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
          isOpen ? "opacity-100 scale-100 h-[600px] max-h-[calc(100vh-6rem)]" : "opacity-0 scale-95 h-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold">Assistant fiscal</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewConversation}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              title="Réduire"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-2",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] px-3 py-2 rounded-2xl text-sm",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <ChatMarkdown variant={msg.role}>{msg.content}</ChatMarkdown>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 border-t border-border bg-muted/50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={loading}
              className="flex-1 h-10 text-sm"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
