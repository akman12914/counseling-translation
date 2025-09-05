import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, src, tgt } = await req.json();

  // 실제 번역 API 연결 시(예: Google/Azure/DeepL) 여기서 호출.
  // 키 없으면 데모용 프리픽스만 붙여 반환.
  const hasKey = !!process.env.GOOGLE_TRANSLATE_KEY;
  if (!hasKey) {
    let out = text;
    if (src === 'th' && tgt === 'ko') out = `[번역:TH→KO] ${text}`;
    if (src === 'ko' && tgt === 'th') out = `[번역:KO→TH] ${text}`;
    return NextResponse.json({ text: out });
  }

  // TODO: 실제 호출로 교체
  // const res = await fetch("https://translation.googleapis.com/language/translate/v2?key="+process.env.GOOGLE_TRANSLATE_KEY, {...})
  // const data = await res.json();
  // return NextResponse.json({ text: data.data.translations[0].translatedText });

  return NextResponse.json({ text }); // 임시
}
