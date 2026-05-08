'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

const VIEWPORT = 300; // 画面上の表示領域サイズ (px)

interface Props {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ file, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 画像中心の座標（画像ピクセル）と表示スケール
  const [cropCenterX, setCropCenterX] = useState(0);
  const [cropCenterY, setCropCenterY] = useState(0);
  const [scale, setScale] = useState(1); // screen px / image px

  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; sc: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImgLoad = () => {
    const img = imgRef.current!;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    // 初期スケール：短辺がビューポートいっぱいになるよう
    const initScale = VIEWPORT / Math.min(w, h);
    setScale(initScale);
    setCropCenterX(w / 2);
    setCropCenterY(h / 2);
    setImgLoaded(true);
  };

  // 画像の左上座標（スクリーン px）を計算
  const imgLeft = useCallback(() => {
    const img = imgRef.current;
    if (!img) return 0;
    return VIEWPORT / 2 - cropCenterX * scale;
  }, [cropCenterX, scale]);

  const imgTop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return 0;
    return VIEWPORT / 2 - cropCenterY * scale;
  }, [cropCenterY, scale]);

  // ドラッグ（マウス）
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, cx: cropCenterX, cy: cropCenterY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setCropCenterX(dragRef.current.cx - dx / scale);
    setCropCenterY(dragRef.current.cy - dy / scale);
  };
  const stopDrag = () => { dragRef.current = null; };

  // タッチ操作（ドラッグ + ピンチズーム）
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      dragRef.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, cx: cropCenterX, cy: cropCenterY };
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      dragRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), sc: scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.sx;
      const dy = e.touches[0].clientY - dragRef.current.sy;
      setCropCenterX(dragRef.current.cx - dx / scale);
      setCropCenterY(dragRef.current.cy - dy / scale);
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setScale(Math.max(0.2, Math.min(6, pinchRef.current.sc * (dist / pinchRef.current.dist))));
    }
  };
  const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null; };

  // ズームボタン
  const zoomIn  = () => setScale(s => Math.min(6, s * 1.3));
  const zoomOut = () => setScale(s => Math.max(0.2, s / 1.3));

  // Canvas で 1024×1024 にクロップしてアップロード
  const handleConfirm = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    setUploading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // ビューポートの左上が画像上の何ピクセルか
      const srcX = cropCenterX - (VIEWPORT / 2) / scale;
      const srcY = cropCenterY - (VIEWPORT / 2) / scale;
      const srcSize = VIEWPORT / scale;

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 1024, 1024);

      canvas.toBlob((blob) => {
        if (blob) onConfirm(blob);
        setUploading(false);
      }, 'image/webp', 0.92);
    } catch {
      setUploading(false);
    }
  }, [imgLoaded, cropCenterX, cropCenterY, scale, onConfirm]);

  const dispLeft = imgRef.current ? imgLeft() : 0;
  const dispTop  = imgRef.current ? imgTop()  : 0;
  const dispW    = imgRef.current ? imgRef.current.naturalWidth  * scale : 0;
  const dispH    = imgRef.current ? imgRef.current.naturalHeight * scale : 0;

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }} />

      <div
        className="fixed z-50"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(96vw, 380px)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-rune)',
          borderRadius: 16,
          padding: '18px 16px 20px',
          boxShadow: 'inset 0 1px 0 rgba(232,192,116,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
          color: 'var(--gold)', letterSpacing: '0.1em',
        }}>
          🖼 トリミング
        </h3>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: -8 }}>
          ドラッグ・ピンチで位置とサイズを調整してください
        </p>

        {/* 画像ビューポート */}
        <div
          style={{
            width: VIEWPORT, height: VIEWPORT,
            overflow: 'hidden',
            position: 'relative',
            borderRadius: 8,
            border: '2px solid var(--gold-deep)',
            cursor: 'grab',
            background: '#111',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* hidden image for natural size measurement */}
          <img
            ref={imgRef}
            src={imgSrc}
            alt="crop"
            draggable={false}
            onLoad={onImgLoad}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', maxWidth: 'none' }}
          />

          {/* 表示用画像 */}
          {imgLoaded && (
            <img
              src={imgSrc}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: dispLeft,
                top: dispTop,
                width: dispW,
                height: dispH,
                maxWidth: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          )}

          {/* 四隅ガイド */}
          {(['tl','tr','bl','br'] as const).map(pos => (
            <div
              key={pos}
              style={{
                position: 'absolute',
                width: 16, height: 16,
                borderColor: 'var(--gold)',
                borderStyle: 'solid',
                borderWidth: 0,
                ...(pos.includes('t') ? { top: 4, borderTopWidth: 2 } : { bottom: 4, borderBottomWidth: 2 }),
                ...(pos.includes('l') ? { left: 4, borderLeftWidth: 2 } : { right: 4, borderRightWidth: 2 }),
              }}
            />
          ))}
        </div>

        {/* ズームコントロール */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={zoomOut}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(30,22,14,0.9)', border: '1px solid var(--border-rune)',
              color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer',
              display: 'grid', placeItems: 'center',
            }}
          >−</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', minWidth: 48, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(30,22,14,0.9)', border: '1px solid var(--border-rune)',
              color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer',
              display: 'grid', placeItems: 'center',
            }}
          >＋</button>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="btn--ghost"
            style={{ flex: 1, minHeight: 44, fontSize: 13 }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!imgLoaded || uploading}
            className="btn--primary"
            style={{ flex: 2, minHeight: 44, fontSize: 13 }}
          >
            {uploading ? '処理中...' : 'この範囲で確定'}
          </button>
        </div>
      </div>
    </>
  );
}
