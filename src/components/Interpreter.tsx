'use client';
import { languages } from 'eslint-plugin-prettier';
import React, { useMemo, useState } from 'react';
import { set } from 'react-hook-form';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

//한 턴의 대화구조 정의
type Turn = {
  user_th: string; //환자 원문(태국어)
  user_ko: string; //환자 번역문(한국어)
  ai_th: string; //상담사 응답(태국어)
  ai_ko: string; //상담사 응답 한국어 번역(의사용)
};
export default function InterPreter() {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const synth = useMemo(() => (typeof window !== 'undefined' ? window.speechSynthesis : null), []);
  const [turns, setTurns] = useState<Turn[]>([]); //대화 기록
  const [isLoading, setIsLoading] = useState(false);

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const speakTH = (text: string) => {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    synth.speak(utterance);
  };

  const start = () =>
    SpeechRecognition.startListening({
      languages: 'th-TH',
      interimResults: false,
      continuous: false,
    });

  const stop = () => SpeechRecognition.stopListening();

  //음성->번역->답변->번역->로그->TTS
  const oneTurn = async () => {
    const user_th = transcript.trim();
    if (!user_th || isLoading) return;
    setIsLoading(true);

    try {
      // 1) 환자 발화 → 한국어 번역(의사용 로그)
      const uKo = await fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text: user_th, src: 'th', tgt: 'ko' }),
      }).then((r) => r.json());

      // 2) LLM(또는 규칙)로 태국어 응답 생성
      const aiTh = await fetch('/api/reply', {
        method: 'POST',
        body: JSON.stringify({ text_th: user_th }),
      }).then((r) => r.json());

      // 3) 봇 응답(태국어) → 한국어 번역(의사용 로그)
      const aiKo = await fetch('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text: aiTh.text_th, src: 'th', tgt: 'ko' }),
      }).then((r) => r.json());

      // 4) 한 턴의 대화 결과 저장
      const turn: Turn = {
        user_th,
        user_ko: uKo.text,
        ai_th: aiTh.text_th,
        ai_ko: aiKo.text,
      };
      setTurns((t) => [...t, turn]);

      // 5) 로그 저장(백엔드에 양쪽 언어로 보관)
      await fetch('/api/log', { method: 'POST', body: JSON.stringify(turn) });

      // 6) 태국어 TTS로 즉시 답변 재생
      speakTH(aiTh.text_th);
    } finally {
      resetTranscript(); // 음성 인식 결과 초기화
      stop(); // 음성 인식 중지
      setIsLoading(false); // 처리 완료
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {/* 음성 인식 및 전송 버튼 */}
      <div className="flex gap-2 items-center">
        <button
          onClick={start}
          disabled={isLoading}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          🎤 {listening ? '듣는 중…' : '듣기 시작(TH)'}
        </button>
        <button onClick={oneTurn} disabled={isLoading} className="px-3 py-1 rounded border">
          전송(1턴)
        </button>
        <button
          onClick={() => {
            resetTranscript();
            window.speechSynthesis?.cancel();
          }}
          className="px-3 py-1 rounded border"
        >
          초기화
        </button>
        <span className="text-sm text-gray-600">STT: {transcript || '…'}</span>
      </div>

      {/* 대화 로그 표시 */}
      <div className="space-y-2">
        {turns.map((t, i) => (
          <div key={i} className="border rounded p-3 bg-white">
            <div>
              <b>👤 환자(TH):</b> {t.user_th}
            </div>
            <div className="text-gray-600">
              <b>👤 환자(KO):</b> {t.user_ko}
            </div>
            <div className="mt-2 text-blue-700">
              <b>🤖 봇(TH):</b> {t.ai_th}
            </div>
            <div className="text-gray-600">
              <b>🤖 봇(KO):</b> {t.ai_ko}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
