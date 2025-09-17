// app/(wherever)/runDemo.ts
import { DEMO_SCENARIOS } from "./qaMap";

type Kind = "눈수술" | "코수술" | "안면윤곽";
type Lang = "ko" | "th";

async function speakWithVoiceAndWait(text: string, lang: Lang, role: "counselor" | "customer") {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang, role }),
  });
  if (!res.ok) throw new Error(await res.text());
  const url = URL.createObjectURL(await res.blob());
  await new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = (e) => reject(e);
    audio.play().catch(reject);
  });
}

export async function runDemoScenario(kind: Kind, lang: Lang = "ko") {
  const steps = DEMO_SCENARIOS[lang][kind];
  for (const { speaker, message } of steps) {
    const role = speaker === "상담사" ? "counselor" : "customer";
    await speakWithVoiceAndWait(message, lang, role);
  }
}
