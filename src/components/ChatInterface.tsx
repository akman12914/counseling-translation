import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { SpottedCat } from './SpottedCat';
import { Send, Globe } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'cat';
  timestamp: Date;
  originalLanguage?: string;
  translatedText?: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

const demoResponses = [
  {
    trigger: ['hello', 'hi', 'hey'],
    response:
      "Hello! I'm Dr. Whiskers, your friendly counseling assistant. I'm here to help you with questions about plastic surgery procedures. What would you like to know about today?",
  },
  {
    trigger: ['rhinoplasty', 'nose job', 'nose surgery'],
    response:
      'Rhinoplasty is a surgical procedure to reshape the nose. It can address both cosmetic concerns and functional issues. The recovery typically takes 1-2 weeks for initial healing, with final results visible after several months. Would you like to know about the procedure details or recovery process?',
  },
  {
    trigger: ['breast', 'augmentation', 'breast surgery'],
    response:
      'Breast augmentation is one of the most common cosmetic procedures. We offer various implant types and sizes to achieve your desired results. The procedure typically takes 1-2 hours, and recovery involves 1-2 weeks of limited activity. What specific aspects would you like to discuss?',
  },
  {
    trigger: ['cost', 'price', 'how much'],
    response:
      'Costs vary depending on the specific procedure and individual needs. During a consultation, we can provide detailed pricing information. Many procedures are available with financing options. Would you like to schedule a consultation to discuss pricing for a specific procedure?',
  },
  {
    trigger: ['recovery', 'healing', 'downtime'],
    response:
      'Recovery times vary by procedure. Generally, most patients can return to work within 1-2 weeks, with full recovery taking several weeks to months. We provide detailed aftercare instructions and follow-up appointments to ensure optimal healing. What procedure are you considering?',
  },
  {
    trigger: ['consultation', 'appointment', 'schedule'],
    response:
      "I'd be happy to help you schedule a consultation! During your visit, our surgeon will assess your needs, discuss options, and create a personalized treatment plan. Consultations typically take 30-45 minutes. Would you prefer a morning or afternoon appointment?",
  },
];

// Mock translation function
const translateText = (text: string, targetLanguage: string): string => {
  const translations: Record<string, Record<string, string>> = {
    es: {
      "Hello! I'm Dr. Whiskers, your friendly counseling assistant.":
        '¡Hola! Soy Dr. Whiskers, tu asistente de consejería amigable.',
      'What would you like to know about today?': '¿Qué te gustaría saber hoy?',
      'Type your message...': 'Escribe tu mensaje...',
    },
    fr: {
      "Hello! I'm Dr. Whiskers, your friendly counseling assistant.":
        'Bonjour! Je suis Dr. Whiskers, votre assistant de conseil amical.',
      'What would you like to know about today?': "Que souhaitez-vous savoir aujourd'hui?",
      'Type your message...': 'Tapez votre message...',
    },
    de: {
      "Hello! I'm Dr. Whiskers, your friendly counseling assistant.":
        'Hallo! Ich bin Dr. Whiskers, Ihr freundlicher Beratungsassistent.',
      'What would you like to know about today?': 'Was möchten Sie heute wissen?',
      'Type your message...': 'Geben Sie Ihre Nachricht ein...',
    },
  };

  return translations[targetLanguage]?.[text] || text;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [catExpression, setCatExpression] = useState<
    'neutral' | 'happy' | 'concerned' | 'thinking'
  >('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    const initialMessage: Message = {
      id: '1',
      text: "Hello! I'm Dr. Whiskers, your friendly counseling assistant. I'm here to help you with questions about plastic surgery procedures. What would you like to know about today?",
      sender: 'cat',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    setCatExpression('happy');
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setCatExpression('thinking');

    // Generate response
    setTimeout(() => {
      const response = generateResponse(inputText.toLowerCase());
      const catMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'cat',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, catMessage]);
      setCatExpression('neutral');
    }, 1000);
  };

  const generateResponse = (input: string): string => {
    for (const demo of demoResponses) {
      if (demo.trigger.some((trigger) => input.includes(trigger))) {
        return demo.response;
      }
    }

    return "That's an interesting question! Plastic surgery is a personal decision that requires careful consideration. I'd recommend scheduling a consultation where our experienced surgeons can provide personalized advice based on your specific needs and goals. Is there a particular procedure you're curious about?";
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    // In a real app, this would translate all existing messages
  };

  const getPlaceholderText = () => {
    const placeholders: Record<string, string> = {
      en: 'Type your message...',
      es: 'Escribe tu mensaje...',
      fr: 'Tapez votre message...',
      de: 'Geben Sie Ihre Nachricht ein...',
      ja: 'メッセージを入力...',
      ko: '메시지를 입력하세요...',
    };
    return placeholders[currentLanguage] || placeholders.en;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Cat Character Panel */}
      <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-6 flex flex-col items-center">
        <div className="mb-6">
          <SpottedCat expression={catExpression} size={160} />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Dr. Whiskers</h2>
          <p className="text-sm text-gray-600">Plastic Surgery Counselor</p>
        </div>

        <Card className="p-4 w-full">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Language</span>
          </div>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Demo Mode Active</p>
          <p>Try asking about:</p>
          <ul className="mt-2 space-y-1">
            <li>• Rhinoplasty</li>
            <li>• Breast augmentation</li>
            <li>• Recovery time</li>
            <li>• Consultation</li>
          </ul>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
          <h1 className="text-2xl font-semibold text-gray-800">Plastic Surgery Consultation</h1>
          <p className="text-sm text-gray-600">Chat with Dr. Whiskers for personalized guidance</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white shadow-md text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <span
                  className={`text-xs mt-2 block ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={getPlaceholderText()}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
