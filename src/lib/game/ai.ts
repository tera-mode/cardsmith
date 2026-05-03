import { GameSession, Unit, Position, Card } from '@/lib/types/game';
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

function pickWeighted<T extends WeightedAction>(actions: T[]): T {
  // MVP: weightを無視してランダム選択
  return actions[Math.floor(Math.random() * actions.length)];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── AIターン実行 ─────────────────────────────────────────────────────────

const DELAY_MS = 700;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeAITurn(
  session: GameSession,
  onUpdate: (session: GameSession) => void
): Promise<GameSession> {
  let state = { ...session };

  // 1. ドロー（GameContextのdrawCard相当の処理をここでは行わない。
  //    ドローはGameContextで行い、この関数は召喚・行動のみ担当）

  // 2. 召喚（50%確率で試みる）
  if (Math.random() < 0.5 && !state.ai.hasSummonedThisTurn && state.ai.hand.length > 0) {
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
        ai: {
          ...state.ai,
          hand: newHand,
          hasSummonedThisTurn: true,
        },
        log: [...state.log, `AI: ${card.name} を召喚`],
      };
      onUpdate(state);
      await delay(DELAY_MS);
    }
  }

  // 3. ユニット行動（70%確率で試みる）
  if (Math.random() < 0.7) {
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

      // 移動
      const moves = getLegalMoves(unit, state.board);
      const allMoveOptions: Position[] = [unit.position, ...moves]; // 「移動しない」含む
      const chosenPos = pickRandom(allMoveOptions);
      let movedUnit = unit;

      if (chosenPos !== unit.position) {
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

      // 攻撃 or スキル or 何もしない（各33%）
      const roll = Math.random();
      if (roll < 0.5) {
        // 攻撃
        const attacks = getLegalAttacks(movedUnit, state.board);
        if (attacks.length > 0) {
          const target = pickRandom(attacks);
          const { board, log, playerBaseHp, aiBaseHp } = resolveAttack(state, movedUnit, target);

          // 反撃チェック
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
              const currentDefender = board[defender.position.row][defender.position.col];
              if (currentDefender) {
                const { state: afterCounter } = applyCounterAttack(nextState, currentDefender, movedUnit);
                nextState = afterCounter;
              }
            }
          }

          // 行動済みフラグ
          const finalBoard = nextState.board.map((r) => [...r]);
          const updatedUnit = finalBoard[movedUnit.position.row]?.[movedUnit.position.col];
          if (updatedUnit) {
            finalBoard[movedUnit.position.row][movedUnit.position.col] = {
              ...updatedUnit,
              hasActedThisTurn: true,
            };
          }

          state = { ...nextState, board: finalBoard };
          onUpdate(state);
          await delay(DELAY_MS);
        }
      } else if (roll < 0.7) {
        // スキル（発動できる場合のみ）
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
      // 何もしない場合: そのまま
    }
  }

  // 4. ターン終了
  // hasActedThisTurnリセット・フェーズ切替はGameContextで行う
  return state;
}
