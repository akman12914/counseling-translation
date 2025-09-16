'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { SpottedCat } from './SpottedCat';
import { Send, Globe, MessageCircle, Heart, Clock, Shield } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
// 기존: import InterPreter from './Interpreter';
const InterPreter = dynamic(() => import('./Interpreter'), { ssr: false });

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
  { code: 'th', name: 'ภาษาไทย' },
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

const specialties = [
  {
    icon: Heart,
    title: 'Breast Surgery',
    description: 'Augmentation, reduction, and reconstruction procedures',
  },
  {
    icon: Clock,
    title: 'Facial Procedures',
    description: 'Rhinoplasty, facelifts, and facial rejuvenation',
  },
  {
    icon: Shield,
    title: 'Body Contouring',
    description: 'Liposuction, tummy tucks, and body sculpting',
  },
];

export function TabbedChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('th');
  const [catExpression, setCatExpression] = useState<
    'neutral' | 'happy' | 'concerned' | 'thinking'
  >('neutral');
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setCatExpression('thinking');

    try {
      const lang = currentLanguage === 'ko' ? 'ko' : 'th';
      const r = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg.text, lang }),
      });
      const { reply } = await r.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'cat',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: '⚠️ 서버 응답 오류. 잠시 후 다시 시도해주세요.',
          sender: 'cat',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setCatExpression('neutral');
      if (activeTab !== 'chat') setHasNewMessage(true);
    }
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
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'chat') {
      setHasNewMessage(false);
    }
  };

  const getPlaceholderText = () => {
    const placeholders: Record<string, string> = {
      en: 'Ask Dr. Whiskers anything...',
      es: 'Pregúntale cualquier cosa a Dr. Whiskers...',
      fr: "Demandez n'importe quoi au Dr. Whiskers...",
      de: 'Fragen Sie Dr. Whiskers alles...',
      ja: 'Dr. Whiskers に何でも聞いてください...',
      ko: 'Dr. Whiskers에게 무엇이든 물어보세요...',
    };
    return placeholders[currentLanguage] || placeholders.en;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      <div className="flex-1 p-3 md:p-6 lg:p-8 max-w-4xl mx-auto w-full min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className="bg-white rounded-full p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => setCatExpression(catExpression === 'happy' ? 'neutral' : 'happy')}
                >
                  <Image
                    src="/little-kid-wearing-doctor-costume-play.png"
                    alt="Dr. Whiskers"
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                </div>
              </div>
              <div className="interpreter-container">
                <InterPreter />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                  ยินดีต้อนรับสู่ Adv. Smart
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  ฉันคือที่ปรึกษา AI ที่เชี่ยวชาญด้านการให้คำปรึกษาศัลยกรรมความงามอย่างเป็นมิตร
                  หากต้องการคำปรึกษาแบบเฉพาะบุคคล กรุณาคลิกที่หูฟังและถามคำถามได้เลย
                </p>
              </div>
            </div>

            {/* Language Selector */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                  การรองรับหลายภาษา
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
                <p className="text-sm text-gray-500 mt-2 pb-4">รองรับหลายภาษา รวมถึงภาษาไทย</p>
              </CardContent>
            </Card>

            {/* Specialties */}
            <div className="grid md:grid-cols-3 gap-4">
              {specialties.map((specialty, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 ">
                    <specialty.icon className="text-blue-600 mx-auto mb-3 h-12 w-12" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {specialty.icon === Heart
                        ? 'ศัลยกรรมใบหน้า'
                        : specialty.icon === Clock
                          ? 'ศัลยกรรมรูปร่าง'
                          : 'ศัลยกรรมเล็ก'}
                    </h3>
                    <p className="text-sm text-gray-600 overflow-hidden text-ellipsis line-clamp-2 mb-2">
                      {specialty.icon === Heart ? (
                        <span>
                          การจำลอง 3D <br />
                          ขั้นสูงและการวิเคราะห์โครงกระดูก
                          เพื่อคำนวณสัดส่วนทองคำที่เหมาะสมของแต่ละบุคคล AI
                          จะช่วยประเมินความเหมาะสมทางการแพทย์ของหัตถการมากกว่า 20 ประเภท เช่น
                          การทำตาสองชั้น, ศัลยกรรมจมูก, ศัลยกรรมโครงหน้า
                          และยังสามารถคาดการณ์ผลลัพธ์ก่อน–หลังการผ่าตัด
                          และกระบวนการฟื้นตัวได้อย่างแม่นยำ
                        </span>
                      ) : specialty.icon === Clock ? (
                        <span>
                          การวิเคราะห์ข้อมูล BMI, <br />
                          อัตราส่วนไขมันในร่างกาย และปริมาณมวลกล้ามเนื้ออย่างครบถ้วน
                          เพื่อเสนอวิธีการศัลยกรรมที่เหมาะสมที่สุด เช่น ดูดไขมัน, ศัลยกรรมหน้าท้อง,
                          ศัลยกรรมหน้าอก โดยคำนึงถึงรูปร่างและไลฟ์สไตล์ของแต่ละบุคคล
                          พร้อมทั้งคาดการณ์ผลลัพธ์ที่สมจริง และแนะนำแนวทางลดความเสี่ยงของผลข้างเคียง
                        </span>
                      ) : (
                        <span>
                          การเก็บข้อมูลลักษณะเฉพาะและระยะเวลาการคงอยู่ของหัตถการแบบไม่ผ่าตัด เช่น
                          โบท็อกซ์, ฟิลเลอร์, ร้อยไหม ของแต่ละแบรนด์ AI
                          จะออกแบบแผนการรักษาแบบเป็นขั้นตอนและกำหนดตารางการดูแลรักษาต่อเนื่อง
                          โดยพิจารณาจากอายุ สภาพผิว และงบประมาณ
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Start */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-3">
                  คุณพร้อมที่จะเริ่มการปรึกษาแล้วหรือยัง?
                </h3>
                <p className="text-blue-800 mb-4">
                  หากคุณไม่แน่ใจว่าจะเริ่มถามจากตรงไหน สามารถตอบคำถามด้านล่างนี้แทนได้ AI
                  จะให้คำปรึกษาอย่างละเอียดตามข้อมูลที่คุณกรอก
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      setActiveTab('chat');
                      setInputText('สอบถามเกี่ยวกับการเสริมจมูก');
                    }}
                  >
                    💃 กรุณาเลือกบริเวณที่คุณสนใจทำหัตถการ
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      setActiveTab('chat');
                      setInputText('ค่าใช้จ่ายมีอะไรบ้าง');
                    }}
                  >
                    📅 กรุณาบอกช่วงอายุของคุณ
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      setActiveTab('chat');
                      setInputText('ระยะเวลาฟื้นตัวนานเท่าไหร่');
                    }}
                  >
                    ⏰ คุณเคยทำศัลยกรรมมาก่อนหรือไม่?
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      setActiveTab('chat');
                      setInputText('ต้องการนัดปรึกษา');
                    }}
                  >
                    💰 งบประมาณที่คุณคาดไว้คือเท่าไร
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
