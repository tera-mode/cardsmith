/* Other screens: Home, Story, Collection, Forge, Summon */

const { useState: useS, useMemo: useM } = React;

// ============================================================
// HOME
// ============================================================
function HomeScreen() {
  const items = [
    { key: 'story',      label: 'ストーリー',  icon: '📖', accent: '#5db8ff' },
    { key: 'play',       label: '自由対戦',    icon: '⚔️',  accent: '#e85a4a' },
    { key: 'collection', label: 'コレクション', icon: '🃏', accent: '#c478ff' },
    { key: 'materials',  label: 'マテリアル',  icon: '⚙️',  accent: '#8a7a5e' },
    { key: 'deck',       label: 'デッキ編集',  icon: '📋',  accent: '#22d3ee' },
    { key: 'forge',      label: '鍛冶',       icon: '🔨',  accent: '#e8a93a' },
    { key: 'shop',       label: 'ショップ',    icon: '🏪',  accent: '#6bd998' },
    { key: 'gacha',      label: '召喚',       icon: '✨',  accent: '#ffd54a' },
  ];

  return (
    <div className="screen stone-bg" data-screen-label="01 Home">
      {/* Hero header */}
      <div style={{
        padding: '14px 16px 10px',
        background: 'linear-gradient(180deg, rgba(40, 28, 16, 0.95), rgba(20, 14, 8, 0.85))',
        borderBottom: '1px solid var(--border-rune)',
        position: 'relative',
      }}>
        <Torch style={{ left: 8, top: 12 }} />
        <Torch style={{ right: 8, top: 12 }} />
        <div style={{ textAlign: 'center', padding: '0 32px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.12em', textShadow: '0 0 10px rgba(232,192,116,0.5), 0 1px 0 #000' }}>
            CARDSMITH
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', marginTop: 2 }}>
            THE APEX RUNESMITH
          </div>
        </div>
      </div>

      {/* Player bar: lvl + exp + runes */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.4)' }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: '50%',
          border: '2px solid var(--gold)',
          display: 'grid', placeItems: 'center',
          background: 'radial-gradient(circle, #5a3a1a, #1a0e02)',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--gold-glow)',
          boxShadow: 'inset 0 0 8px rgba(232,192,116,0.4), 0 0 8px rgba(232,192,116,0.3)',
        }}>1</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>Lv 1 鍛冶見習い</span>
            <span>50 / 100 EXP</span>
          </div>
          <div style={{ height: 4, background: 'rgba(0,0,0,0.6)', border: '1px solid #000', borderRadius: 1, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '50%', background: 'linear-gradient(90deg, #5db8ff, #2a6fdb)', boxShadow: '0 0 6px #5db8ff' }}></div>
          </div>
        </div>
        <div className="app-header__rune">
          <div className="rune-gem"></div>
          <span style={{ fontSize: 13 }}>400</span>
        </div>
      </div>

      <div className="scrollarea" style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Next goal — like a quest scroll */}
        <div className="panel panel--ornate" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-display)' }}>NEXT QUEST</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div style={{ fontSize: 22 }}>📖</div>
            <div style={{ flex: 1 }}>
              <div className="text-display" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-glow)', textShadow: '0 1px 0 #000' }}>第2話：スキルの力</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Chapter 1 ・ Quest 1-2</div>
            </div>
            <div style={{ color: 'var(--gold)', fontSize: 18 }}>›</div>
          </div>
        </div>

        <div className="divider-rune">⚜ メニュー ⚜</div>

        {/* Menu grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {items.map(item => (
            <MenuTile key={item.key} icon={item.icon} label={item.label} accent={item.accent} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[{label:'履歴', icon:'📜'}, {label:'プロフィール', icon:'👤'}].map(i => (
            <button key={i.label} className="panel" style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(20, 14, 8, 0.6)', cursor: 'pointer' }}>
              <span style={{ fontSize: 14 }}>{i.icon}</span>
              <span>{i.label}</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-dim)', padding: 4, fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
          ⚜ 合同会社 LAIV ⚜
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STORY
// ============================================================
function StoryScreen() {
  const [chapter, setChapter] = useS(1);
  const chapters = [
    { n: 1, title: '鍛冶師見習い' },
    { n: 2, title: '南の砦' },
    { n: 3, title: '北の山岳' },
  ];
  const quests = [
    { n: 1, title: '第1話：最初の一歩', desc: '基本操作を覚えよう。召喚・移動・攻撃を体験する。', exp: 50, runes: 100, hasCard: true, status: 'cleared' },
    { n: 2, title: '第2話：スキルの力', desc: '弓兵の「貫通」スキルを使って敵を倒せ。', exp: 50, runes: 100, hasCard: true, status: 'available' },
    { n: 3, title: '第3話：敵陣を崩せ', desc: '敵の本陣を攻撃して HP を 0 にしろ。', exp: 50, runes: 100, status: 'locked' },
    { n: 4, title: '第4話：本気の戦い', desc: '油断のない相手に勝て。', exp: 100, runes: 200, status: 'locked' },
    { n: 5, title: '第5話：章のボス', desc: 'Chapter 1 最強の敵に挑め。', exp: 300, runes: 500, hasCard: true, status: 'locked' },
  ];

  return (
    <div className="screen stone-bg" data-screen-label="02 Story">
      <AppHeader title="ストーリー" onBack={() => {}} />

      {/* Chapter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-rune)', background: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
        {chapters.map(c => (
          <button key={c.n} onClick={() => setChapter(c.n)}
                  style={{
                    flex: 1, padding: '10px 4px',
                    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: chapter === c.n ? '2px solid var(--gold)' : '2px solid transparent',
                    color: chapter === c.n ? 'var(--gold-glow)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textShadow: chapter === c.n ? '0 0 8px var(--gold)' : 'none',
                  }}>
            <div style={{ fontSize: 9, opacity: 0.6 }}>CHAPTER {c.n}</div>
            <div style={{ marginTop: 2 }}>{c.title}</div>
          </button>
        ))}
      </div>

      {/* Quests */}
      <div className="scrollarea" style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {quests.map(q => {
          const locked = q.status === 'locked';
          const cleared = q.status === 'cleared';
          const available = q.status === 'available';
          const Icon = locked ? '🔒' : cleared ? '✓' : '▶';
          return (
            <div key={q.n} className="panel" style={{
              opacity: locked ? 0.5 : 1,
              borderColor: cleared ? 'rgba(107,217,152,0.4)' : available ? 'var(--gold)' : 'var(--border-rune)',
              background: available ? 'linear-gradient(180deg, rgba(60,42,22,0.92), rgba(28,20,12,0.92))' : 'var(--bg-panel)',
              boxShadow: available ? 'inset 0 0 16px rgba(232,192,116,0.1), 0 0 12px rgba(232,192,116,0.15)' : 'none',
              padding: '12px',
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  fontSize: 16,
                  borderRadius: 4,
                  background: cleared ? 'linear-gradient(180deg, #2a6a3a, #143824)' :
                              available ? 'linear-gradient(180deg, #c47a18, #6a3a08)' :
                              'rgba(0,0,0,0.5)',
                  border: '1px solid ' + (cleared ? '#6bd998' : available ? 'var(--gold)' : 'var(--border-rune)'),
                  color: cleared ? '#6bd998' : available ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                }}>{Icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{q.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>{q.desc}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    <span>+{q.exp} EXP</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>+{q.runes} <div className="rune-gem" style={{ width: 10, height: 10 }}></div></span>
                    {q.hasCard && <span style={{ color: 'var(--gold)' }}>◆ 報酬カード</span>}
                  </div>
                </div>
                {!locked && (
                  <button className={cleared ? 'btn btn--ghost' : 'btn btn--primary'} style={{ padding: '6px 14px', fontSize: 11, alignSelf: 'center' }}>
                    {cleared ? '再挑戦' : '挑戦'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// COLLECTION
// ============================================================
function CollectionScreen() {
  const owned = { assault: 1, archer: 1 };
  const cards = window.CARDS;

  return (
    <div className="screen stone-bg" data-screen-label="04 Collection">
      <AppHeader title="コレクション" onBack={() => {}} />

      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-rune)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
        <span>所持 <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{Object.keys(owned).length}</span> 種 / 全 {cards.length} 種</span>
        <span style={{ color: 'var(--text-muted)' }}>レア度順</span>
      </div>

      <div className="scrollarea" style={{ flex: 1, padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {cards.map(c => {
            const count = owned[c.id] || 0;
            const isOwned = count > 0;
            const cls = ['coll-card'];
            if (isOwned) cls.push('is-owned');
            else cls.push('is-locked');
            return (
              <div key={c.id} className={cls.join(' ')}>
                <div className="coll-card__rarity" style={{ color: window.RARITY_COLOR[c.rarity], borderColor: window.RARITY_COLOR[c.rarity] }}>
                  {c.rarity}
                </div>
                <div className="coll-card__count">×{count}</div>
                {c.portrait && isOwned ? (
                  <div style={{
                    width: 56, height: 56,
                    margin: '8px auto 4px',
                    borderRadius: 4,
                    backgroundImage: `url(${c.portrait})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--gold-deep)',
                    boxShadow: '0 0 8px rgba(232,192,116,0.3)',
                  }}></div>
                ) : (
                  <div className="coll-card__icon">{c.icon}</div>
                )}
                <div className="coll-card__name">{c.name}</div>
                <div className="coll-card__stats">ATK {c.atk} ・ HP {c.hp} ・ C{c.cost}</div>
                {isOwned && (
                  <button className="btn btn--ghost" style={{ width: '100%', padding: '4px', fontSize: 10, marginTop: 6 }}>抽出</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FORGE
// ============================================================
function ForgeScreen() {
  const [name, setName] = useS('');
  const [move, setMove] = useS('');
  const [range, setRange] = useS('');
  const [atk, setAtk] = useS(0);
  const [hp, setHp] = useS(0);

  const cost = atk + hp * 2 + (move ? 1 : 0) + (range ? 1 : 0);
  const errors = [];
  if (!name) errors.push('カード名を入力してください');
  if (!move) errors.push('移動を選択してください');
  if (!range) errors.push('攻撃範囲を選択してください');
  if (hp === 0) errors.push('HPを1以上選択してください');

  const valid = errors.length === 0;

  return (
    <div className="screen stone-bg" data-screen-label="05 Forge">
      <AppHeader title="鍛冶" onBack={() => {}} showRunes={false} />
      <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 5, fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
        Lv1 ・ 上限 6
      </div>

      {/* Anvil/torch decoration */}
      <Torch style={{ left: 12, top: 70 }} />
      <Torch style={{ right: 12, top: 70 }} />

      <div className="scrollarea" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Preview card on anvil */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div style={{ position: 'relative' }}>
            {/* anvil glow under */}
            <div style={{
              position: 'absolute', inset: '-12px -20px -8px',
              background: 'radial-gradient(ellipse at center bottom, rgba(255,140,40,0.4), transparent 70%)',
              filter: 'blur(8px)',
            }}></div>
            <div className="card" style={{ width: 130, position: 'relative', cursor: 'default' }}>
              <div className="card__rarity" data-r="C" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>C</div>
              <div className="card__cost" style={{ background: cost > 6 ? 'radial-gradient(circle, #e85a4a, #5a1810)' : undefined }}>{cost}</div>
              <div className="card__art" style={{
                background: name ? 'linear-gradient(180deg, #5a3a1a, #2a1808)' : 'linear-gradient(180deg, #2a1f12, #14100a)',
                fontSize: 36,
              }}>
                {name ? '⚔' : <span style={{ color: 'var(--rune-red)', fontSize: 36 }}>?</span>}
              </div>
              <div className="card__name" style={{ opacity: name ? 1 : 0.5 }}>
                {name || '(名前未入力)'}
              </div>
              <div className="card__stats">
                <span className="atk">ATK {atk}</span>
                <span className="hp">HP {hp}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 10, color: cost > 6 ? 'var(--rune-red)' : 'var(--gold)', marginTop: 4, fontFamily: 'var(--font-display)' }}>
                COST {cost}/6
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ForgeRow label="カード名">
            <input value={name} onChange={e => setName(e.target.value.slice(0, 15))}
                   placeholder="15文字以内"
                   style={{
                     flex: 1, background: 'rgba(0,0,0,0.5)',
                     border: '1px solid var(--border-rune)', borderRadius: 3,
                     padding: '6px 10px', color: 'var(--text-primary)',
                     fontSize: 12, fontFamily: 'var(--font-body)',
                   }}/>
            <button className="btn btn--ghost" style={{ padding: '6px 10px', fontSize: 11 }}>?</button>
          </ForgeRow>
          <ForgeRow label="移動">
            <ForgePick value={move} setValue={setMove} options={[
              { v: 'forward', l: '前進1' }, { v: 'jump2', l: '跳躍2' }, { v: 'cross', l: '十字1' }
            ]}/>
          </ForgeRow>
          <ForgeRow label="攻撃範囲">
            <ForgePick value={range} setValue={setRange} options={[
              { v: 'melee', l: '近接' }, { v: 'ranged2', l: '射程2' }, { v: 'all8', l: '全方位' }
            ]}/>
          </ForgeRow>
          <ForgeRow label="ATK">
            <ForgePick value={atk} setValue={setAtk} options={[
              { v: 1, l: '+1' }, { v: 2, l: '+2' }, { v: 3, l: '+3' }
            ]}/>
          </ForgeRow>
          <ForgeRow label="HP">
            <ForgePick value={hp} setValue={setHp} options={[
              { v: 1, l: '+1' }, { v: 2, l: '+2' }, { v: 3, l: '+3' }
            ]}/>
          </ForgeRow>
          <ForgeRow label="スキル">
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, textAlign: 'left', paddingLeft: 8 }}>+ 任意</span>
          </ForgeRow>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ padding: '8px 4px', fontSize: 11, color: 'var(--rune-red)', display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'var(--font-body)' }}>
            {errors.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}

        <button className="btn btn--primary" disabled={!valid} style={{ width: '100%', padding: '14px', fontSize: 14 }}>
          🔨 カードを鍛造する
        </button>
      </div>
    </div>
  );
}

function ForgeRow({ label, children }) {
  return (
    <div className="panel" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(20, 14, 8, 0.7)' }}>
      <div style={{ width: 70, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{label}</div>
      {children}
    </div>
  );
}

function ForgePick({ value, setValue, options }) {
  return (
    <div style={{ flex: 1, display: 'flex', gap: 4 }}>
      {options.map(o => (
        <button key={o.v}
                onClick={() => setValue(value === o.v ? (typeof o.v === 'number' ? 0 : '') : o.v)}
                style={{
                  flex: 1, padding: '5px 4px', fontSize: 10,
                  fontFamily: 'var(--font-display)',
                  background: value === o.v ? 'linear-gradient(180deg, #c47a18, #6a3a08)' : 'rgba(0,0,0,0.4)',
                  color: value === o.v ? '#1a0e02' : 'var(--text-secondary)',
                  border: '1px solid ' + (value === o.v ? 'var(--gold)' : 'var(--border-rune)'),
                  borderRadius: 3,
                  cursor: 'pointer',
                  textShadow: value === o.v ? '0 1px 0 rgba(255,220,140,0.4)' : 'none',
                  fontWeight: 600,
                }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// SUMMON (gacha)
// ============================================================
function SummonScreen() {
  const [pulled, setPulled] = useS(null);
  const [runes, setRunes] = useS(400);

  const pullOne = () => {
    if (runes < 200) return;
    setRunes(r => r - 200);
    const c = window.CARDS[Math.floor(Math.random() * window.CARDS.length)];
    setPulled([c]);
  };

  return (
    <div className="screen stone-bg" data-screen-label="06 Summon">
      <AppHeader title="召喚" onBack={() => {}} runes={runes} />

      <div className="scrollarea" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Magic circle */}
        <div style={{ position: 'relative', height: 180, display: 'grid', placeItems: 'center', marginTop: 8 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at center, rgba(232, 192, 116, 0.25) 0%, rgba(168, 122, 54, 0.1) 40%, transparent 70%)',
          }}></div>
          <svg width="160" height="160" style={{ position: 'absolute', filter: 'drop-shadow(0 0 12px rgba(232,192,116,0.6))', animation: 'spin 30s linear infinite' }}>
            <circle cx="80" cy="80" r="76" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.6"/>
            <circle cx="80" cy="80" r="64" fill="none" stroke="var(--gold)" strokeWidth="0.5" opacity="0.5"/>
            <circle cx="80" cy="80" r="50" fill="none" stroke="var(--gold)" strokeWidth="0.5" opacity="0.4" strokeDasharray="4 3"/>
            {/* runes around circle */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const x = 80 + Math.cos(a) * 70;
              const y = 80 + Math.sin(a) * 70;
              return <text key={i} x={x} y={y} fontSize="10" fill="var(--gold)" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-display)">{['ᚠ','ᚱ','ᚲ','ᚷ','ᛗ','ᛞ','ᛏ','ᚺ'][i]}</text>;
            })}
            {/* pentagram */}
            <polygon points="80,20 95,72 142,72 104,100 119,148 80,120 41,148 56,100 18,72 65,72"
                     fill="none" stroke="var(--gold)" strokeWidth="0.6" opacity="0.5"/>
          </svg>
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
            <div style={{ fontSize: 38, filter: 'drop-shadow(0 0 12px var(--gold))' }}>✨</div>
            <div className="text-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-glow)', marginTop: 6, letterSpacing: '0.08em', textShadow: '0 0 10px var(--gold), 0 1px 0 #000' }}>
              標準召喚
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              ルーンを捧げ、戦士を呼び出せ
            </div>
          </div>
        </div>

        {/* Pulled card display */}
        {pulled && (
          <div className="panel panel--ornate" style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'fadein 0.4s' }}>
            <div className="card" style={{ width: 80, cursor: 'default' }}>
              <div className="card__rarity" data-r={pulled[0].rarity}>{pulled[0].rarity}</div>
              <div className="card__cost">{pulled[0].cost}</div>
              <div className="card__art" style={pulled[0].portrait ? { backgroundImage: `url(${pulled[0].portrait})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {!pulled[0].portrait && <span style={{ fontSize: 22 }}>{pulled[0].icon}</span>}
              </div>
              <div className="card__name" style={{ fontSize: 10 }}>{pulled[0].name}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>SUMMONED</div>
              <div className="text-display" style={{ fontSize: 16, fontWeight: 700, color: window.RARITY_COLOR[pulled[0].rarity], textShadow: '0 0 8px currentColor', marginTop: 2 }}>
                {pulled[0].rarity} ・ {pulled[0].name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                ATK {pulled[0].atk} ・ HP {pulled[0].hp}
              </div>
            </div>
          </div>
        )}

        {/* Single pull */}
        <div className="panel panel--ornate">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div>
              <div className="text-display" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-glow)' }}>単発召喚</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>1枚を召喚する</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)' }}>
              <div className="rune-gem"></div>
              <span>200</span>
            </div>
          </div>
          <button className="btn btn--primary" style={{ width: '100%', padding: '12px' }} onClick={pullOne} disabled={runes < 200}>
            召喚する
          </button>
        </div>

        {/* 10-pull */}
        <div className="panel" style={{ background: 'rgba(20, 14, 8, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div>
              <div className="text-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>10連召喚</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>R以上1枚保証 ・ <span style={{ color: 'var(--gold)' }}>10%お得</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <div className="rune-gem" style={{ filter: 'grayscale(0.5)' }}></div>
              <span>1800</span>
            </div>
          </div>
          <button className="btn btn--ghost" style={{ width: '100%', padding: '10px' }} disabled>10連召喚する</button>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--rune-red)', marginTop: 4, fontFamily: 'var(--font-body)' }}>ルーンが足りません</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
          排出率：C 70% ・ R 22% ・ SR 7% ・ SSR 1%
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.StoryScreen = StoryScreen;
window.CollectionScreen = CollectionScreen;
window.ForgeScreen = ForgeScreen;
window.SummonScreen = SummonScreen;
