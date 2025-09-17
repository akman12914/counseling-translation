'use client';

import React, { useMemo, useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Image from 'next/image';
import { matchCategory, getRandomFromCategory } from './qaMap';
import { runDemoScenario } from './demo';

type Turn = {
  user_local: string;
  ai_local: string;
  user_ko?: string; // 태국어 세션일 경우 의사용 한국어 로그
  ai_ko?: string;
};

interface InterpreterProps {
  clicked: boolean;
  setClicked: (val: boolean) => void;
  lang: 'th' | 'ko';
}

export default function InterPreter({ clicked, setClicked, lang }: InterpreterProps) {
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [srcLang, setSrcLang] = useState<'th' | 'ko'>(lang);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [logKo, setLogKo] = useState(true);

  useEffect(() => {
    setSrcLang(lang);
  }, [lang]);

  if (!browserSupportsSpeechRecognition) {
    return <span>이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome/Edge 권장)</span>;
  }

  // ✅ ElevenLabs Alice TTS
  // async function speakWithAlice(text: string) {
  //   try {
  //     const res = await fetch('/api/tts', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         text,
  //         voice: 'Alice',
  //         model_id: 'eleven_multilingual_v2',
  //       }),
  //     });
  //     if (!res.ok) throw new Error('ElevenLabs 요청 실패');
  //     const arrayBuffer = await res.arrayBuffer();
  //     const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  //     const url = URL.createObjectURL(blob);
  //     const audio = new Audio(url);
  //     await audio.play();
  //   } catch (e) {
  //     console.error('Alice TTS 실패:', e);
  //     if (typeof window !== 'undefined') {
  //       const utter = new SpeechSynthesisUtterance(text);
  //       utter.lang = srcLang === 'th' ? 'th-TH' : 'ko-KR';
  //       window.speechSynthesis.speak(utter);
  //     }
  //   }
  // }

  // Interpreter.tsx (발췌)
  async function speakCounselor(text: string, lang: 'ko' | 'th') {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, role: 'counselor' }), // ✅ 역할 명시
    });
    if (!res.ok) throw new Error(await res.text());
    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    await audio.play();
  }

  const start = () => {
    setErr(null);
    resetTranscript();
    SpeechRecognition.startListening({
      language: srcLang === 'th' ? 'th-TH' : 'ko-KR',
      interimResults: false,
      continuous: false,
    });
  };

  const stop = () => SpeechRecognition.stopListening();

  // 🎤 한 턴: QA 우선 → 없으면 LLM → (TH면) KO로그 → TTS
  const oneTurn = async () => {
    const user_local = transcript.trim();
    if (!user_local || isLoading) return;
    setIsLoading(true);
    setErr(null);

    try {
      let reply: string | null = null;

      // 1) QA 매칭
      const cat = matchCategory(user_local);
      if (cat) reply = getRandomFromCategory(cat);

      // 2) 없으면 LLM 호출
      if (!reply) {
        const aiRes = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: user_local, lang: srcLang }),
        });
        if (!aiRes.ok) throw new Error('LLM 응답 실패');
        const { reply: llmReply } = await aiRes.json();
        reply = llmReply;
      }

      // 3) 태국어 세션이면 → 한국어 로그 번역
      let user_ko: string | undefined;
      let ai_ko: string | undefined;
      if (logKo && srcLang === 'th') {
        const [uKoRes, aKoRes] = await Promise.all([
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: user_local, src: 'th', tgt: 'ko' }),
          }),
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: reply, src: 'th', tgt: 'ko' }),
          }),
        ]);
        if (uKoRes.ok && aKoRes.ok) {
          const uKo = await uKoRes.json();
          const aKo = await aKoRes.json();
          user_ko = uKo.text;
          ai_ko = aKo.text;
        }
      }

      // 4) 로그 저장 (태국어일 경우 user_ko/ai_ko도 함께 저장)
      const turn: Turn = { user_local, ai_local: reply, user_ko, ai_ko };
      setTurns((prev) => [...prev, turn]);
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: srcLang, ...turn }),
      }).catch(() => {});

      // 5) Alice TTS 발성
      await speakCounselor(reply, srcLang);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || '처리 중 오류');
    } finally {
      resetTranscript();
      stop();
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <div className="flex flex-col items-center gap-4">
        {/* 듣기 버튼 */}
        <button
          onClick={() => {
            if (!clicked) setClicked(true);
            start();
          }}
          disabled={isLoading}
          className={`cursor-pointer ${clicked ? 'pt-96' : 'pt-0'}`}
          aria-label="듣기 시작"
        >
          <Image
            alt={clicked ? 'mic' : 'headset'}
            src={clicked ? '/mic.png' : '/headset.png'}
            width={60}
            height={60}
          />
        </button>

        {/* 전송 버튼 */}
        {clicked && (
          <button
            onClick={oneTurn}
            disabled={isLoading}
            aria-label="전송"
            title="전송"
            className="flex items-center justify-center w-2 h-2 rounded-full bg-white shadow-md hover:shadow-lg transition cursor-pointer"
          ></button>
        )}
      </div>

      {/* 데모 시나리오 버튼 (user + 상담사 모두 TTS) */}
      <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 flex gap-2 z-50">
        <button
          onClick={() => runDemoScenario('눈수술', srcLang)}
          className="px-3 py-2 rounded bg-blue-500 text-white"
        >
          눈수술 데모
        </button>
        <button
          onClick={() => runDemoScenario('코수술', srcLang)}
          className="px-3 py-2 rounded bg-green-600 text-white"
        >
          코수술 데모
        </button>
        <button
          onClick={() => runDemoScenario('안면윤곽', srcLang)}
          className="px-3 py-2 rounded bg-purple-600 text-white"
        >
          안면윤곽 데모
        </button>
      </div>

      {err && <div className="text-sm text-red-600 text-center">⚠ {err}</div>}
    </div>
  );
}
