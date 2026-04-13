import { X, Send, Paperclip, Mic, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'therapist';
  timestamp: Date;
};

type ChatWindowProps = {
  therapist: {
    id: number;
    name: string;
    image: string;
    specialty: string;
  };
  onClose: () => void;
};

export function ChatWindow({ therapist, onClose }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      text: `Hello! I'm ${therapist.name}, your speech therapist. How can I help you today?`,
      sender: 'therapist',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
  ]);
  
  // Track the last used response index to avoid repeats
  const lastResponseIndex = useRef(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    // Simulate therapist response after a delay
    setTimeout(() => {
      const responses = [
        // General responses
        "I understand your concern. Let's work on that together.",
        "That's a great question! I'd be happy to help with that.",
        "I recommend we focus on that in our next session.",
        "You're making great progress with your exercises!",
        "Let me know if you have any questions about your practice.",
        "I appreciate you sharing that with me.",
        "That's an interesting point. Let's explore that further.",
        "I can see why you'd feel that way.",
        "Let's break that down together.",
        "That's a common challenge many of my clients face.",
        "I'm here to support you through this.",
        "That's a great observation.",
        "Let's think about some strategies for that.",
        "I'm glad you brought that up.",
        "That's an important aspect to consider."
      ];
      
      // Get a random response that's different from the last one
      let responseIndex;
      do {
        responseIndex = Math.floor(Math.random() * responses.length);
      } while (responseIndex === lastResponseIndex.current && responses.length > 1);
      
      lastResponseIndex.current = responseIndex;
      
      // Add some contextual awareness
      let responseText = responses[responseIndex];
      const userMessageLower = message.toLowerCase();
      
      if (userMessageLower.includes('thank') || userMessageLower.includes('thanks')) {
        responseText = "You're welcome! I'm here to help.";
      } else if (userMessageLower.includes('hi') || userMessageLower.includes('hello')) {
        responseText = `Hello! How can I help you today?`;
      } else if (userMessageLower.includes('help')) {
        responseText = "I'm here to help you with your speech therapy journey. What specific area would you like to focus on?";
      } else if (userMessageLower.includes('exercise') || userMessageLower.includes('practice')) {
        responseText = "I recommend practicing for 10-15 minutes daily. Would you like some exercise suggestions?";
      }
      
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'therapist',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 dark:bg-primary/20 p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={therapist.image} alt={therapist.name} />
            <AvatarFallback>{therapist.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{therapist.name}</h3>
            <p className="text-xs text-muted-foreground">{therapist.specialty}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs opacity-70 text-right mt-1">
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" size="sm" className="h-8">
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
