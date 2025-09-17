'use client';
import React, { useState } from 'react';
import type { Lang } from './qaMap';
import { scenarios, type Scenario } from './qaMap';

type Props = {
  lang: Lang;
  speak: (text: string, lang: Lang) => Promise<void>;
};

export default function ScenarioPlayer({ lang, speak }: Props) {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [idx, setIdx] = useState(0);

  const turns = selected?.steps ?? [];
  const current = turns[idx];

  const startScenario = async (s: Scenario) => {
    setSelected(s);
    setIdx(0);
    const first = s.steps[0]?.[lang];
    if (first) await speak(first, lang);
  };

  const next = async () => {
    if (!selected) return;
    const nextIndex = Math.min(idx + 1, turns.length - 1);
    setIdx(nextIndex);
    const text = turns[nextIndex]?.[lang];
    if (text) await speak(text, lang);
  };

  const prev = async () => {
    if (!selected) return;
    const prevIndex = Math.max(idx - 1, 0);
    setIdx(prevIndex);
    const text = turns[prevIndex]?.[lang];
    if (text) await speak(text, lang);
  };

  return (
    <div className="space-y-3">
      {/* 시나리오 선택 버튼 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => startScenario(s)}
            className={`px-3 py-1.5 text-sm rounded-md border transition
              ${selected?.id === s.id ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50'}
            `}
          >
            {s.title[lang]}
          </button>
        ))}
      </div>

      {/* 현재 턴 카드 */}
      {selected && (
        <div className="max-w-xl mx-auto border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              {idx + 1} / {turns.length}
            </div>
            <div className="text-sm font-medium">{selected.title[lang]}</div>
          </div>

          <div className="text-lg">
            {current ? (
              <div className={current.role === 'user' ? 'text-gray-900' : 'text-blue-700'}>
                {current[lang]}
              </div>
            ) : (
              <div className="text-gray-500">
                {lang === 'ko' ? '시작할 대화를 선택하세요.' : 'โปรดเลือกบทสนทนาเพื่อเริ่ม'}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="px-3 py-1.5 text-sm rounded-md border bg-white disabled:opacity-50"
            >
              {lang === 'ko' ? '이전' : 'ก่อนหน้า'}
            </button>
            <button
              onClick={next}
              disabled={idx >= turns.length - 1}
              className="px-3 py-1.5 text-sm rounded-md border bg-blue-600 text-white disabled:opacity-50"
            >
              {lang === 'ko' ? '다음' : 'ถัดไป'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
