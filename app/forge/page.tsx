'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import RarityBadge from '@/components/ui/RarityBadge';
import { MATERIALS } from '@/lib/data/materials';
import { getCostCapForLevel, rarityFromCost } from '@/lib/data/economy';
import { ForgeSpec, validateForge, buildCraftedCard, consumeMaterialsForForge } from '@/lib/server-logic/forge';
import { MaterialCategory, OwnedCard, RARITY_COLORS } from '@/lib/types/meta';
import { useAuth as useAuthCtx } from '@/contexts/AuthContext';

const ICONS = ['⚔️','🛡️','🏹','🐎','💣','🔱','🗡️','💀','🌟','🔥','❄️','⚡','🌊','🌿','💎','🦅','🐉','🎯','🔮','🏰'];

type SlotKey = 'movement' | 'attack_range';

function getMaterialsByCategory(cat: MaterialCategory, ownedMaterials: {materialId: string; count: number}[]) {
  return MATERIALS.filter(m => m.category === cat).map(m => ({
    ...m,
    owned: ownedMaterials.find(o => o.materialId === m.id)?.count ?? 0,
  }));
}

export default function ForgePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedMaterials, ownedCards, loading, updateCards, updateMaterials } = useProfile();
  const router = useRouter();

  const [spec, setSpec] = useState<Partial<ForgeSpec>>({ atkMaterialIds: [], hpMaterialIds: [] });
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forging, setForging] = useState(false);
  const [forgedCard, setForgedCard] = useState<ReturnType<typeof buildCraftedCard> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const playerLevel = profile?.level ?? 1;
  const cap = getCostCapForLevel(playerLevel);
  const validation = validateForge(spec, playerLevel);

  const getMat = (id?: string) => id ? MATERIALS.find(m => m.id === id) : null;

  const handleSelectMaterial = (matId: string) => {
    const mat = MATERIALS.find(m => m.id === matId);
    if (!mat) return;
    if (selectingSlot === 'movement') {
      setSpec(s => ({ ...s, movementMaterialId: matId }));
    } else if (selectingSlot === 'attack_range') {
      setSpec(s => ({ ...s, attackRangeMaterialId: matId }));
    } else if (selectingSlot === 'atk') {
      setSpec(s => ({ ...s, atkMaterialIds: [...(s.atkMaterialIds ?? []), matId] }));
    } else if (selectingSlot === 'hp') {
      setSpec(s => ({ ...s, hpMaterialIds: [...(s.hpMaterialIds ?? []), matId] }));
    } else if (selectingSlot === 'skill') {
      setSpec(s => ({ ...s, skillMaterialId: matId }));
    }
    setSelectingSlot(null);
  };

  const removeAtkMat = (idx: number) =>
    setSpec(s => ({ ...s, atkMaterialIds: s.atkMaterialIds?.filter((_, i) => i !== idx) }));
  const removeHpMat = (idx: number) =>
    setSpec(s => ({ ...s, hpMaterialIds: s.hpMaterialIds?.filter((_, i) => i !== idx) }));

  const getSlotMaterials = (slot: string) => {
    const cat: MaterialCategory =
      slot === 'movement' ? 'movement' :
      slot === 'attack_range' ? 'attack_range' :
      slot === 'atk' ? 'stat_atk' :
      slot === 'hp' ? 'stat_hp' : 'skill';
    return getMaterialsByCategory(cat, ownedMaterials);
  };

  const handleForge = async () => {
    if (!validation.valid || !user || !profile) return;
    setForging(true);
    try {
      const fullSpec = spec as ForgeSpec;
      const card = buildCraftedCard(fullSpec, user.uid, validation);

      const newMats = consumeMaterialsForForge(ownedMaterials, fullSpec);
      const newCards: OwnedCard[] = [
        ...ownedCards,
        { cardId: card.instanceId, count: 1, isCrafted: true, craftedData: card, acquiredAt: Date.now() },
      ];
      await updateMaterials(newMats);
      await updateCards(newCards);
      setForgedCard(card);
    } finally {
      setForging(false);
      setShowConfirm(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="鍛冶" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // 鍛冶完了画面
  if (forgedCard) {
    const color = RARITY_COLORS[forgedCard.rarity];
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <AppHeader backHref="/" title="鍛冶完了" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-5xl animate-bounce">🔨</div>
          <div
            className="w-48 rounded-2xl p-5 border-2 text-center"
            style={{ borderColor: color, background: `${color}10` }}
          >
            <RarityBadge rarity={forgedCard.rarity} />
            <div className="text-4xl my-3">{forgedCard.iconKey}</div>
            <div className="text-base font-bold text-white">{forgedCard.name}</div>
            <div className="text-sm text-[#94a3b8] mt-1">
              ATK {forgedCard.atk} / HP {forgedCard.hp}
            </div>
            <div className="text-xs text-[#64748b]">コスト {forgedCard.cost}</div>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => { setForgedCard(null); setSpec({ atkMaterialIds: [], hpMaterialIds: [] }); }}
              className="flex-1 py-3 bg-[#f59e0b] text-black font-bold rounded-xl text-sm"
            >
              また鍛える
            </button>
            <button
              onClick={() => router.push('/collection')}
              className="flex-1 py-3 bg-[#1e3a5f] text-[#94a3b8] font-bold rounded-xl text-sm"
            >
              コレクションへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // マテリアル選択シート
  if (selectingSlot) {
    const mats = getSlotMaterials(selectingSlot);
    return (
      <div className="game-layout flex-col bg-[#0a0e27]">
        <header className="flex-shrink-0 h-14 flex items-center px-3 gap-2 border-b border-[#1e3a5f]/50 bg-[#0a0e27]/90">
          <button onClick={() => setSelectingSlot(null)} className="text-[#94a3b8] text-xl">←</button>
          <span className="font-bold text-white text-sm">マテリアルを選択</span>
        </header>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {mats.map(mat => (
            <button
              key={mat.id}
              onClick={() => handleSelectMaterial(mat.id)}
              disabled={mat.owned === 0}
              className="w-full flex items-center gap-3 bg-[#16213e]/80 rounded-xl p-3 border border-[#1e3a5f]/50 disabled:opacity-40"
            >
              <span className="text-2xl">{mat.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{mat.name}</p>
                <p className="text-xs text-[#64748b]">{mat.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#fbbf24]">コスト {mat.cost}</p>
                <p className="text-xs text-[#64748b]">所持 ×{mat.owned}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const rarity = validation.totalCost > 0 ? rarityFromCost(validation.totalCost) : null;

  return (
    <div className="game-layout flex-col bg-[#0a0e27]">
      <header className="flex-shrink-0 h-14 flex items-center px-3 gap-2 border-b border-[#1e3a5f]/50 bg-[#0a0e27]/90">
        <button onClick={() => router.push('/')} className="text-[#94a3b8] text-xl">←</button>
        <span className="font-bold text-white text-sm flex-1">鍛冶</span>
        <span className="text-xs text-[#64748b]">Lv{playerLevel} 上限{cap}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* プレビューカード */}
        <div className="flex justify-center">
          <div
            className={`w-36 rounded-xl p-4 border-2 text-center ${validation.totalCost > cap ? 'border-red-500' : rarity ? `border-[${RARITY_COLORS[rarity]}]` : 'border-[#1e3a5f]'}`}
            style={rarity ? { borderColor: RARITY_COLORS[rarity] } : {}}
          >
            {rarity && <RarityBadge rarity={rarity} />}
            <div className="text-3xl my-2">{spec.iconKey ?? '❓'}</div>
            <div className="text-xs font-bold text-white">{spec.name?.trim() || '(名前未入力)'}</div>
            <div className="text-[10px] text-[#94a3b8] mt-1">
              ATK {validation.atk} / HP {validation.hp}
            </div>
            <div data-testid="forge-cost-display" className={`text-[10px] font-bold mt-0.5 ${validation.totalCost > cap ? 'text-red-400' : 'text-[#fbbf24]'}`}>
              {validation.totalCost}/{cap}
            </div>
          </div>
        </div>

        {/* カード名・アイコン */}
        <div className="flex gap-2">
          <input
            data-testid="forge-card-name-input"
            value={spec.name ?? ''}
            onChange={e => setSpec(s => ({ ...s, name: e.target.value }))}
            placeholder="カード名（15文字以内）"
            maxLength={15}
            className="flex-1 bg-[#16213e] border border-[#1e3a5f] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#3b82f6]"
          />
          <button
            data-testid="forge-icon-picker"
            onClick={() => {
              const idx = ICONS.indexOf(spec.iconKey ?? '');
              setSpec(s => ({ ...s, iconKey: ICONS[(idx + 1) % ICONS.length] }));
            }}
            className="w-12 bg-[#16213e] border border-[#1e3a5f] rounded-xl text-2xl flex items-center justify-center"
          >
            {spec.iconKey ?? '❓'}
          </button>
        </div>

        {/* スロット */}
        <div className="space-y-2">
          {([
            { key: 'movement', label: '移動', mat: getMat(spec.movementMaterialId) },
            { key: 'attack_range', label: '攻撃範囲', mat: getMat(spec.attackRangeMaterialId) },
          ] as const).map(({ key, label, mat }) => (
            <div key={key} className="flex items-center gap-2 bg-[#16213e]/60 rounded-xl p-3 border border-[#1e3a5f]/50">
              <span className="text-xs text-[#64748b] w-16 flex-shrink-0">{label}</span>
              <button
                data-testid={`forge-slot-${key}`}
                onClick={() => setSelectingSlot(key)}
                className="flex-1 text-left text-sm"
              >
                {mat ? (
                  <span className="text-white">{mat.icon} {mat.name}</span>
                ) : (
                  <span className="text-[#475569]">＋ 選択</span>
                )}
              </button>
              {mat && <button onClick={() => setSpec(s => ({ ...s, [`${key}MaterialId`]: undefined }))} className="text-[#475569] text-xs">✕</button>}
            </div>
          ))}

          {/* ATK */}
          <div className="bg-[#16213e]/60 rounded-xl p-3 border border-[#1e3a5f]/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#64748b] w-16">ATK</span>
              <button
                data-testid="forge-slot-atk"
                onClick={() => setSelectingSlot('atk')}
                className="text-xs text-[#3b82f6]"
              >
                ＋追加
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(spec.atkMaterialIds ?? []).map((id, i) => {
                const m = getMat(id);
                return (
                  <button key={i} onClick={() => removeAtkMat(i)}
                    className="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded">
                    {m?.icon}{m?.name} ✕
                  </button>
                );
              })}
            </div>
          </div>

          {/* HP */}
          <div className="bg-[#16213e]/60 rounded-xl p-3 border border-[#1e3a5f]/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#64748b] w-16">HP</span>
              <button
                data-testid="forge-slot-hp"
                onClick={() => setSelectingSlot('hp')}
                className="text-xs text-[#3b82f6]"
              >
                ＋追加
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(spec.hpMaterialIds ?? []).map((id, i) => {
                const m = getMat(id);
                return (
                  <button key={i} onClick={() => removeHpMat(i)}
                    className="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded">
                    {m?.icon}{m?.name} ✕
                  </button>
                );
              })}
            </div>
          </div>

          {/* スキル */}
          <div className="flex items-center gap-2 bg-[#16213e]/60 rounded-xl p-3 border border-[#1e3a5f]/50">
            <span className="text-xs text-[#64748b] w-16">スキル</span>
            <button
              data-testid="forge-slot-skill"
              onClick={() => setSelectingSlot('skill')}
              className="flex-1 text-left text-sm"
            >
              {spec.skillMaterialId ? (
                <span className="text-white">{getMat(spec.skillMaterialId)?.icon} {getMat(spec.skillMaterialId)?.name}</span>
              ) : (
                <span className="text-[#475569]">＋ 任意</span>
              )}
            </button>
            {spec.skillMaterialId && (
              <button onClick={() => setSpec(s => ({ ...s, skillMaterialId: undefined }))} className="text-[#475569] text-xs">✕</button>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {validation.errors.length > 0 && (
          <div className="space-y-1">
            {validation.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-400">• {e}</p>
            ))}
          </div>
        )}

        {/* 生成ボタン */}
        <button
          data-testid="forge-create-button"
          onClick={() => setShowConfirm(true)}
          disabled={!validation.valid}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black font-bold text-sm disabled:opacity-40 disabled:grayscale"
        >
          🔨 カードを生成する
        </button>
      </div>

      <ConfirmSheet
        open={showConfirm}
        title="カードを生成しますか？"
        onConfirm={handleForge}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="生成する"
        loading={forging}
      >
        <p className="text-sm text-[#94a3b8] text-center">
          使用したマテリアルは消費されます。
        </p>
        <p className="text-center text-[#fbbf24] font-bold mt-1">
          コスト {validation.totalCost}
        </p>
      </ConfirmSheet>
    </div>
  );
}
