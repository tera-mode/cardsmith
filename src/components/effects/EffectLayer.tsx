'use client';

import { useEffectQueue } from '@/contexts/EffectQueueContext';
import { SummonEffect } from './SummonEffect';
import { HitEffect } from './HitEffect';
import { DeathEffect } from './DeathEffect';
import { DamageNumber } from './DamageNumber';
import { TurnBanner } from './TurnBanner';
import { VictoryEffect } from './VictoryEffect';
import { DefeatEffect } from './DefeatEffect';
import { AttackMotion } from './AttackMotion';
import { SkillProcEffect } from './SkillProcEffect';

interface Props {
  boardRef: React.RefObject<HTMLElement | null>;
}

export function EffectLayer({ boardRef }: Props) {
  const { activeEffects, complete } = useEffectQueue();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {activeEffects.map(effect => {
        const done = () => complete(effect.id);
        switch (effect.type) {
          case 'summon':
            return <SummonEffect key={effect.id} effect={effect} onComplete={done} boardRef={boardRef} />;
          case 'hit':
            return <HitEffect key={effect.id} effect={effect} onComplete={done} boardRef={boardRef} />;
          case 'death':
            return <DeathEffect key={effect.id} effect={effect} onComplete={done} boardRef={boardRef} />;
          case 'damage_number':
            return <DamageNumber key={effect.id} effect={effect} onComplete={done} boardRef={boardRef} />;
          case 'attack_motion':
            return <AttackMotion key={effect.id} effect={effect} onComplete={done} boardRef={boardRef} />;
          case 'skill_proc':
            return <SkillProcEffect key={effect.id} effect={effect} onComplete={done} boardRef={boardRef} />;
          case 'turn_banner':
            return <TurnBanner key={effect.id} effect={effect} onComplete={done} />;
          case 'victory':
            return <VictoryEffect key={effect.id} effect={effect} onComplete={done} />;
          case 'defeat':
            return <DefeatEffect key={effect.id} effect={effect} onComplete={done} />;
          default:
            // hp_change, move, base_attack, status_apply は別コンポーネントで処理
            return null;
        }
      })}
    </div>
  );
}
