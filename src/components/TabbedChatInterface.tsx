'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { SpottedCat } from './SpottedCat';
import { Send, Globe, MessageCircle, Heart, Clock, Shield } from 'lucide-react';

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
    response: "Hello! I'm Dr. Whiskers, your friendly counseling assistant. I'm here to help you with questions about plastic surgery procedures. What would you like to know about today?"
  },
  {
    trigger: ['rhinoplasty', 'nose job', 'nose surgery'],
    response: "Rhinoplasty is a surgical procedure to reshape the nose. It can address both cosmetic concerns and functional issues. The recovery typically takes 1-2 weeks for initial healing, with final results visible after several months. Would you like to know about the procedure details or recovery process?"
  },
  {
    trigger: ['breast', 'augmentation', 'breast surgery'],
    response: "Breast augmentation is one of the most common cosmetic procedures. We offer various implant types and sizes to achieve your desired results. The procedure typically takes 1-2 hours, and recovery involves 1-2 weeks of limited activity. What specific aspects would you like to discuss?"
  },
  {
    trigger: ['cost', 'price', 'how much'],
    response: "Costs vary depending on the specific procedure and individual needs. During a consultation, we can provide detailed pricing information. Many procedures are available with financing options. Would you like to schedule a consultation to discuss pricing for a specific procedure?"
  },
  {
    trigger: ['recovery', 'healing', 'downtime'],
    response: "Recovery times vary by procedure. Generally, most patients can return to work within 1-2 weeks, with full recovery taking several weeks to months. We provide detailed aftercare instructions and follow-up appointments to ensure optimal healing. What procedure are you considering?"
  },
  {
    trigger: ['consultation', 'appointment', 'schedule'],
    response: "I'd be happy to help you schedule a consultation! During your visit, our surgeon will assess your needs, discuss options, and create a personalized treatment plan. Consultations typically take 30-45 minutes. Would you prefer a morning or afternoon appointment?"
  }
];

const specialties = [
  { icon: Heart, title: 'Breast Surgery', description: 'Augmentation, reduction, and reconstruction procedures' },
  { icon: Clock, title: 'Facial Procedures', description: 'Rhinoplasty, facelifts, and facial rejuvenation' },
  { icon: Shield, title: 'Body Contouring', description: 'Liposuction, tummy tucks, and body sculpting' },
];

export function TabbedChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [catExpression, setCatExpression] = useState<'neutral' | 'happy' | 'concerned' | 'thinking'>('neutral');
  const [activeTab, setActiveTab] = useState('meet');
  const [hasNewMessage, setHasNewMessage] = useState(false);
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

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setCatExpression('thinking');

    // Show notification if user is not on chat tab
    if (activeTab !== 'chat') {
      setHasNewMessage(true);
    }

    // Generate response
    setTimeout(() => {
      const response = generateResponse(inputText.toLowerCase());
      const catMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'cat',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, catMessage]);
      setCatExpression('neutral');
      
      // Show notification if user is not on chat tab
      if (activeTab !== 'chat') {
        setHasNewMessage(true);
      }
    }, 1000);
  };

  const generateResponse = (input: string): string => {
    for (const demo of demoResponses) {
      if (demo.trigger.some(trigger => input.includes(trigger))) {
        return demo.response;
      }
    }
    
    return "That's an interesting question! Plastic surgery is a personal decision that requires careful consideration. I'd recommend scheduling a consultation where our experienced surgeons can provide personalized advice based on your specific needs and goals. Is there a particular procedure you're curious about?";
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'chat') {
      setHasNewMessage(false);
    }
  };

  const getPlaceholderText = () => {
    const placeholders: Record<string, string> = {
      en: "Ask Dr. Whiskers anything...",
      es: "Pregúntale cualquier cosa a Dr. Whiskers...",
      fr: "Demandez n'importe quoi au Dr. Whiskers...",
      de: "Fragen Sie Dr. Whiskers alles...",
      ja: "Dr. Whiskers に何でも聞いてください...",
      ko: "Dr. Whiskers에게 무엇이든 물어보세요...",
    };
    return placeholders[currentLanguage] || placeholders.en;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      <div className="flex-1 p-3 md:p-6 lg:p-8 max-w-4xl mx-auto w-full min-h-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-12 md:h-10">
            <TabsTrigger value="meet" className="flex items-center gap-2 text-sm md:text-base">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Meet Dr. Whiskers</span>
              <span className="sm:hidden">Meet</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2 relative text-sm md:text-base">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
              {hasNewMessage && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meet" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-white rounded-full p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                       onClick={() => setCatExpression(catExpression === 'happy' ? 'neutral' : 'happy')}>
                    <SpottedCat expression="happy" size={160} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                    Meet Dr. Whiskers
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Your friendly AI counseling assistant specializing in plastic surgery consultations. 
                    I'm here to provide personalized guidance and answer all your questions.
                  </p>
                  <div className="mt-4">
                    <Badge variant="secondary" className="px-4 py-2">
                      Available 24/7
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Language Selector */}
              <Card className="max-w-md mx-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Language Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                  <p className="text-sm text-gray-500 mt-2">
                    I can communicate with you in multiple languages
                  </p>
                </CardContent>
              </Card>

              {/* Specialties */}
              <div className="grid md:grid-cols-3 gap-4">
                {specialties.map((specialty, index) => (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <specialty.icon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-2">{specialty.title}</h3>
                      <p className="text-sm text-gray-600">{specialty.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Start */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 mb-3">Ready to start your consultation?</h3>
                  <p className="text-blue-800 mb-4">
                    Switch to the Chat tab to begin your conversation with Dr. Whiskers. 
                    I'm here to help with questions about procedures, recovery, costs, and scheduling.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText('Tell me about rhinoplasty');
                      }}
                    >
                      💃 Ask about rhinoplasty
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText('What are the costs involved?');
                      }}
                    >
                      💰 Ask about costs
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText('How long is recovery?');
                      }}
                    >
                      ⏰ Ask about recovery
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText('I want to schedule a consultation');
                      }}
                    >
                      📅 Schedule consultation
                    </Button>
                  </div>
                  
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Or ask me anything about:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Specific procedures and techniques</li>
                      <li>Recovery times and post-op care</li>
                      <li>Consultation scheduling and pricing</li>
                      <li>Before and after expectations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center gap-3 mb-4 p-4 bg-white rounded-lg shadow-sm border">
              <SpottedCat expression={catExpression} size={48} />
              <div>
                <h3 className="font-semibold text-gray-900">Dr. Whiskers</h3>
                <p className="text-sm text-gray-600">Plastic Surgery Counselor</p>
              </div>
              <Badge variant="secondary" className="ml-auto">Online</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white shadow-sm text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <span className={`text-xs mt-2 block opacity-70`}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-3 pb-safe">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={getPlaceholderText()}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 h-12 text-base"
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                className="shrink-0 h-12 w-12 rounded-xl"
                disabled={!inputText.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}