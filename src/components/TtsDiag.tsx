"use client";
import { useEffect, useMemo, useState } from "react";

export default function TtsDiag() {
  const synth = useMemo(() => (typeof window !== "undefined" ? window.speechSynthesis : null), []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // 보이스 로드 (크롬은 비동기로 늦게 옴)
  useEffect(() => {
    if (!synth) return;
    const load = () => {
      const v = synth.getVoices();
      if (v.length) {
        setVoices(v);
        setReady(true);
        setLog((L) => [...L, `voices loaded: ${v.length}`]);
      }
    };
    load();
    synth.onvoiceschanged = load;
    return () => { if (synth) (synth.onvoiceschanged as any) = null; };
  }, [synth]);

  const speak = (text: string, lang: string) => {
    if (!synth) { alert("speechSynthesis not available"); return; }
    if (!voices.length) { setLog((L)=>[...L,"no voices yet—retrying…"]); setTimeout(()=>speak(text,lang), 300); return; }

    // 가능한 언어 보이스 찾아 지정(없으면 언어만 세팅)
    const voice = voices.find(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;  // "th-TH" | "ko-KR" | "en-US"
    if (voice) u.voice = voice;
    u.rate = 1; u.pitch = 1; u.volume = 1;

    u.onstart = () => setLog(L => [...L, `▶ start (${lang}) voice=${voice?.name ?? "auto"}`]);
    u.onend   = () => setLog(L => [...L, `■ end (${lang})`]);
    u.onerror = (e) => setLog(L => [...L, `!! error: ${JSON.stringify(e)}`]);

    try { synth.cancel(); } catch {}
    synth.speak(u);
  };

  return (
    <div style={{padding:12,maxWidth:560}}>
      <h3>🔊 TTS 진단</h3>
      <div style={{display:"flex", gap:8, flexWrap:"wrap", margin:"8px 0"}}>
        <button onClick={()=>speak("This is a test in English.", "en-US")}>EN 테스트</button>
        <button onClick={()=>speak("안녕하세요. 한국어 테스트입니다.", "ko-KR")}>KO 테스트</button>
        <button onClick={()=>speak("สวัสดีค่ะ ทดสอบเสียงภาษาไทยค่ะ", "th-TH")}>TH 테스트</button>
      </div>

      <div style={{fontSize:12, color:"#555"}}>
        {synth ? (ready ? `✅ voices: ${voices.length}` : "…보이스 로딩 중") : "❌ speechSynthesis 없음"}
      </div>

      <details style={{marginTop:8}}>
        <summary>보이스 목록 보기</summary>
        <ul style={{fontSize:12, maxHeight:160, overflow:"auto"}}>
          {voices.map((v,i)=>(
            <li key={i}>{v.name} ({v.lang}) {v.default ? "★" : ""}</li>
          ))}
        </ul>
      </details>

      <details style={{marginTop:8}}>
        <summary>로그</summary>
        <pre style={{fontSize:12, whiteSpace:"pre-wrap"}}>{log.join("\n")}</pre>
      </details>
    </div>
  );
}
