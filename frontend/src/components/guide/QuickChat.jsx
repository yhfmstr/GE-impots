import { useState } from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Markdown } from '@/components/ui/markdown';

/**
 * Quick chat component for asking questions about current annexe
 */
export default function QuickChat({ selectedPage }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const askGuide = async () => {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      const response = await api.post('/chat', {
        message: `Je suis sur ${selectedPage.name}. ${chatInput}`,
        agent: 'getax-guide'
      });
      setChatResponse(response.data.content);
    } catch (error) {
      setChatResponse(error.message || 'Erreur lors de la communication avec l\'assistant.');
    } finally {
      setChatLoading(false);
      setChatInput('');
    }
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <span className="font-medium text-gray-900">Poser une question sur cette page</span>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${chatOpen ? 'rotate-90' : ''}`} />
      </button>

      {chatOpen && (
        <CardContent className="p-4 border-t border-gray-200">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askGuide()}
              placeholder="Ex: Comment calculer le forfait frais professionnels?"
              className="flex-1"
            />
            <Button
              onClick={askGuide}
              disabled={chatLoading || !chatInput.trim()}
            >
              {chatLoading ? '...' : 'Demander'}
            </Button>
          </div>
          {chatResponse && (
            <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              <Markdown>{chatResponse}</Markdown>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
