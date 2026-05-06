/* Fully interactive battle screen */

const { useState: useState_b, useEffect: useEffect_b, useMemo: useMemo_b, useCallback: useCallback_b } = React;

const RUNES = ['F','R','K','M','N','U','T','I','Æ','Þ','Ƕ','ᚠ','ᚱ','ᚲ','ᚷ','ᛗ','ᛞ','ᛏ'];
function runeFor(r, c) {
  return RUNES[(r * 13 + c * 7) % RUNES.length];
}

// Apply heal to all adjacent friendly units, return new units
function applyHealerSkill(units, healer) {
  return units.map(u => {
    if (u.owner !== healer.owner || u.id === healer.id) return u;
    const dr = Math.abs(u.r - healer.r), dc = Math.abs(u.c - healer.c);
    if (dr + dc === 1) {
      return { ...u, hp: Math.min(u.maxHp, u.hp + 2) };
    }
    return u;
  });
}

function inBounds(state, r, c) {
  return r >= 0 && r < state.rows && c >= 0 && c < state.cols;
}

function unitAt(state, r, c) {
  return state.units.find(u => u.r === r && u.c === c);
}

function getSummonZone(state, owner) {
  const cells = [];
  if (owner === 'player') {
    for (let c = 0; c < state.cols; c++) cells.push({ r: state.rows - 1, c });
  } else {
    for (let c = 0; c < state.cols; c++) cells.push({ r: 0, c });
  }
  return cells.filter(({r,c}) => !unitAt(state, r, c));
}

function getMoveTargets(state, unit) {
  const card = window.CARD_MAP[unit.cardId];
  const offs = window.getMoveOffsets(card, unit.owner);
  return offs.map(o => ({ r: unit.r + o.dr, c: unit.c + o.dc }))
    .filter(p => inBounds(state, p.r, p.c) && !unitAt(state, p.r, p.c));
}

function getAttackTargets(state, unit) {
  const card = window.CARD_MAP[unit.cardId];
  const offs = window.getRangeOffsets(card, unit.owner);
  const targets = [];
  for (const o of offs) {
    const r = unit.r + o.dr, c = unit.c + o.dc;
    if (!inBounds(state, r, c)) continue;
    const target = unitAt(state, r, c);
    if (target && target.owner !== unit.owner) targets.push({ r, c, kind: 'unit' });
    // can attack base if at edge (frontmost row of opponent)
    const baseRow = unit.owner === 'player' ? -1 : state.rows;
    if ((unit.owner === 'player' && r === 0 && !target) || (unit.owner === 'enemy' && r === state.rows - 1 && !target)) {
      // base attack adjacent
    }
  }
  // Base attack: if unit is on enemy front row and forward range hits edge
  const card2 = window.CARD_MAP[unit.cardId];
  const offs2 = window.getRangeOffsets(card2, unit.owner);
  for (const o of offs2) {
    const r = unit.r + o.dr, c = unit.c + o.dc;
    if (unit.owner === 'player' && r < 0) targets.push({ r: -1, c: unit.c, kind: 'base' });
    if (unit.owner === 'enemy' && r >= state.rows) targets.push({ r: state.rows, c: unit.c, kind: 'base' });
  }
  return targets;
}

// Simple AI: take enemy turn after delay
function takeEnemyTurn(setState) {
  setState(prev => {
    if (prev.phase !== 'play' || prev.current !== 'enemy') return prev;
    let s = { ...prev, units: [...prev.units] };
    let log = [...s.log];

    // 1) Try to summon if zone available
    const zone = getSummonZone(s, 'enemy');
    if (zone.length && s.enemy.hand.length) {
      const card = s.enemy.hand[0];
      const cell = zone[Math.floor(zone.length / 2)];
      const newUnit = {
        id: `u${Date.now()}`, cardId: card.cardId, owner: 'enemy',
        r: cell.r, c: cell.c, hp: card.hp, maxHp: card.hp, atk: card.atk,
        hasActed: false, hasMoved: false,
      };
      s.units = [...s.units, newUnit];
      s.enemy = { ...s.enemy, hand: s.enemy.hand.slice(1) };
      log.push(`AIが${card.name}を召喚`);
    }

    // 2) For each enemy unit: try attack, else move
    for (const u of s.units.filter(x => x.owner === 'enemy' && !x.hasActed)) {
      const live = s.units.find(x => x.id === u.id);
      if (!live) continue;
      const atks = getAttackTargets(s, live);
      if (atks.length) {
        const t = atks[0];
        if (t.kind === 'base') {
          s.player = { ...s.player, baseHp: Math.max(0, s.player.baseHp - 1) };
          log.push(`AIの${window.CARD_MAP[live.cardId].name}が自陣を攻撃！ -1`);
        } else {
          const target = unitAt(s, t.r, t.c);
          if (target) {
            const newHp = target.hp - live.atk;
            if (newHp <= 0) {
              s.units = s.units.filter(x => x.id !== target.id);
              log.push(`AIの${window.CARD_MAP[live.cardId].name}が${window.CARD_MAP[target.cardId].name}を撃破`);
            } else {
              s.units = s.units.map(x => x.id === target.id ? { ...x, hp: newHp } : x);
              log.push(`AIの${window.CARD_MAP[live.cardId].name}の攻撃 -${live.atk}`);
            }
          }
        }
        s.units = s.units.map(x => x.id === live.id ? { ...x, hasActed: true } : x);
      } else {
        // move forward
        const moves = getMoveTargets(s, live);
        if (moves.length) {
          const m = moves[0];
          s.units = s.units.map(x => x.id === live.id ? { ...x, r: m.r, c: m.c, hasMoved: true } : x);
          log.push(`AIの${window.CARD_MAP[live.cardId].name}が前進`);
        }
      }
    }

    // End enemy turn
    s.current = 'player';
    s.turn = s.turn + 1;
    s.summoned = false; s.moved = false; s.attacked = false;
    s.units = s.units.map(u => ({ ...u, hasActed: false, hasMoved: false }));
    s.log = [...log, `ターン${s.turn}：あなたのターン`];

    if (s.player.baseHp <= 0) { s.phase = 'finished'; s.winner = 'enemy'; }
    if (s.enemy.baseHp <= 0)  { s.phase = 'finished'; s.winner = 'player'; }
    return s;
  });
}

function BattleScreen() {
  const [state, setState] = useState_b(window.makeInitialBattle());

  // Run enemy turn after switch
  useEffect_b(() => {
    if (state.current === 'enemy' && state.phase === 'play') {
      const t = setTimeout(() => takeEnemyTurn(setState), 1100);
      return () => clearTimeout(t);
    }
  }, [state.current, state.phase]);

  const isPlayerTurn = state.current === 'player' && state.phase === 'play';

  // Compute highlighted cells
  const highlights = useMemo_b(() => {
    if (!isPlayerTurn) return {};
    if (state.mode === 'summon' && state.selectedCardId !== null) {
      const cells = getSummonZone(state, 'player');
      return { type: 'summon', cells };
    }
    if (state.mode === 'move' && state.selectedUnit) {
      const u = state.units.find(x => x.id === state.selectedUnit);
      if (u) return { type: 'move', cells: getMoveTargets(state, u) };
    }
    if (state.mode === 'attack' && state.selectedUnit) {
      const u = state.units.find(x => x.id === state.selectedUnit);
      if (u) return { type: 'attack', cells: getAttackTargets(state, u) };
    }
    return {};
  }, [state]);

  const cellHighlight = (r, c) => {
    if (!highlights.cells) return null;
    const hit = highlights.cells.find(p => p.r === r && p.c === c);
    if (!hit) return null;
    return highlights.type;
  };

  // ----- Handlers -----
  const handleCardClick = (instanceId) => {
    if (!isPlayerTurn || state.summoned) return;
    setState(s => ({
      ...s,
      selectedCardId: s.selectedCardId === instanceId ? null : instanceId,
      mode: s.selectedCardId === instanceId ? 'idle' : 'summon',
      selectedUnit: null,
    }));
  };

  const handleCellClick = (r, c) => {
    if (!isPlayerTurn) return;

    // Summon
    if (state.mode === 'summon' && state.selectedCardId) {
      const zone = getSummonZone(state, 'player');
      if (!zone.find(p => p.r === r && p.c === c)) return;
      const handCard = state.player.hand.find(h => h.instanceId === state.selectedCardId);
      if (!handCard) return;
      setState(s => {
        const card = window.CARD_MAP[handCard.cardId];
        const newUnit = {
          id: `u${Date.now()}`, cardId: handCard.cardId, owner: 'player',
          r, c, hp: card.hp, maxHp: card.hp, atk: card.atk,
          hasActed: true, hasMoved: true, // summoned units act next turn
        };
        return {
          ...s,
          units: [...s.units, newUnit],
          player: { ...s.player, hand: s.player.hand.filter(h => h.instanceId !== state.selectedCardId) },
          summoned: true,
          selectedCardId: null,
          mode: 'idle',
          log: [...s.log, `${card.name}を召喚`],
        };
      });
      return;
    }

    // Click own unit -> select for action
    const u = unitAt(state, r, c);
    if (u && u.owner === 'player' && !u.hasActed) {
      setState(s => ({ ...s, selectedUnit: u.id, mode: 'move', selectedCardId: null }));
      return;
    }

    // Move
    if (state.mode === 'move' && state.selectedUnit) {
      const moves = getMoveTargets(state, state.units.find(x => x.id === state.selectedUnit));
      if (moves.find(p => p.r === r && p.c === c)) {
        setState(s => ({
          ...s,
          units: s.units.map(x => x.id === s.selectedUnit ? { ...x, r, c, hasMoved: true } : x),
          mode: 'attack',
          log: [...s.log, `${window.CARD_MAP[s.units.find(x=>x.id===s.selectedUnit).cardId].name}が移動`],
        }));
        return;
      }
    }

    // Attack
    if (state.mode === 'attack' && state.selectedUnit) {
      const me = state.units.find(x => x.id === state.selectedUnit);
      const targets = getAttackTargets(state, me);
      const hit = targets.find(t => t.r === r && t.c === c);
      if (hit) {
        setState(s => {
          let units = [...s.units];
          let log = [...s.log];
          let player = { ...s.player }, enemy = { ...s.enemy };
          if (hit.kind === 'base') {
            enemy.baseHp = Math.max(0, enemy.baseHp - 1);
            log.push(`${window.CARD_MAP[me.cardId].name}が敵陣を攻撃！ -1`);
          } else {
            const target = unitAt(s, r, c);
            if (target) {
              const newHp = target.hp - me.atk;
              if (newHp <= 0) {
                units = units.filter(x => x.id !== target.id);
                log.push(`${window.CARD_MAP[me.cardId].name}が${window.CARD_MAP[target.cardId].name}を撃破！`);
              } else {
                units = units.map(x => x.id === target.id ? { ...x, hp: newHp } : x);
                log.push(`${window.CARD_MAP[me.cardId].name}の攻撃 -${me.atk}`);
              }
            }
          }
          units = units.map(x => x.id === s.selectedUnit ? { ...x, hasActed: true } : x);
          let phase = s.phase, winner = s.winner;
          if (enemy.baseHp <= 0) { phase = 'finished'; winner = 'player'; }
          if (player.baseHp <= 0) { phase = 'finished'; winner = 'enemy'; }
          return { ...s, units, player, enemy, log, mode: 'idle', selectedUnit: null, attacked: true, phase, winner };
        });
        return;
      }
    }

    // Click healer for skill
    if (state.mode === 'move' && state.selectedUnit) {
      const me = state.units.find(x => x.id === state.selectedUnit);
      if (me && me.cardId === 'healer') {
        // already handled via heal button
      }
    }

    // Click empty -> deselect
    setState(s => ({ ...s, selectedUnit: null, selectedCardId: null, mode: 'idle' }));
  };

  const endTurn = () => {
    if (!isPlayerTurn) return;
    setState(s => ({
      ...s,
      current: 'enemy',
      log: [...s.log, `ターン${s.turn} AIのターン`],
      selectedUnit: null, selectedCardId: null, mode: 'idle',
    }));
  };

  const reset = () => setState(window.makeInitialBattle());

  // Skill: healer heals adjacent
  const useHealerSkill = () => {
    if (!state.selectedUnit) return;
    const me = state.units.find(x => x.id === state.selectedUnit);
    if (!me || me.cardId !== 'healer') return;
    setState(s => ({
      ...s,
      units: applyHealerSkill(s.units, me).map(x => x.id === s.selectedUnit ? { ...x, hasActed: true } : x),
      mode: 'idle',
      selectedUnit: null,
      log: [...s.log, `治癒兵が周囲を回復`],
    }));
  };

  // ----- Render -----
  const selectedUnit = state.selectedUnit ? state.units.find(x => x.id === state.selectedUnit) : null;
  const selectedCard = selectedUnit ? window.CARD_MAP[selectedUnit.cardId] : null;

  return (
    <div className="screen stone-bg" data-screen-label="03 Battle" style={{ background: 'linear-gradient(180deg, #14100a 0%, #06040a 100%)' }}>
      {/* Top base HP */}
      <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
        <BaseHpBar owner="enemy" hp={state.enemy.baseHp} />
      </div>

      {/* Board */}
      <div style={{
        position: 'relative',
        padding: '4px 10px',
        flexShrink: 0,
      }}>
        {/* Torches on side rails */}
        <Torch style={{ left: 2, top: 30 }} />
        <Torch style={{ right: 2, top: 30 }} />
        <Torch style={{ left: 2, bottom: 30 }} />
        <Torch style={{ right: 2, bottom: 30 }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
          gap: 4,
          padding: 6,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--gold-deep)',
          borderRadius: 4,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7), 0 0 16px rgba(232,192,116,0.1)',
        }}>
          {Array.from({ length: state.rows }).map((_, r) =>
            Array.from({ length: state.cols }).map((__, c) => {
              const u = unitAt(state, r, c);
              const zone = r === 0 ? 'enemy' : r === state.rows - 1 ? 'player' : null;
              const hl = cellHighlight(r, c);
              const cls = ['rune-tile'];
              if (zone === 'enemy') cls.push('rune-tile--enemy');
              if (zone === 'player') cls.push('rune-tile--player');
              if (hl === 'move') cls.push('rune-tile--highlight-move');
              if (hl === 'attack') cls.push('rune-tile--highlight-attack');
              if (hl === 'summon') cls.push('rune-tile--highlight-summon');
              if (selectedUnit && selectedUnit.r === r && selectedUnit.c === c) cls.push('rune-tile--selected');

              return (
                <div key={`${r}-${c}`} className={cls.join(' ')} onClick={() => handleCellClick(r, c)}>
                  <span className="rune-tile__rune">{runeFor(r, c)}</span>
                  {u && (
                    <div className={`unit unit--${u.owner} ${u.hasActed ? 'unit--acted' : ''}`}
                         onClick={(e) => { e.stopPropagation(); handleCellClick(r, c); }}>
                      <div style={{ fontSize: 16, lineHeight: 1 }}>{window.CARD_MAP[u.cardId].icon}</div>
                      <div className="unit__name">{window.CARD_MAP[u.cardId].name}</div>
                      <div className="unit__stats">
                        <span className="unit__atk">×{u.atk}</span>
                        <span className="unit__hp">♥{u.hp}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Player HP */}
      <div style={{ padding: '6px 10px 0', flexShrink: 0 }}>
        <BaseHpBar owner="player" hp={state.player.baseHp} />
      </div>

      {/* Turn indicator */}
      <div className="turn-bar">
        <span>ターン {state.turn}</span>
        <span className={isPlayerTurn ? 'turn-bar__indicator' : 'turn-bar__indicator turn-bar__indicator--enemy'}>
          {state.phase === 'finished'
            ? (state.winner === 'player' ? '◆ 勝利' : '✦ 敗北')
            : isPlayerTurn ? '▶ あなたのターン' : '◀ AI思考中...'}
        </span>
      </div>

      {/* Step bar */}
      <div className="step-bar">
        <span className={`step-bar__step ${state.summoned ? 'is-done' : (state.mode === 'summon' ? 'is-active' : '')}`}>◇ 召喚</span>
        <span className={`step-bar__step ${state.mode === 'attack' ? 'is-done' : (state.mode === 'move' ? 'is-active' : '')}`}>◇ 移動</span>
        <span className={`step-bar__step ${state.attacked ? 'is-done' : (state.mode === 'attack' ? 'is-active' : '')}`}>◇ 攻撃</span>
      </div>

      {/* Game log */}
      <div className="game-log scrollarea" ref={el => el && (el.scrollTop = el.scrollHeight)}>
        {state.log.slice(-4).map((l, i) => (
          <div key={i} className="game-log__entry">{l}</div>
        ))}
      </div>

      {/* Selected unit actions */}
      {selectedUnit && state.mode !== 'summon' && (
        <div style={{ padding: '6px 10px', display: 'flex', gap: 6, flexShrink: 0, background: 'rgba(0,0,0,0.4)' }}>
          <span style={{ fontSize: 11, color: 'var(--gold)', alignSelf: 'center', flex: 1 }}>
            {selectedCard.name} を操作中
          </span>
          {selectedCard.id === 'healer' && (
            <button className="btn btn--ghost" style={{ padding: '6px 10px', fontSize: 11 }} onClick={useHealerSkill}>✨ 治癒</button>
          )}
          <button className="btn btn--ghost" style={{ padding: '6px 10px', fontSize: 11 }}
                  onClick={() => setState(s => ({ ...s, selectedUnit: null, mode: 'idle' }))}>戻る</button>
        </div>
      )}

      {/* Hand */}
      <div style={{
        padding: '8px 10px',
        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.6))',
        borderTop: '1px solid var(--border-rune)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 4, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
          手札 {state.player.hand.length}枚 {state.summoned ? <span style={{ color: 'var(--rune-red)' }}>（召喚済み）</span> : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {state.player.hand.map(c => (
            <HandCard key={c.instanceId} card={c}
                      selected={state.selectedCardId === c.instanceId}
                      disabled={!isPlayerTurn || state.summoned}
                      onClick={() => handleCardClick(c.instanceId)} />
          ))}
        </div>
      </div>

      {/* End turn */}
      <div style={{ padding: '8px 10px 12px', flexShrink: 0 }}>
        {state.phase === 'finished' ? (
          <button className="btn btn--primary" style={{ width: '100%' }} onClick={reset}>
            {state.winner === 'player' ? '◆ 勝利！もう一度' : '✦ 敗北... 再挑戦'}
          </button>
        ) : (
          <button className="btn btn--primary" style={{ width: '100%' }} onClick={endTurn} disabled={!isPlayerTurn}>
            {isPlayerTurn ? 'ターン終了' : 'AI思考中...'}
          </button>
        )}
      </div>
    </div>
  );
}

window.BattleScreen = BattleScreen;
