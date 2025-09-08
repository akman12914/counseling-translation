"use client";
import React, { useMemo, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

type Turn = {
  user_local: string;  // 입력 언어 원문(TH 또는 KO)
  ai_local: string;    // 동일 언어 LLM 응답
  // 선택: 의사용 한국어 로그(태국어 세션일 때만 채움)
  user_ko?: string;
  ai_ko?: string;
};

export default function InterPreter() {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const synth = useMemo(
    () => (typeof window !== "undefined" ? window.speechSynthesis : null),
    []
  );

  // 🔽 사용자가 말할(=답변받을) 언어: "th" | "ko"
  const [srcLang, setSrcLang] = useState<"th" | "ko">("th");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [logKo, setLogKo] = useState(true); // 태국어 세션에서 KO 로그 저장할지

  if (!browserSupportsSpeechRecognition) {
    return <span>이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome/Edge 권장)</span>;
  }

  const speakLocal = (text: string, lang: "th" | "ko") => {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "th" ? "th-TH" : "ko-KR";
    try { synth.cancel(); } catch {}
    synth.speak(utterance);
  };

  const start = () => {
    setErr(null);
    resetTranscript();
    SpeechRecognition.startListening({
      language: srcLang === "th" ? "th-TH" : "ko-KR",
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
      const aiRes = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: user_local, lang: srcLang }),
      });
      if (!aiRes.ok) {
        const t = await aiRes.text();
        throw new Error("LLM 응답 실패: " + t);
      }
      const { reply } = await aiRes.json(); // reply = 동일 언어 응답

      // 2) (선택) 태국어 세션이면 의사용 KO 로그 번역
      let user_ko: string | undefined;
      let ai_ko: string | undefined;
      if (logKo && srcLang === "th") {
        const [uKoRes, aKoRes] = await Promise.all([
          fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: user_local, src: "th", tgt: "ko" }),
          }),
          fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reply, src: "th", tgt: "ko" }),
          }),
        ]);
        if (!uKoRes.ok || !aKoRes.ok) throw new Error("KO 로그 번역 실패");
        const uKo = await uKoRes.json();
        const aKo = await aKoRes.json();
        user_ko = uKo.text;
        ai_ko = aKo.text;
      }

      // 3) 로그 저장(선택 필드 포함)
      const turn: Turn = { user_local, ai_local: reply, user_ko, ai_ko };
      setTurns((prev) => [...prev, turn]);
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: srcLang, ...turn }),
      }).catch(() => {});

      // 4) 동일 언어로 발성
      speakLocal(reply, srcLang);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "처리 중 오류가 발생했습니다.");
    } finally {
      resetTranscript();
      stop();
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {/* 언어 전환 & KO 로그 스위치 */}
      <div className="flex items-center gap-3 text-sm mb-1">
        <label className="flex items-center gap-1">
          <span>입력/응답 언어</span>
          <select
            value={srcLang}
            onChange={(e) => setSrcLang(e.target.value as "th" | "ko")}
            className="border rounded px-2 py-1"
          >
            <option value="th">태국어</option>
            <option value="ko">한국어</option>
          </select>
        </label>
        <label className="flex items-center gap-1 ml-4">
          <input
            type="checkbox"
            checked={logKo}
            onChange={(e) => setLogKo(e.target.checked)}
          />
          의사용 한국어 로그 저장(TH 세션)
        </label>
        <button onClick={() => speakLocal("테스트 음성입니다.", "ko")} className="ml-auto border px-2 py-1 rounded">
          🔊 KO 테스트
        </button>
        <button onClick={() => speakLocal("สวัสดีค่ะ ทดสอบเสียงค่ะ", "th")} className="border px-2 py-1 rounded">
          🔊 TH 테스트
        </button>
      </div>

      {/* 컨트롤 */}
      <div className="flex gap-2 items-center">
        <button
          onClick={start}
          disabled={isLoading}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          🎤 {listening ? "듣는 중…" : `듣기 시작(${srcLang.toUpperCase()})`}
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
        <span className="text-sm text-gray-600">STT: {transcript || "…"}</span>
      </div>

      {err && <div className="text-sm text-red-600">⚠ {err}</div>}

      {/* 대화 로그 */}
      <div className="space-y-2">
        {turns.map((t, i) => (
          <div key={i} className="border rounded p-3 bg-white">
            <div><b>👤 사용자({srcLang.toUpperCase()}):</b> {t.user_local}</div>
            {t.user_ko && <div className="text-gray-600"><b>👤 사용자(KO):</b> {t.user_ko}</div>}
            <div className="mt-2 text-blue-700"><b>🤖 봇({srcLang.toUpperCase()}):</b> {t.ai_local}</div>
            {t.ai_ko && <div className="text-gray-600"><b>🤖 봇(KO):</b> {t.ai_ko}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
