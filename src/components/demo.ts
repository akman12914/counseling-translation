// app/(wherever)/demo.ts
import { DEMO_SCENARIOS, type DemoTurn } from "./qaMap";

type Lang = "ko" | "th";
type Role = "counselor" | "customer";

// 단일 오디오 + 직렬 재생 큐
let sharedAudio: HTMLAudioElement | null = null;
let playQueue: Promise<void> = Promise.resolve();
let cancelled = false;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * /api/tts 호출 → 오디오 재생을 큐에 직렬로 넣는다.
 * - role을 꼭 넘겨 고객/상담사 서로 다른 보이스 사용
 * - 에러가 나도 resolve()해서 다음 턴으로 진행
 */
async function enqueueSpeak(text: string, lang: Lang, role: Role): Promise<void> {
  if (!sharedAudio) sharedAudio = new Audio();

  // 네트워크 요청 (여기서 실패해도 다음 턴 진행)
  let blobUrl = "";
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, role }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[TTS] HTTP", res.status, body);
      // 429 같은 일시 오류는 짧게 재시도 1회
      if (res.status === 429) {
        await wait(350);
        return enqueueSpeak(text, lang, role);
      }
      return; // 실패 시 이 턴은 건너뛰고 다음 턴 진행
    }

    const url = URL.createObjectURL(await res.blob());
    blobUrl = url;

    // 직렬 큐에 등록 (항상 Promise<void> 반환)
    playQueue = playQueue.then(
      () =>
        new Promise<void>((resolve) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return resolve();
          }
          const a = sharedAudio!;
          a.src = url;

          a.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          a.onerror = () => {
            console.error("[TTS] audio error");
            URL.revokeObjectURL(url);
            resolve(); // 에러여도 다음 턴 진행
          };

          // 사용자 제스처 컨텍스트 내에서 시작되도록, runDemoScenario를 버튼 onClick에서 await 해주세요.
          a.play().catch((err) => {
            console.error("[TTS] play() failed", err);
            URL.revokeObjectURL(url);
            resolve();
          });
        })
    ).then(() => wait(120)); // 턴 사이 살짝 텀

    // 현재 턴 완료 대기 (오류는 위에서 처리했으므로 여기선 항상 resolve)
    await playQueue;
  } catch (err) {
    console.error("[TTS] request error", err);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    // 에러시에도 그냥 넘어가서 다음 턴 진행
  }
}

/**
 * 데모 전체 실행
 * - 버튼 onClick 핸들러에서 `await runDemoScenario(kind, lang)`로 호출 (사용자 제스처 유지)
 * - ko/th에 따라 현지화된 대본 사용
 * - speaker → role 매핑으로 고객/상담사 서로 다른 여성 보이스 사용
 */
export async function runDemoScenario(
  kind: "눈수술" | "코수술" | "안면윤곽",
  lang: Lang = "ko"
) {
  cancelled = false;

  const steps: DemoTurn[] | undefined = DEMO_SCENARIOS?.[lang]?.[kind];
  if (!Array.isArray(steps)) {
    console.error("[Demo] 시나리오 없음:", { lang, kind, keys: DEMO_SCENARIOS && Object.keys(DEMO_SCENARIOS) });
    return;
  }

  for (const { speaker, message } of steps) {
    if (cancelled) break;
    const role: Role = speaker === "상담사" ? "counselor" : "customer";
    await enqueueSpeak(message, lang, role);
  }
}

/**
 * 데모 중단 (옵션): 다른 버튼에서 호출하면 재생 중이던 턴 이후부터는 진행하지 않음
 */
export function stopDemo() {
  cancelled = true;
  // 현재 재생 중 오디오는 즉시 멈추고 싶다면:
  if (sharedAudio) {
    try { sharedAudio.pause(); } catch {}
  }
}
