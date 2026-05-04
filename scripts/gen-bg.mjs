// 背景画像（ファンタジー王宮）のプレースホルダーを生成
// 実行: node scripts/gen-bg.mjs

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BG_DIR = path.join(__dirname, '../public/images/backgrounds');
await mkdir(BG_DIR, { recursive: true });
await mkdir(path.join(BG_DIR, 'raw'), { recursive: true });

const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0d1b3e;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#1a2f5f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a1628;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="moon" cx="75%" cy="20%" r="15%">
      <stop offset="0%" style="stop-color:#fffde7;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#fffde7;stop-opacity:0" />
    </radialGradient>
  </defs>

  <!-- 背景（夜空） -->
  <rect width="1024" height="1024" fill="url(#sky)" />

  <!-- 星 -->
  ${Array.from({length:80}, () => {
    const x = Math.floor(Math.random()*1024);
    const y = Math.floor(Math.random()*400);
    const r = (Math.random()*1.5+0.5).toFixed(1);
    const op = (Math.random()*0.6+0.3).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${op}"/>`;
  }).join('\n  ')}

  <!-- 月 -->
  <circle cx="768" cy="180" r="60" fill="#fffde7" opacity="0.85" />
  <rect x="0" y="0" width="1024" height="1024" fill="url(#moon)" />

  <!-- 城壁（左右） -->
  <rect x="0" y="400" width="120" height="624" fill="#0f1f3d" />
  <rect x="904" y="400" width="120" height="624" fill="#0f1f3d" />
  <!-- 城壁の窓 -->
  ${Array.from({length:4}, (_, i) => `
  <rect x="30" y="${450+i*90}" width="40" height="55" rx="20" fill="#1a3060" />
  <rect x="60" y="${420+i*90}" width="8" height="20" fill="#1a3060" />
  <rect x="944" y="${450+i*90}" width="40" height="55" rx="20" fill="#1a3060" />
  <rect x="960" y="${420+i*90}" width="8" height="20" fill="#1a3060" />
  `).join('')}

  <!-- 城門アーチ -->
  <rect x="120" y="550" width="784" height="474" fill="#0a1628" />
  <path d="M120,700 Q512,480 904,700 L904,550 Q512,320 120,550 Z" fill="#0f1f3d" />

  <!-- アーチ内の廊下 -->
  <rect x="160" y="620" width="704" height="404" fill="#070f1e" />

  <!-- 柱（左右3本ずつ） -->
  ${[-1,0,1].map(i => `
  <rect x="${220+i*180}" y="560" width="28" height="464" rx="14" fill="#162440" />
  <rect x="${776+i*180>960?960:776+i*180}" y="560" width="28" height="464" rx="14" fill="#162440" />
  `).join('')}

  <!-- 床の反射 -->
  <rect x="160" y="800" width="704" height="224" fill="#0a1628" opacity="0.8" />
  <!-- 床タイル -->
  ${Array.from({length:8}, (_, i) => Array.from({length:5}, (_, j) =>
    `<rect x="${160+i*88}" y="${800+j*50}" width="86" height="48" rx="2" fill="none" stroke="#1e3a5f" stroke-width="1" opacity="0.4"/>`
  ).join('')).join('')}

  <!-- 遠景の王宮シルエット -->
  <rect x="380" y="300" width="264" height="260" fill="#0c1830" />
  <polygon points="380,300 512,200 644,300" fill="#0c1830" />
  <rect x="460" y="220" width="24" height="80" fill="#0c1830" />
  <rect x="528" y="220" width="24" height="80" fill="#0c1830" />
  <!-- 旗 -->
  <rect x="472" y="180" width="3" height="44" fill="#2a4a8a" />
  <polygon points="475,180 495,186 475,192" fill="#3a6ac8" />
  <rect x="531" y="180" width="3" height="44" fill="#2a4a8a" />
  <polygon points="534,180 554,186 534,192" fill="#3a6ac8" />

  <!-- 窓からの光 -->
  <ellipse cx="512" cy="480" rx="80" ry="40" fill="#f59e0b" opacity="0.08" />
  <rect x="472" y="480" width="80" height="120" fill="#f59e0b" opacity="0.05" />

  <!-- 青いトーチの光 -->
  ${[180, 340, 684, 844].map(x => `
  <ellipse cx="${x}" cy="620" rx="30" ry="15" fill="#3b82f6" opacity="0.15" />
  <rect x="${x-3}" y="580" width="6" height="40" rx="3" fill="#60a5fa" opacity="0.5" />
  <ellipse cx="${x}" cy="580" rx="8" ry="12" fill="#93c5fd" opacity="0.6" />
  `).join('')}
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).resize(1024, 1024).jpeg({ quality: 90 }).toFile(path.join(BG_DIR, 'board.jpg'));
await sharp(buf).resize(1024, 1024).jpeg({ quality: 90 }).toFile(path.join(BG_DIR, 'raw', 'board_raw.jpg'));
console.log('✅ 背景画像を生成しました: board.jpg');
