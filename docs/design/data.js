/* Card data + battle game logic for cardsmith dungeon prototype */

window.RARITY = { C: 'C', R: 'R', SR: 'SR', SSR: 'SSR' };

window.CARDS = [
  { id: 'militia', name: '民兵', cost: 4, atk: 1, hp: 1, rarity: 'C',
    move: 'forward', range: 'melee', icon: '🛡️' },
  { id: 'light_infantry', name: '軽歩兵', cost: 5, atk: 1, hp: 2, rarity: 'C',
    move: 'forward', range: 'melee', icon: '⚔️' },
  { id: 'assault', name: '急襲兵', cost: 5, atk: 2, hp: 1, rarity: 'C',
    move: 'forward', range: 'melee', icon: '🗡️' },
  { id: 'scout', name: '偵察兵', cost: 5, atk: 1, hp: 1, rarity: 'C',
    move: 'jump2', range: 'melee', icon: '👁️' },
  { id: 'spear', name: '槍兵', cost: 6, atk: 2, hp: 2, rarity: 'C',
    move: 'forward', range: 'melee', icon: '🔱' },
  { id: 'heavy', name: '重装兵', cost: 7, atk: 1, hp: 4, rarity: 'R',
    move: 'forward', range: 'melee', icon: '🛡️' },
  { id: 'combat', name: '戦闘兵', cost: 8, atk: 3, hp: 3, rarity: 'R',
    move: 'forward', range: 'melee', icon: '⚔️' },
  { id: 'archer', name: '弓兵', cost: 11, atk: 2, hp: 1, rarity: 'R',
    move: 'forward', range: 'ranged2', icon: '🏹',
    skill: { name: '貫通', desc: 'ベース攻撃時、ダメージ+1', uses: 3 } },
  { id: 'guard', name: '衛兵', cost: 12, atk: 1, hp: 3, rarity: 'SR',
    move: 'cross', range: 'cross', icon: '🛡️' },
  { id: 'healer', name: '治癒兵', cost: 13, atk: 0, hp: 2, rarity: 'SR',
    move: 'forward', range: 'none', icon: '✨', portrait: 'assets/p_healer.png',
    skill: { name: '治癒', desc: '隣接味方のHPを+2', uses: '∞' } },
  { id: 'cavalry', name: '騎兵', cost: 14, atk: 4, hp: 3, rarity: 'SR',
    move: 'jump2', range: 'melee', icon: '🐎',
    skill: { name: '強化', desc: '味方ATKを永続+1', uses: 1 } },
  { id: 'cannon', name: '大砲', cost: 17, atk: 5, hp: 2, rarity: 'SR',
    move: 'forward', range: 'ranged4', icon: '💣',
    skill: { name: '大貫通', desc: 'ATK分そのまま貫通', uses: 1 } },
  { id: 'defender', name: '守護兵', cost: 28, atk: 2, hp: 5, rarity: 'SSR',
    move: 'cross', range: 'all8', icon: '🛡️',
    skill: { name: '反撃', desc: '攻撃元にATK分のダメージ', uses: '∞' } },
];

window.CARD_MAP = Object.fromEntries(window.CARDS.map(c => [c.id, c]));

// ========== Movement / Range helpers ==========
// Player units move "up" (row -), enemy moves "down" (row +)
function relativeOffsets(pattern, owner) {
  const dir = owner === 'player' ? -1 : 1; // forward
  switch (pattern) {
    case 'forward':  return [{ dr: dir, dc: 0 }];
    case 'jump2':    return [{ dr: 2*dir, dc: 0 }];
    case 'melee':    return [{ dr: dir, dc: 0 }];
    case 'ranged2':  return [{ dr: dir, dc: 0 }, { dr: 2*dir, dc: 0 }];
    case 'ranged4':  return [1,2,3,4].map(d => ({ dr: d*dir, dc: 0 }));
    case 'cross':    return [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    case 'all8':     {
      const r = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) r.push({ dr, dc });
      return r;
    }
    case 'none':     return [];
    default:         return [];
  }
}
window.getMoveOffsets = (card, owner) => relativeOffsets(card.move, owner);
window.getRangeOffsets = (card, owner) => relativeOffsets(card.range, owner);

// ========== Initial battle state ==========
window.makeInitialBattle = () => {
  const playerHand = ['militia','spear','healer'].map((id, i) => ({
    instanceId: `p${i}`, cardId: id, ...window.CARD_MAP[id]
  }));
  const enemyHand = ['assault','heavy','archer'].map((id, i) => ({
    instanceId: `e${i}`, cardId: id, ...window.CARD_MAP[id]
  }));
  return {
    rows: 5, cols: 4,
    turn: 1,
    current: 'player',
    phase: 'play', // play | finished
    winner: null,
    summoned: false,
    moved: false,
    attacked: false,
    player: { baseHp: 3, hand: playerHand },
    enemy:  { baseHp: 3, hand: enemyHand },
    units: [], // {id, cardId, owner, r, c, hp, maxHp, atk, hasActed, hasMoved}
    selectedUnit: null,
    selectedCardId: null,
    mode: 'idle', // idle | summon | move | attack
    log: ['ゲーム開始！プレイヤー先攻'],
  };
};
