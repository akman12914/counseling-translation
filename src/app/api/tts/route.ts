// app/api/tts/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'edge';
const API = 'https://api.elevenlabs.io/v1/text-to-speech';

function pickVoiceId(lang: 'ko'|'th'|string, role?: 'counselor'|'customer') {
  const env = (k: string) => process.env[k];

  if (lang === 'ko') {
    if (role === 'counselor' && env('ELEVEN_VOICE_KO_COUNSELOR')) return env('ELEVEN_VOICE_KO_COUNSELOR')!;
    if (role === 'customer'  && env('ELEVEN_VOICE_KO_CUSTOMER'))  return env('ELEVEN_VOICE_KO_CUSTOMER')!;
    if (env('ELEVEN_VOICE_KO')) return env('ELEVEN_VOICE_KO')!;
  }
  if (lang === 'th') {
    if (role === 'counselor' && env('ELEVEN_VOICE_TH_COUNSELOR')) return env('ELEVEN_VOICE_TH_COUNSELOR')!;
    if (role === 'customer'  && env('ELEVEN_VOICE_TH_CUSTOMER'))  return env('ELEVEN_VOICE_TH_CUSTOMER')!;
    if (env('ELEVEN_VOICE_TH')) return env('ELEVEN_VOICE_TH')!;
  }
  return env('ELEVEN_VOICE_DEFAULT') || 'Xb7hH8MSUJpSbSDYk0k2'; // fallback: Alice
}

export async function POST(req: Request) {
  try {
    const { text, lang = "ko", role } = await req.json(); // ★ role 받기
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const key = process.env.ELEVEN_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "ELEVEN_API_KEY missing" }, { status: 500 });
    }

    const model = process.env.ELEVEN_MODEL || "eleven_multilingual_v2";
    const voiceId = pickVoiceId(lang, role);

    const r = await fetch(`${API}/${voiceId}/stream`, { // ★ 스트리밍 엔드포인트
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.7,
          style: 0.6,
          use_speaker_boost: true,
        },
      }),
    });

    if (!r.ok || !r.body) {
      const t = await r.text();
      return NextResponse.json({ error: t || "no body" }, { status: 400 });
    }

    // 콘솔 확인용(원하면 주석)
    // console.log("[TTS]", { lang, role, voiceId });

    return new NextResponse(r.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "tts failed" }, { status: 500 });
  }
}