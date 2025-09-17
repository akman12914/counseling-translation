'use client';

import React, { useMemo, useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Image from 'next/image';

type Turn = {
  user_local: string;   // 입력 언어 원문(TH 또는 KO)
  ai_local: string;     // 동일 언어 LLM 응답
  user_ko?: string;     // TH 세션일 때 의사용 한국어 로그
  ai_ko?: string;
};

interface InterpreterProps {
  clicked: boolean;
  setClicked: (val: boolean) => void;
  lang: 'th' | 'ko'; // 상위 MeetIntro에서 내려주는 현재 언어
}

export default function InterPreter({ clicked, setClicked, lang }: InterpreterProps) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const synth = useMemo(
    () => (typeof window !== 'undefined' ? window.speechSynthesis : null),
    []
  );

  const [srcLang, setSrcLang] = useState<'th' | 'ko'>(lang);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [logKo, setLogKo] = useState(true); // 태국어 세션에서 KO 로그 저장할지

  useEffect(() => {
    setSrcLang(lang);
  }, [lang]);

  if (!browserSupportsSpeechRecognition) {
    return <span>이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome/Edge 권장)</span>;
  }

  const speakLocal = (text: string, lang: 'th' | 'ko') => {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'th' ? 'th-TH' : 'ko-KR';
    try { synth.cancel(); } catch {}
    synth.speak(utterance);
  };

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

  // 음성 -> (동일 언어) LLM 응답 -> (선택) KO로그 번역 -> 저장 -> (동일 언어) TTS
  const oneTurn = async () => {
    const user_local = transcript.trim();
    if (!user_local || isLoading) return;
    setIsLoading(true);
    setErr(null);

    try {
      // 1) LLM: 입력 언어로만 답하도록 서버에서 보장(/api/llm)
      const aiRes = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: user_local, lang: srcLang }),
      });
      if (!aiRes.ok) {
        const t = await aiRes.text();
        throw new Error('LLM 응답 실패: ' + t);
      }
      const { reply } = await aiRes.json(); // reply = 동일 언어 응답

      // 2) (선택) 태국어 세션이면 의사용 KO 로그 번역
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
        if (!uKoRes.ok || !aKoRes.ok) throw new Error('KO 로그 번역 실패');
        const uKo = await uKoRes.json();
        const aKo = await aKoRes.json();
        user_ko = uKo.text;
        ai_ko = aKo.text;
      }

      // 3) 로그 저장(선택 필드 포함)
      const turn: Turn = { user_local, ai_local: reply, user_ko, ai_ko };
      setTurns((prev) => [...prev, turn]);
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: srcLang, ...turn }),
      }).catch(() => {});

      // 4) 동일 언어로 발성
      speakLocal(reply, srcLang);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || '처리 중 오류가 발생했습니다.');
    } finally {
      resetTranscript();
      stop();
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {/* 컨트롤 (가운데 정렬) */}
      <div className="flex flex-col items-center gap-4">
        {/* 듣기 버튼: 한 번 누르면 clicked=true 유지 */}
        <button
          onClick={() => { if (!clicked) setClicked(true); start(); }}
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
 {/* ✅ 전송 버튼: clicked=true일 때만 노출되는 원형 버튼 */}
  {clicked && (
    <button
      onClick={oneTurn}
      disabled={isLoading}
      aria-label="전송"
      title="전송"
      className="flex items-center justify-center w-2 h-2 rounded-full bg-white shadow-md hover:shadow-lg transition cursor-pointer"
    >

    </button>
  )}

      </div>

      {/* 상태/오류 */}
      {err && <div className="text-sm text-red-600 text-center">⚠ {err}</div>}
      {/* 필요하면 아래 디버그 정보 노출
      <div className="text-center text-xs text-gray-600">STT: {transcript || '…'} {listening?'(listening)':''}</div>
      */}
    </div>
  );
}
