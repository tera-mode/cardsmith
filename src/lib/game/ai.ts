import { GameSession, Unit, Position } from '@/lib/types/game';
import {
  getLegalMoves,
  getLegalAttacks,
  getLegalSummonPositions,
  createUnit,
  placeUnit,
  removeUnit,
  resolveAttack,
  BOARD_ROWS,
  BOARD_COLS,
} from '@/lib/game/rules';
import { applyCounterAttack, SKILL_RESOLVERS } from '@/lib/game/skills';

// ─── 重み付きアクション（将来の評価AI拡張のための準備） ──────────────────

export interface WeightedAction {
  action: () => GameSession;
  weight: number;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── AIターン実行 ─────────────────────────────────────────────────────────

const DELAY_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeAITurn(
  session: GameSession,
  onUpdate: (session: GameSession) => void
): Promise<GameSession> {
  let state = { ...session };

  // 1. 召喚（80%確率 — 積極的に展開）
  if (Math.random() < 0.8 && !state.ai.hasSummonedThisTurn && state.ai.hand.length > 0) {
    const summonPositions = getLegalSummonPositions(state.board, 'ai');
    if (summonPositions.length > 0) {
      const card = pickRandom(state.ai.hand);
      const pos = pickRandom(summonPositions);
      const unit = createUnit(card, 'ai', pos);
      const newBoard = placeUnit(state.board, unit, pos);
      const newHand = state.ai.hand.filter((_, i) =>
        i !== state.ai.hand.findIndex((c) => c.id === card.id)
      );
      state = {
        ...state,
        board: newBoard,
        ai: { ...state.ai, hand: newHand, hasSummonedThisTurn: true },
        log: [...state.log, `AI: ${card.name} を召喚`],
      };
      onUpdate(state);
      await delay(DELAY_MS);
    }
  }

  // 2. 全ユニット行動（95%確率 — ほぼ毎ターン動く）
  if (Math.random() < 0.95) {
    const aiUnits: Unit[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const unit = state.board[r][c];
        if (unit && unit.owner === 'ai' && !unit.hasActedThisTurn) {
          aiUnits.push(unit);
        }
      }
    }

    if (aiUnits.length > 0) {
      const unit = pickRandom(aiUnits);

      // ─ 移動：前進を優先、後退は禁止
      const moves = getLegalMoves(unit, state.board);
      // 前進方向（AI視点でdyが正 = 下方向 = プレイヤー陣地へ）のみ優先
      const frontRow = BOARD_ROWS - 1;
      const forwardMoves = moves.filter((p) => p.row > unit.position.row);
      const lateralMoves = moves.filter((p) => p.row === unit.position.row);
      // 前進できなければ横移動、それもできなければ留まる
      const priorityMoves = forwardMoves.length > 0 ? forwardMoves
        : lateralMoves.length > 0 ? lateralMoves
        : [];

      let movedUnit = unit;

      if (priorityMoves.length > 0) {
        const chosenPos = pickRandom(priorityMoves);
        const newBoard = removeUnit(state.board, unit.position);
        movedUnit = { ...unit, position: chosenPos };
        const newBoard2 = placeUnit(newBoard, movedUnit, chosenPos);
        state = {
          ...state,
          board: newBoard2,
          log: [...state.log, `AI: ${unit.card.name} が移動`],
        };
        onUpdate(state);
        await delay(DELAY_MS);
      }

      // ─ 攻撃（70%確率）またはスキル（20%確率）
      const attacks = getLegalAttacks(movedUnit, state.board);

      // 最前線でのベース攻撃を最優先
      const baseAttack = attacks.find((a) => a.type === 'base');
      const unitAttacks = attacks.filter((a) => a.type === 'unit');
      const isAtFront = movedUnit.position.row === frontRow;

      if (baseAttack && isAtFront) {
        // 最前線: 必ずベース攻撃
        const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(state, movedUnit, baseAttack);
        let nextState: GameSession = {
          ...state,
          board,
          player: { ...state.player, baseHp: playerBaseHp },
          ai: { ...state.ai, baseHp: aiBaseHp },
          log: [...state.log, ...log],
        };
        const finalBoard = nextState.board.map((r) => [...r]);
        const updatedUnit = finalBoard[movedUnit.position.row]?.[movedUnit.position.col];
        if (updatedUnit) {
          finalBoard[movedUnit.position.row][movedUnit.position.col] = {
            ...updatedUnit, hasActedThisTurn: true,
          };
        }
        state = { ...nextState, board: finalBoard };
        onUpdate(state);
        await delay(DELAY_MS);
      } else if (unitAttacks.length > 0 && Math.random() < 0.7) {
        // 敵ユニット攻撃
        const target = pickRandom(unitAttacks);
        const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(state, movedUnit, target);
        let nextState: GameSession = {
          ...state,
          board,
          player: { ...state.player, baseHp: playerBaseHp },
          ai: { ...state.ai, baseHp: aiBaseHp },
          log: [...state.log, ...log],
        };
        if (target.type === 'unit') {
          const defender = target.unit;
          if (defender.card.skill?.effectType === 'counter') {
            const currentDefender = board[defender.position.row]?.[defender.position.col];
            if (currentDefender) {
              const { state: afterCounter } = applyCounterAttack(nextState, currentDefender, movedUnit);
              nextState = afterCounter;
            }
          }
        }
        const finalBoard = nextState.board.map((r) => [...r]);
        const updatedUnit = finalBoard[movedUnit.position.row]?.[movedUnit.position.col];
        if (updatedUnit) {
          finalBoard[movedUnit.position.row][movedUnit.position.col] = {
            ...updatedUnit, hasActedThisTurn: true,
          };
        }
        state = { ...nextState, board: finalBoard };
        onUpdate(state);
        await delay(DELAY_MS);
      } else if (Math.random() < 0.4) {
        // スキル使用
        const skill = movedUnit.card.skill;
        if (skill) {
          const resolver = SKILL_RESOLVERS[skill.effectType];
          if (resolver && resolver.canActivate(state, movedUnit)) {
            const targets = resolver.getValidTargets(state, movedUnit);
            const target = targets.length > 0 ? pickRandom(targets) : undefined;
            const { state: afterSkill } = resolver.resolve(state, movedUnit, target);
            state = afterSkill;
            onUpdate(state);
            await delay(DELAY_MS);
          }
        }
      }
    }
  }

  return state;
}
