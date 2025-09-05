import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text_th } = await req.json();
  const t = (text_th as string).toLowerCase();

  // 규칙 기반 간단 응답(태국어). 추후 LLM(태국어 입력/출력)로 교체.
  let th = 'ขอบคุณค่ะ ต้องการทำบริเวณไหนคะ?';
  if (t.includes('ราคา')) th = 'ช่วงราคาประมาณจะแจ้งให้หลังจากปรึกษานะคะ';
  else if (t.includes('เจ็บ'))
    th = 'ความเจ็บปวดขึ้นอยู่กับแต่ละคน กรุณาแจ้งประวัติและยาที่รับประทานอยู่ค่ะ';
  else if (t.includes('พักฟื้น'))
    th =
      'ช่วงพักฟื้นขึ้นอยู่กับประเภทหัตถการ โดยทั่วไปสามารถใช้ชีวิตประจำวันได้ภายใน 1-2 สัปดาห์ค่ะ';

  return NextResponse.json({ text_th: th });
}
