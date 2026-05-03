'use client';

import { useEffect, useRef } from 'react';

interface Props {
  log: string[];
}

export default function GameLog({ log }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [log]);

  return (
    <div
      data-testid="game-log"
      ref={ref}
      className="overflow-y-auto max-h-20 px-3 py-1 text-[11px] text-gray-400 space-y-0.5"
    >
      {log.slice(-20).map((entry, i) => (
        <p key={i} className={entry.startsWith('─') ? 'text-gray-600 border-t border-gray-700 pt-0.5 mt-0.5' : ''}>
          {entry}
        </p>
      ))}
    </div>
  );
}
