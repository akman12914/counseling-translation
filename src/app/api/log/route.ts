import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // 실제 서비스: DB에 저장(patients, sessions, messages 등)
  console.log('[LOG_KO_TH]', body);
  return NextResponse.json({ ok: true });
}
