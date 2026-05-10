'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  log: string[];
  style?: React.CSSProperties;
}

export default function GameLog({ log, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);

  return (
    <div
      data-testid="game-log"
      ref={ref}
      style={{
        overflowY: 'auto',
        maxHeight: 52,
        padding: '4px 8px',
        background: 'rgba(8,6,4,0.7)',
        ...style,
      }}
    >
      {log.slice(-12).map((entry, i) => (
        <p
          key={i}
          style={{
            fontSize: 10,
            fontFamily: entry.startsWith('─') ? 'var(--font-display)' : 'var(--font-ui)',
            color: entry.startsWith('─') ? 'var(--text-dim)' : 'var(--text-muted)',
            borderTop: entry.startsWith('─') ? '1px solid rgba(90,79,61,0.3)' : 'none',
            paddingTop: entry.startsWith('─') ? 2 : 0,
            marginTop: entry.startsWith('─') ? 2 : 0,
            letterSpacing: entry.startsWith('─') ? '0.04em' : 0,
            lineHeight: 1.5,
          }}
        >
          {entry}
        </p>
      ))}
    </div>
  );
}
