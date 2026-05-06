'use client';

import { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export default function ConfirmSheet({
  open, title, children, onConfirm, onCancel,
  confirmLabel = '実行', danger = false, loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          background: 'linear-gradient(180deg, rgba(40,28,16,0.99) 0%, rgba(14,10,6,0.99) 100%)',
          borderTop: '1px solid var(--border-rune-bright)',
          borderRadius: '12px 12px 0 0',
          padding: '16px 16px 20px',
          boxShadow: 'inset 0 1px 0 rgba(232,192,116,0.2), 0 -8px 32px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 金グラデ装飾ライン */}
        <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', margin: '0 auto 14px', borderRadius: 2 }} />

        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
          letterSpacing: '0.06em', color: 'var(--gold)',
          textAlign: 'center', marginBottom: 14,
          textShadow: '0 0 8px rgba(232,192,116,0.4)',
        }}>
          {title}
        </h3>

        <div style={{ marginBottom: 16 }}>{children}</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            data-testid="confirm-sheet-cancel"
            onClick={onCancel}
            className="btn--ghost"
            style={{ flex: 1, minHeight: 44, fontSize: 13 }}
          >
            キャンセル
          </button>
          <button
            data-testid="confirm-sheet-execute"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, minHeight: 44, borderRadius: 4,
              fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: 13, letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              background: danger
                ? 'linear-gradient(180deg, #a83a2a 0%, #5a1810 100%)'
                : 'linear-gradient(180deg, #d4942a 0%, #8a5a18 100%)',
              border: `1px solid ${danger ? '#d96a5a' : 'var(--gold)'}`,
              color: danger ? '#ffe0d0' : '#1a0e02',
              boxShadow: danger
                ? 'inset 0 1px 0 rgba(255,180,160,0.3)'
                : 'inset 0 1px 0 rgba(255,220,140,0.5)',
            }}
          >
            {loading ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
