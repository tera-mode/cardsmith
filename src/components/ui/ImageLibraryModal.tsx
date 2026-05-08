'use client';

import type { UserImage } from '@/lib/types/meta';
import { deleteUserImage } from '@/lib/firebase/imageStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface Props {
  images: UserImage[];
  onSelect: (image: UserImage) => void;
  onDeleted: (imageId: string) => void;
  onClose: () => void;
}

export default function ImageLibraryModal({ images, onSelect, onDeleted, onClose }: Props) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (img: UserImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setDeleting(img.id);
    try {
      await deleteUserImage(user.uid, img.id);
      onDeleted(img.id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div
        className="fixed z-50"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(96vw, 400px)',
          maxHeight: '80dvh',
          overflowY: 'auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-rune)',
          borderRadius: 16,
          padding: '18px 16px 22px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em' }}>
            🖼 画像ライブラリ
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>画像がありません</p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>「画像をアップロード」からアップロードしてください</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {images.map(img => (
              <div
                key={img.id}
                onClick={() => onSelect(img)}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border-rune)',
                  cursor: 'pointer',
                  background: '#111',
                  transition: 'border-color 0.15s',
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* 削除ボタン */}
                <button
                  onClick={e => handleDelete(img, e)}
                  disabled={deleting === img.id}
                  style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 20, height: 20,
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none', borderRadius: '50%',
                    color: '#ff6b5b', fontSize: 10,
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                >
                  {deleting === img.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
