// カードのプレースホルダー画像を生成するスクリプト
// 実行: node scripts/gen-card-images.mjs

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/images/cards');
const RAW_DIR = path.join(OUT_DIR, 'raw');

await mkdir(OUT_DIR, { recursive: true });
await mkdir(RAW_DIR, { recursive: true });

const CARDS = [
  { id: 'militia',        name: '民兵',   color1: '#4a3510', color2: '#c8851e', accent: '#f0a030', role: '⚔' },
  { id: 'light_infantry', name: '軽歩兵', color1: '#1a2f5f', color2: '#2878c8', accent: '#60a5fa', role: '🗡' },
  { id: 'assault_soldier',name: '急襲兵', color1: '#5a1a1a', color2: '#c82828', accent: '#f87171', role: '⚔' },
  { id: 'scout',          name: '偵察兵', color1: '#1a3a1a', color2: '#28882a', accent: '#4ade80', role: '🏹' },
  { id: 'spear_soldier',  name: '槍兵',   color1: '#4a3a10', color2: '#b8831a', accent: '#fbbf24', role: '⚔' },
  { id: 'heavy_infantry', name: '重装兵', color1: '#2a2a2a', color2: '#6a6a6a', accent: '#d1d5db', role: '🛡' },
  { id: 'combat_soldier', name: '戦闘兵', color1: '#3a1f0a', color2: '#9b4513', accent: '#fb923c', role: '⚔' },
  { id: 'archer',         name: '弓兵',   color1: '#0f3a2a', color2: '#1a7a4a', accent: '#34d399', role: '🏹' },
  { id: 'guard',          name: '衛兵',   color1: '#0a2a3a', color2: '#1a6a8a', accent: '#38bdf8', role: '🛡' },
  { id: 'healer',         name: '治癒兵', color1: '#3a1a3a', color2: '#8a3a8a', accent: '#e879f9', role: '✦' },
  { id: 'cavalry',        name: '騎兵',   color1: '#2a1a0a', color2: '#8a5a0a', accent: '#fcd34d', role: '⚔' },
  { id: 'cannon',         name: '大砲',   color1: '#1a1a2a', color2: '#4a4a7a', accent: '#818cf8', role: '◉' },
  { id: 'defender',       name: '守護兵', color1: '#1a1a4a', color2: '#2a2a9a', accent: '#a5b4fc', role: '🛡' },
];

function makeSvg(card) {
  const { name, color1, color2, accent, role } = card;
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${color1};stop-opacity:0" />
    </radialGradient>
  </defs>

  <!-- 背景 -->
  <rect width="512" height="512" fill="url(#bg)" />
  <rect width="512" height="512" fill="url(#glow)" />

  <!-- ドット柄 -->
  ${Array.from({length:16}, (_,i) => Array.from({length:16}, (_,j) =>
    `<circle cx="${32+i*32}" cy="${32+j*32}" r="1.5" fill="${accent}" opacity="0.15"/>`
  ).join('')).join('')}

  <!-- シルエット（単純化された女性キャラ形状） -->
  <!-- 頭 -->
  <ellipse cx="256" cy="170" rx="52" ry="58" fill="${accent}" opacity="0.25" />
  <!-- 髪 -->
  <ellipse cx="256" cy="145" rx="60" ry="45" fill="${accent}" opacity="0.35" />
  <rect x="196" y="145" width="20" height="80" rx="10" fill="${accent}" opacity="0.3" />
  <rect x="296" y="145" width="20" height="70" rx="10" fill="${accent}" opacity="0.3" />
  <!-- 体 -->
  <path d="M210,228 Q256,240 302,228 L310,350 Q256,370 202,350 Z" fill="${accent}" opacity="0.2" />
  <!-- 腕 -->
  <rect x="175" y="235" width="25" height="90" rx="12" fill="${accent}" opacity="0.2" transform="rotate(-8 187 280)" />
  <rect x="312" y="235" width="25" height="90" rx="12" fill="${accent}" opacity="0.2" transform="rotate(8 324 280)" />
  <!-- 脚 -->
  <rect x="225" y="348" width="30" height="100" rx="15" fill="${accent}" opacity="0.18" />
  <rect x="257" y="348" width="30" height="100" rx="15" fill="${accent}" opacity="0.18" />

  <!-- 輝きオーバーレイ -->
  <rect width="512" height="512" fill="url(#shine)" />

  <!-- ロールアイコン -->
  <circle cx="256" cy="200" r="80" fill="rgba(0,0,0,0.25)" />
  <text x="256" y="220"
    font-family="serif" font-size="72"
    text-anchor="middle" fill="${accent}" opacity="0.9">${role}</text>

  <!-- カード名 -->
  <rect x="40" y="430" width="432" height="60" rx="8" fill="rgba(0,0,0,0.5)" />
  <text x="256" y="470"
    font-family="serif" font-size="32" font-weight="bold"
    text-anchor="middle" fill="white">${name}</text>

  <!-- 上部デコライン -->
  <rect x="0" y="0" width="512" height="4" fill="${accent}" opacity="0.6" />
  <rect x="0" y="508" width="512" height="4" fill="${accent}" opacity="0.6" />
</svg>`;
}

let generated = 0;
for (const card of CARDS) {
  const svg = makeSvg(card);
  const buf = Buffer.from(svg);
  const outPath = path.join(OUT_DIR, `${card.id}.png`);
  const rawPath = path.join(RAW_DIR, `${card.id}_raw.png`);

  await sharp(buf).resize(512, 512).png().toFile(outPath);
  await sharp(buf).resize(512, 512).png().toFile(rawPath);

  console.log(`✓ ${card.id}.png`);
  generated++;
}

console.log(`\n✅ ${generated}枚のカード画像を生成しました`);
