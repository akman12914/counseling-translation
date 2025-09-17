'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Globe, Heart, Clock, Shield } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const InterPreter = dynamic(() => import('./Interpreter'), { ssr: false });

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'cat';
  timestamp: Date;
  originalLanguage?: string;
  translatedText?: string;
}

const specialtiesIcons = [Heart, Clock, Shield] as const;

export function MeetIntro() {
  const [clicked, setClicked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<'th' | 'ko'>('th');
  const [catExpression, setCatExpression] = useState<
    'neutral' | 'happy' | 'concerned' | 'thinking'
  >('neutral');
  const [activeTab, setActiveTab] = useState('meet');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ 간단 i18n 사전
  const dict = {
    th: {
      welcome_title: 'ยินดีต้อนรับสู่ Adv. Smart',
      welcome_desc:
        'ฉันคือที่ปรึกษา AI ที่เชี่ยวชาญด้านการให้คำปรึกษาศัลยกรรมความงามอย่างเป็นมิตร หากต้องการคำปรึกษาแบบเฉพาะบุคคล กรุณาคลิกที่หูฟังและถามคำถามได้เลย',
      lang_label: 'การรองรับหลายภาษา',
      quick_title: 'คุณพร้อมที่จะเริ่มการปรึกษาแล้วหรือยัง?',
      quick_desc:
        'หากคุณไม่แน่ใจว่าจะเริ่มถามจากตรงไหน สามารถตอบคำถามด้านล่างนี้แทนได้ AI จะให้คำปรึกษาอย่างละเอียดตามข้อมูลที่คุณกรอก',
      quick_btn1: '💃 กรุณาเลือกบริเวณที่คุณสนใจทำหัตถการ',
      quick_btn2: '📅 กรุณาบอกช่วงอายุของคุณ',
      quick_btn3: '⏰ คุณเคยทำศัลยกรรมมาก่อนหรือไม่?',
      quick_btn4: '💰 งบประมาณที่คุณคาดไว้คือเท่าไร',
      greet_message:
        "Hello! I'm Dr. Whiskers, your friendly counseling assistant. I'm here to help you with questions about plastic surgery procedures. What would you like to know about today?",
      specialties: [
        {
          title: 'ศัลยกรรมใบหน้า',
          desc: 'การจำลอง 3D ขั้นสูงและการวิเคราะห์โครงกระดูก เพื่อคำนวณสัดส่วนทองคำที่เหมาะสมของแต่ละบุคคล AI จะช่วยประเมินความเหมาะสมทางการแพทย์ของหัตถการมากกว่า 20 ประเภท เช่น การทำตาสองชั้น, ศัลยกรรมจมูก, ศัลยกรรมโครงหน้า และยังสามารถคาดการณ์ผลลัพธ์ก่อน–หลังการผ่าตัด และกระบวนการฟื้นตัวได้อย่างแม่นยำ',
        },
        {
          title: 'ศัลยกรรมรูปร่าง',
          desc: 'การวิเคราะห์ข้อมูล BMI, อัตราส่วนไขมันในร่างกาย และปริมาณมวลกล้ามเนื้ออย่างครบถ้วน เพื่อเสนอวิธีการศัลยกรรมที่เหมาะสมที่สุด เช่น ดูดไขมัน, ศัลยกรรมหน้าท้อง, ศัลยกรรมหน้าอก โดยคำนึงถึงรูปร่างและไลฟ์สไตล์ของแต่ละบุคคล พร้อมทั้งคาดการณ์ผลลัพธ์ที่สมจริง และแนะนำแนวทางลดความเสี่ยงของผลข้างเคียง',
        },
        {
          title: 'ศัลยกรรมเล็ก',
          desc: 'การเก็บข้อมูลลักษณะเฉพาะและระยะเวลาการคงอยู่ของหัตถการแบบไม่ผ่าตัด เช่น โบท็อกซ์, ฟิลเลอร์, ร้อยไหม ของแต่ละแบรนด์ AI จะออกแบบแผนการรักษาแบบเป็นขั้นตอนและกำหนดตารางการดูแลรักษาต่อเนื่อง โดยพิจารณาจากอายุ สภาพผิว และงบประมาณ',
        },
      ],
    },
    ko: {
      welcome_title: 'Adv. Smart에 오신 걸 환영합니다',
      welcome_desc:
        '친근한 AI 성형 상담사입니다. 개인 맞춤 상담을 원하시면 헤드셋을 눌러 질문해 보세요.',
      lang_label: '다국어 지원',
      quick_title: '상담을 시작할 준비가 되셨나요?',
      quick_desc:
        '무엇을 물어볼지 고민된다면 아래 질문 버튼으로 시작해 보세요. 입력하신 정보를 바탕으로 자세히 안내해 드립니다.',
      quick_btn1: '💃 관심 있는 시술 부위를 선택해 주세요',
      quick_btn2: '📅 연령대를 알려주세요',
      quick_btn3: '⏰ 성형 경험이 있으신가요?',
      quick_btn4: '💰 예상 예산은 얼마인가요?',
      greet_message:
        '안녕하세요! 저는 Dr. Whiskers, 여러분의 성형 상담 도우미입니다. 궁금한 시술이 있다면 무엇이든 물어보세요.',
      specialties: [
        {
          title: '얼굴 성형',
          desc: '고급 3D 시뮬레이션과 골격 분석으로 개인별 황금비를 계산합니다. 쌍꺼풀, 코성형, 안면윤곽 등 20+개 시술의 의학적 적합성을 평가하고 수술 전·후 결과와 회복 과정을 정밀하게 예측합니다.',
        },
        {
          title: '바디 컨투어링',
          desc: 'BMI, 체지방률, 근육량 데이터를 분석해 라이프스타일을 고려한 최적의 수술(지방흡입, 복부성형, 가슴성형 등)을 제안합니다. 현실적인 결과를 예측하고 부작용 리스크를 줄이는 가이드를 제공합니다.',
        },
        {
          title: '비수술 시술',
          desc: '보톡스·필러·실리프팅 등 브랜드별 특성과 지속 기간 데이터를 바탕으로 단계별 치료 계획과 후속 관리 일정을 설계합니다. 나이·피부 상태·예산을 종합적으로 고려합니다.',
        },
      ],
    },
  } as const;

  // 스크롤 유틸
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 초기 인사
  useEffect(() => {
    const initialMessage: Message = {
      id: '1',
      text: dict[currentLanguage].greet_message,
      sender: 'cat',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    setCatExpression('happy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 비디오 자동재생/루프 보조
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = async () => {
      try {
        await v.play();
      } catch {}
    };
    v.addEventListener('canplaythrough', tryPlay, { once: true });

    const onPause = () => {
      if (!document.hidden) v.play().catch(() => {});
    };
    const onEnded = () => {
      v.currentTime = 0.01;
      v.play().catch(() => {});
    };
    v.addEventListener('ended', onEnded);
    v.addEventListener('pause', onPause);

    const onVisible = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      v.removeEventListener('canplaythrough', tryPlay);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('pause', onPause);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* 전경: 기본 그라디언트 + 항상 마운트된 비디오(클릭 시 opacity 전환) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute inset-0 -z-10">
        <video
          ref={videoRef}
          className={`absolute inset-0 -z-10 w-full h-full object-cover transition-opacity duration-500 ${
            clicked ? 'opacity-100' : 'opacity-20'
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
        >
          <source src="/bg-listening.webm" type="video/webm" />
          <source src="/bg-listening2.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="flex-1 p-3 md:p-6 lg:p-8 max-w-4xl mx-auto w-full min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              {!clicked && (
                <div className="flex justify-center">
                  <div
                    className="bg-white rounded-full p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                    onClick={() =>
                      setCatExpression(catExpression === 'happy' ? 'neutral' : 'happy')
                    }
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
              )}

              {/* Interpreter: 현재 언어 내려줌 */}
              <div className="interpreter-container">
                <InterPreter clicked={clicked} setClicked={setClicked} lang={currentLanguage} />
              </div>

              {/* 클릭 시 추가 컴포넌트 + group 이미지 중앙 정렬 */}
              {clicked && (
                <div className="flex justify-center items-center mb-3">
                  <Image src="/group.png" alt="group" width={200} height={50} />
                </div>
              )}

              {/* 제목/설명 (i18n) */}
              <div>
                {!clicked ? (
                  <>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                      {dict[currentLanguage].welcome_title}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                      {dict[currentLanguage].welcome_desc}
                    </p>
                  </>
                ) : (
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 text-white">
                    Smart
                  </h1>
                )}
              </div>
            </div>

            {/* ✅ 클릭했을 때만 보이는 다이브박스 */}
            {clicked && (
              <div
                className="mx-auto w-[119px] h-[30px] flex items-center justify-center 
                 bg-gray-100 text-xs font-medium rounded-md shadow-sm"
              >
                {currentLanguage === 'ko' ? '의사용 로그 생성' : 'สร้างบันทึกแพทย์'}
              </div>
            )}

            {/* Language Selector 카드 (타이틀 i18n) */}
            {!clicked && (
              <Card className="max-w-md mx-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-blue-600" />
                    {dict[currentLanguage].lang_label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={currentLanguage}
                    onValueChange={(v) => setCurrentLanguage(v as 'th' | 'ko')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="th">ไทย</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2 pb-4">
                    {currentLanguage === 'ko'
                      ? '다국어를 지원합니다. (태국어/한국어)'
                      : 'รองรับหลายภาษา รวมถึงภาษาไทย'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Specialties (i18n) */}
            <div className="grid md:grid-cols-3 gap-4">
              {specialtiesIcons.map((Icon, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="text-blue-600 mx-auto mb-3 h-12 w-12" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {dict[currentLanguage].specialties[index].title}
                    </h3>
                    <p className="text-sm text-gray-600 overflow-hidden text-ellipsis line-clamp-2 mb-2">
                      {dict[currentLanguage].specialties[index].desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Start (i18n) */}
            {!clicked && (
              <Card className="bg-blue-50 border-blue-200 mb-5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    {dict[currentLanguage].quick_title}
                  </h3>
                  <p className="text-blue-800 mb-4">{dict[currentLanguage].quick_desc}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText(
                          currentLanguage === 'ko'
                            ? '코 성형 상담을 원해요'
                            : 'สอบถามเกี่ยวกับการเสริมจมูก'
                        );
                      }}
                    >
                      {dict[currentLanguage].quick_btn1}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText(
                          currentLanguage === 'ko' ? '연령대는 20대예요' : 'ค่าใช้จ่ายมีอะไรบ้าง'
                        );
                      }}
                    >
                      {dict[currentLanguage].quick_btn2}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText(
                          currentLanguage === 'ko'
                            ? '성형 경험은 없어요'
                            : 'ระยะเวลาฟื้นตัวนานเท่าไหร่'
                        );
                      }}
                    >
                      {dict[currentLanguage].quick_btn3}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => {
                        setActiveTab('chat');
                        setInputText(
                          currentLanguage === 'ko' ? '예산은 300만원 정도예요' : 'ต้องการนัดปรึกษา'
                        );
                      }}
                    >
                      {dict[currentLanguage].quick_btn4}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ 하단 미니 셀렉터: 반투명 검정 배경, 테두리 없음, 흰 글자, 둥글게 (clicked=true일 때만) */}
            
          </div>
          {clicked && (
              <div className="flex justify-center">
                <Select
                  value={currentLanguage}
                  onValueChange={(v) => setCurrentLanguage(v as 'th' | 'ko')}
                >
                  <SelectTrigger variant="white" className="h-7 mt-3 px-3 text-xs w-[80px] rounded-b-sm bg-black/20 text-white border-0 focus:ring-0">
                    <SelectValue placeholder="Lang" />
                  </SelectTrigger>
                  <SelectContent className="text-xs bg-black/80 text-white">
                    <SelectItem value="th">ภาษาไทย</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
