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
    <div className="fixed inset-0 z-50 flex items-end" onClick={onCancel}>
      <div
        className="w-full bg-[#0d1b35] border-t border-[#1e3a5f] rounded-t-2xl p-5 space-y-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white text-center">{title}</h3>
        <div>{children}</div>
        <div className="flex gap-3">
          <button
            data-testid="confirm-sheet-cancel"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-[#1e3a5f]/60 text-[#94a3b8] font-bold text-sm"
          >
            キャンセル
          </button>
          <button
            data-testid="confirm-sheet-execute"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all ${
              danger
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8]'
            } disabled:opacity-50`}
          >
            {loading ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
