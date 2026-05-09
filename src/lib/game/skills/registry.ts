import { GameSession, Unit, Position } from '@/lib/types/game';

// ─── スキルトリガータイプ ─────────────────────────────────────────────────

export type SkillTriggerKind =
  | 'on_summon'        // 召喚時（自分が召喚された直後）
  | 'on_attack'        // 攻撃時（自分が攻撃した後）
  | 'on_damaged'       // 被ダメージ時（自分がダメージを受けた後）
  | 'on_death'         // 死亡時（自分が死亡した後）
  | 'on_turn_start'    // ターン開始時
  | 'on_turn_end'      // ターン終了時
  | 'activated'        // 手動起動型
  | 'aura'             // 常時オーラ（毎フレーム再計算）
  | 'on_move'          // 自分が移動した直後
  | 'on_skill_used'    // 場の他ユニットがスキルを使用した直後
  | 'on_summon_ally'   // 味方ユニット（自分以外）が召喚された直後
  | 'on_base_damaged'; // 自陣HPが減った直後

export interface SkillContext {
  remainingUses: number | 'infinite';
  turnCount: number;
  currentTurn: 'player' | 'ai';
  damagedBy?: Unit;           // on_damaged: ダメージを与えたユニット
  damageAmount?: number;      // on_damaged: ダメージ量
  killedBy?: Unit;            // on_death: 死因となったユニット
  attackTarget?: Unit;        // on_attack: 攻撃した相手
  movedFrom?: Position;       // on_move: 移動元の位置
  movedTo?: Position;         // on_move: 移動先の位置
  skillUser?: Unit;           // on_skill_used: スキルを使用したユニット
  skillUsedId?: string;       // on_skill_used: 使用されたスキルID
  summonedAlly?: Unit;        // on_summon_ally: 召喚された味方
  baseDamageAmount?: number;  // on_base_damaged: 自陣HPの減少量
}

export interface SkillResult {
  state: GameSession;
  log: string[];
}

export interface SkillDefinition {
  id: string;
  displayName: string;
  description: string;
  triggerKind: SkillTriggerKind;
  maxUsesDefault: number | 'infinite';

  // トリガー型・自動発動
  shouldTrigger?(ctx: SkillContext, self: Unit, state: GameSession): boolean;
  onTrigger?(ctx: SkillContext, self: Unit, state: GameSession): SkillResult;

  // 起動型
  canActivate?(state: GameSession, self: Unit, ctx: SkillContext): boolean;
  getValidTargets?(state: GameSession, self: Unit): Position[];
  resolve?(state: GameSession, self: Unit, target: Position | null, extraCtx?: Record<string, unknown>): SkillResult;

  // オーラ型
  applyAura?(state: GameSession, self: Unit): GameSession;
}

// ─── レジストリ ───────────────────────────────────────────────────────────

const REGISTRY = new Map<string, SkillDefinition>();

export function registerSkill(def: SkillDefinition): void {
  if (REGISTRY.has(def.id)) {
    console.warn(`Skill ID conflict: ${def.id}`);
    return;
  }
  REGISTRY.set(def.id, def);
}

export function getSkill(id: string): SkillDefinition | null {
  return REGISTRY.get(id) ?? null;
}

export function getAllSkills(): SkillDefinition[] {
  return Array.from(REGISTRY.values());
}

export function getSkillsByTrigger(kind: SkillTriggerKind): SkillDefinition[] {
  return getAllSkills().filter(s => s.triggerKind === kind);
}
