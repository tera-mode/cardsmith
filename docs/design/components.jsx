/* Shared UI components: header, hp bar, card, panel, etc. */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- AppHeader ----------
function AppHeader({ title, onBack, runes = 400, showRunes = true }) {
  return (
    <header className="app-header">
      {onBack ? (
        <button className="app-header__back" onClick={onBack} aria-label="back">
          ←
        </button>
      ) : <div style={{ width: 32 }} />}
      <h1 className="app-header__title">{title}</h1>
      {showRunes ? (
        <div className="app-header__rune">
          <div className="rune-gem"></div>
          <span>{runes}</span>
        </div>
      ) : <div style={{ width: 32 }} />}
    </header>
  );
}

// ---------- Heart (svg) ----------
function Heart({ active = true, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: active ? 'drop-shadow(0 0 3px #ff5a4a)' : 'grayscale(1) opacity(0.4)' }}>
      <path d="M12 21s-7-4.5-9-9.5C1.5 7 5 3 8.5 3c1.8 0 3 1 3.5 2 .5-1 1.7-2 3.5-2C19 3 22.5 7 21 11.5c-2 5-9 9.5-9 9.5z"
            fill={active ? '#ff5a4a' : '#3a2a24'}
            stroke={active ? '#ff8a78' : '#4a3a30'} strokeWidth="1"/>
    </svg>
  );
}

// ---------- Hearts row ----------
function HeartsRow({ hp, max = 3 }) {
  return (
    <div className="hp-bar__hearts">
      {Array.from({ length: max }).map((_, i) => (
        <Heart key={i} active={i < hp} />
      ))}
    </div>
  );
}

// ---------- HpBar (base) ----------
function BaseHpBar({ owner, hp, max = 3 }) {
  const pct = (hp / max) * 100;
  return (
    <div className={`hp-bar hp-bar--${owner}`}>
      <span className="hp-bar__label">{owner === 'enemy' ? 'AI陣地' : '自陣'}</span>
      <HeartsRow hp={hp} max={max} />
      <div className="hp-bar__num">{hp}</div>
      <div className="hp-bar__track">
        <div className="hp-bar__fill" style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

// ---------- Rarity letter colors ----------
const RARITY_COLOR = { C: '#8a7a5e', R: '#5db8ff', SR: '#c478ff', SSR: '#ff9d3a' };

// ---------- Card (visual, used in hand) ----------
function HandCard({ card, selected, disabled, onClick }) {
  const cls = ['card'];
  if (selected) cls.push('is-selected');
  if (disabled) cls.push('is-disabled');
  const artStyle = card.portrait ? {
    backgroundImage: `url(${card.portrait})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};
  return (
    <div className={cls.join(' ')} onClick={disabled ? undefined : onClick}>
      <div className="card__rarity" data-r={card.rarity}>{card.rarity}</div>
      <div className="card__cost">{card.cost}</div>
      <div className="card__art" style={artStyle}>
        {!card.portrait && <span style={{ fontSize: 28 }}>{card.icon}</span>}
      </div>
      <div className="card__name">{card.name}</div>
      <div className="card__stats">
        <span className="atk">×{card.atk}</span>
        <span className="hp"><Heart size={9}/> {card.hp}</span>
      </div>
    </div>
  );
}

// ---------- Compact menu tile ----------
function MenuTile({ icon, label, accent, onClick, big = true, sub }) {
  return (
    <button
      onClick={onClick}
      className="panel panel--ornate"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        padding: '14px 12px',
        cursor: 'pointer',
        background: `linear-gradient(180deg, rgba(50, 36, 22, 0.96) 0%, rgba(28, 20, 12, 0.96) 100%), radial-gradient(ellipse at top right, ${accent}30 0%, transparent 60%)`,
        position: 'relative',
        minHeight: big ? 90 : 60,
      }}>
      <div style={{ fontSize: big ? 30 : 22, filter: `drop-shadow(0 0 8px ${accent}80)` }}>{icon}</div>
      <div className="text-display" style={{ fontSize: big ? 14 : 12, fontWeight: 600, color: 'var(--gold-glow)', letterSpacing: '0.04em', textShadow: '0 1px 0 #000' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </button>
  );
}

// ---------- Torch decoration ----------
function Torch({ style }) {
  return <div className="torch" style={style}></div>;
}

Object.assign(window, { AppHeader, Heart, HeartsRow, BaseHpBar, HandCard, MenuTile, Torch, RARITY_COLOR });
