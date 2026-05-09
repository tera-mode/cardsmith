import Image from 'next/image';

interface Props {
  /** オーバーレイ暗さ（0〜1）。デフォルト 0.72。0 でオーバーレイなし */
  overlayOpacity?: number;
}

export default function ForgeBg({ overlayOpacity = 0.72 }: Props) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <Image
        src="/images/backgrounds/home.png"
        alt=""
        fill
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        priority
      />
      {overlayOpacity > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(8,5,3,${overlayOpacity * 0.95}) 0%, rgba(5,3,1,${overlayOpacity}) 100%)`,
        }} />
      )}
    </div>
  );
}
