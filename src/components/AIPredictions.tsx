import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Brain, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

const sendMessage = async (message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke<{ answer: string }>('get-bitcoin-prediction', {
      body: { message }
    });
    
    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('No response received from chat service');
    }
    
    return data.answer;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to get a response. Please try again.');
    throw error;
  }
};

const AIPredictions = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    try {
      const response = await sendMessage(newMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Crypto Assistant</h2>
        </div>
      </div>

      <div className="flex flex-col space-y-4 h-[400px] overflow-y-auto mb-4 p-4 rounded-lg bg-background/50">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Ask me anything about cryptocurrencies, market trends, or price predictions!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about crypto prices, trends, or general information..."
          className="flex-1"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={isTyping || !newMessage.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIPredictions;