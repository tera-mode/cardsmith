'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import AppHeader from '@/components/ui/AppHeader';
import ConfirmSheet from '@/components/ui/ConfirmSheet';
import RarityBadge from '@/components/ui/RarityBadge';
import ImageCropModal from '@/components/ui/ImageCropModal';
import ImageLibraryModal from '@/components/ui/ImageLibraryModal';
import { MATERIALS, formatSkillUses } from '@/lib/data/materials';
import { getCostCapForLevel, rarityFromCost } from '@/lib/data/economy';
import { ForgeSpec, validateForge, buildCraftedCard, consumeMaterialsForForge } from '@/lib/server-logic/forge';
import { MaterialCategory, OwnedCard, RARITY_COLORS, UserImage } from '@/lib/types/meta';
import { uploadUserImage } from '@/lib/firebase/imageStorage';

const ICONS = ['⚔️','🛡️','🏹','🐎','💣','🔱','🗡️','💀','🌟','🔥','❄️','⚡','🌊','🌿','💎','🦅','🐉','🎯','🔮','🏰'];

function getMaterialsByCategory(cat: MaterialCategory, ownedMaterials: {materialId: string; count: number}[]) {
  return MATERIALS.filter(m => m.category === cat).map(m => ({
    ...m,
    owned: ownedMaterials.find(o => o.materialId === m.id)?.count ?? 0,
  }));
}

const slotStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(20,14,8,0.7)',
  border: '1px solid var(--border-rune)',
  borderRadius: 4, padding: '8px 12px',
};

export default function ForgePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, ownedMaterials, ownedCards, userImages, loading, updateCards, updateMaterials, addUserImage, removeUserImage } = useProfile();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [spec, setSpec] = useState<Partial<ForgeSpec>>({ atkMaterialIds: [], hpMaterialIds: [] });
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forging, setForging] = useState(false);
  const [forgedCard, setForgedCard] = useState<ReturnType<typeof buildCraftedCard> | null>(null);

  // 画像関連
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const playerLevel = profile?.level ?? 1;
  const cap = getCostCapForLevel(playerLevel);
  const validation = validateForge(spec, playerLevel);

  const getMat = (id?: string) => id ? MATERIALS.find(m => m.id === id) : null;

  const handleSelectMaterial = (matId: string) => {
    if (selectingSlot === 'movement')     setSpec(s => ({ ...s, movementMaterialId: matId }));
    else if (selectingSlot === 'attack_range') setSpec(s => ({ ...s, attackRangeMaterialId: matId }));
    else if (selectingSlot === 'atk')     setSpec(s => ({ ...s, atkMaterialIds: [...(s.atkMaterialIds ?? []), matId] }));
    else if (selectingSlot === 'hp')      setSpec(s => ({ ...s, hpMaterialIds: [...(s.hpMaterialIds ?? []), matId] }));
    else if (selectingSlot === 'skill')   setSpec(s => ({ ...s, skillMaterialId: matId }));
    setSelectingSlot(null);
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

  // ─── 画像アップロード処理 ────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setCropFile(f);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!user) return;
    setCropFile(null);
    setUploadingImage(true);
    try {
      const img = await uploadUserImage(user.uid, blob);
      addUserImage(img);
      setSpec(s => ({ ...s, imageUrl: img.url }));
    } catch (err) {
      console.error('画像アップロード失敗:', err);
      alert('画像のアップロードに失敗しました。Storage のルールが設定されているか確認してください。');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLibrarySelect = (img: UserImage) => {
    setShowLibrary(false);
    setSpec(s => ({ ...s, imageUrl: img.url }));
  };

  // プレビュー表示（imageUrl > iconKey の優先順）
  const previewImage = spec.imageUrl;
  const previewIcon = spec.iconKey ?? '❓';

  // ── ローディング ──────────────────────────────────────────────────────────────
  if (loading || !profile) {
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="鍛冶" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  // ── 鍛冶完了画面 ──────────────────────────────────────────────────────────────
  if (forgedCard) {
    const color = RARITY_COLORS[forgedCard.rarity];
    return (
      <div className="game-layout stone-bg flex-col">
        <AppHeader backHref="/" title="鍛冶完了" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
          <div style={{ fontSize: 48 }}>🔨</div>

          <div className="panel--ornate" style={{
            width: 180, padding: '16px 14px', textAlign: 'center',
            borderColor: `${color}70`,
            background: `linear-gradient(180deg, rgba(50,36,22,0.97) 0%, rgba(28,20,12,0.97) 100%)`,
          }}>
            <div style={{ marginBottom: 8 }}><RarityBadge rarity={forgedCard.rarity} /></div>
            {forgedCard.imageUrl ? (
              <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', margin: '0 auto 8px', border: `1px solid ${color}50` }}>
                <img src={forgedCard.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ fontSize: 40, marginBottom: 8, filter: `drop-shadow(0 0 12px ${color}80)` }}>{forgedCard.iconKey}</div>
            )}
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
              {forgedCard.name}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)' }}>
              ATK {forgedCard.atk} / HP {forgedCard.hp}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              コスト {forgedCard.cost}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
            <button
              onClick={() => { setForgedCard(null); setSpec({ atkMaterialIds: [], hpMaterialIds: [] }); }}
              className="btn--primary"
              style={{ flex: 1, minHeight: 44, fontSize: 13 }}
            >
              🔨 また鍛える
            </button>
            <button
              onClick={() => router.push('/collection')}
              className="btn--ghost"
              style={{ flex: 1, minHeight: 44, fontSize: 13 }}
            >
              コレクションへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── マテリアル選択シート ──────────────────────────────────────────────────────
  if (selectingSlot) {
    const catMap: Record<string, MaterialCategory> = {
      movement: 'movement', attack_range: 'attack_range',
      atk: 'stat_atk', hp: 'stat_hp', skill: 'skill',
    };
    const mats = getMaterialsByCategory(catMap[selectingSlot] ?? 'stat_hp', ownedMaterials);
    return (
      <div className="game-layout stone-bg flex-col">
        <header style={{
          flexShrink: 0, height: 56, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 14px',
          background: 'linear-gradient(180deg, rgba(40,28,16,0.97) 0%, rgba(20,14,8,0.9) 100%)',
          borderBottom: '1px solid var(--border-rune)',
        }}>
          <button onClick={() => setSelectingSlot(null)} style={{ color: 'var(--gold)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', width: 32 }}>←</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em' }}>
            マテリアルを選択
          </span>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mats.map(mat => (
            <button
              key={mat.id}
              onClick={() => handleSelectMaterial(mat.id)}
              disabled={mat.owned === 0}
              className="panel--ornate"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', opacity: mat.owned === 0 ? 0.4 : 1, cursor: mat.owned === 0 ? 'not-allowed' : 'pointer',
                textAlign: 'left', width: '100%',
              }}
            >
              <span style={{ fontSize: 22 }}>{mat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{mat.name}</p>
                  {mat.effect.type === 'skill' && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', background: 'rgba(88,28,135,0.45)', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>
                      {formatSkillUses(mat.effect.skill.uses)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{mat.description}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)' }}>コスト {mat.cost}</p>
                <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>所持 ×{mat.owned}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── メイン鍛冶画面 ────────────────────────────────────────────────────────────
  const rarity = validation.totalCost > 0 ? rarityFromCost(validation.totalCost) : null;
  const overCap = validation.totalCost > cap;

  return (
    <div className="game-layout stone-bg flex-col">
      {/* ヘッダー */}
      <header style={{
        flexShrink: 0, height: 56, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 14px',
        background: 'linear-gradient(180deg, rgba(40,28,16,0.97) 0%, rgba(20,14,8,0.9) 100%)',
        borderBottom: '1px solid var(--border-rune)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: -1, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.45 }} />
        <button onClick={() => router.push('/')} style={{ color: 'var(--gold)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', width: 32 }}>←</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.08em', flex: 1 }}>鍛冶</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          Lv{playerLevel} ・ 上限 {cap}
        </span>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* プレビューカード */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="panel--ornate"
            style={{
              width: 144, padding: '12px 10px', textAlign: 'center',
              borderColor: overCap ? 'var(--rune-red)' : rarity ? `${RARITY_COLORS[rarity]}70` : 'var(--border-rune)',
              boxShadow: rarity && !overCap ? `0 0 16px ${RARITY_COLORS[rarity]}30` : overCap ? '0 0 12px rgba(255,107,91,0.3)' : undefined,
            }}
          >
            {rarity && <div style={{ marginBottom: 6 }}><RarityBadge rarity={rarity} /></div>}
            {previewImage ? (
              <div style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', margin: '0 auto 6px', border: '1px solid rgba(255,255,255,0.15)' }}>
                <img src={previewImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ fontSize: 32, marginBottom: 6, filter: rarity ? `drop-shadow(0 0 8px ${RARITY_COLORS[rarity]}80)` : 'none' }}>
                {previewIcon}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
              {spec.name?.trim() || <span style={{ color: 'var(--text-dim)' }}>(名前未入力)</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)' }}>
              ATK {validation.atk} / HP {validation.hp}
            </div>
            <div
              data-testid="forge-cost-display"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: overCap ? 'var(--rune-red)' : 'var(--gold)', marginTop: 4 }}
            >
              {validation.totalCost} / {cap}
            </div>
          </div>
        </div>

        {/* カード名・絵文字アイコン */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            data-testid="forge-card-name-input"
            value={spec.name ?? ''}
            onChange={e => setSpec(s => ({ ...s, name: e.target.value }))}
            placeholder="カード名（15文字以内）"
            maxLength={15}
            style={{
              flex: 1, padding: '9px 12px',
              background: 'rgba(14,10,6,0.8)',
              border: '1px solid var(--border-rune)',
              borderRadius: 4, color: 'var(--text-primary)',
              fontFamily: 'var(--font-ui)', fontSize: 13, outline: 'none',
            }}
          />
          <button
            data-testid="forge-icon-picker"
            onClick={() => {
              const idx = ICONS.indexOf(spec.iconKey ?? '');
              setSpec(s => ({ ...s, iconKey: ICONS[(idx + 1) % ICONS.length] }));
            }}
            title="絵文字アイコンを切り替え"
            style={{
              width: 44, height: 44,
              background: 'rgba(14,10,6,0.8)',
              border: '1px solid var(--border-rune)',
              borderRadius: 4, fontSize: 22,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}
          >
            {spec.iconKey ?? '❓'}
          </button>
        </div>

        {/* カードイラスト */}
        <div style={{
          background: 'rgba(20,14,8,0.7)',
          border: '1px solid var(--border-rune)',
          borderRadius: 4, padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              カードイラスト（任意）
            </span>
            {spec.imageUrl && (
              <button
                onClick={() => setSpec(s => ({ ...s, imageUrl: undefined }))}
                style={{ fontSize: 10, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕ 削除
              </button>
            )}
          </div>

          {spec.imageUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-rune)' }}>
                <img src={spec.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>画像が設定されています</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {/* アップロードボタン */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  flex: 1, minHeight: 40,
                  background: 'rgba(20,14,8,0.8)',
                  border: '1px dashed var(--border-rune)',
                  borderRadius: 6,
                  color: uploadingImage ? 'var(--text-dim)' : 'var(--text-muted)',
                  fontSize: 11, cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {uploadingImage ? '⏳ アップロード中...' : '📷 アップロード'}
              </button>

              {/* ライブラリボタン */}
              {userImages.length > 0 && (
                <button
                  onClick={() => setShowLibrary(true)}
                  style={{
                    flex: 1, minHeight: 40,
                    background: 'rgba(20,14,8,0.8)',
                    border: '1px solid var(--border-rune)',
                    borderRadius: 6,
                    color: 'var(--text-muted)',
                    fontSize: 11, cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  🖼 ライブラリ ({userImages.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* スロット群 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 移動・攻撃範囲 */}
          {(['movement', 'attack_range'] as const).map(key => {
            const label = key === 'movement' ? '移動' : '攻撃範囲';
            const mat = getMat(key === 'movement' ? spec.movementMaterialId : spec.attackRangeMaterialId);
            return (
              <div key={key} style={slotStyle}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', width: 52, flexShrink: 0, letterSpacing: '0.04em' }}>{label}</span>
                <button
                  data-testid={`forge-slot-${key}`}
                  onClick={() => setSelectingSlot(key)}
                  style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                >
                  {mat
                    ? <span style={{ color: 'var(--text-primary)' }}>{mat.icon} {mat.name}</span>
                    : <span style={{ color: 'var(--text-dim)' }}>＋ 選択</span>}
                </button>
                {mat && (
                  <button onClick={() => setSpec(s => ({ ...s, [`${key}MaterialId`]: undefined }))}
                    style={{ color: 'var(--text-dim)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            );
          })}

          {/* ATK */}
          <div style={{ ...slotStyle, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', width: 52, flexShrink: 0 }}>ATK</span>
              <button data-testid="forge-slot-atk" onClick={() => setSelectingSlot('atk')}
                style={{ fontSize: 11, color: 'var(--rune-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                ＋追加
              </button>
            </div>
            {(spec.atkMaterialIds ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(spec.atkMaterialIds ?? []).map((id, i) => {
                  const m = getMat(id);
                  return (
                    <button key={i} onClick={() => setSpec(s => ({ ...s, atkMaterialIds: s.atkMaterialIds?.filter((_, j) => j !== i) }))}
                      style={{ fontSize: 11, background: 'rgba(30,50,80,0.8)', border: '1px solid rgba(93,184,255,0.3)', borderRadius: 3, padding: '2px 6px', color: 'var(--rune-blue)', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                      {m?.icon}{m?.name} ✕
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* HP */}
          <div style={{ ...slotStyle, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', width: 52, flexShrink: 0 }}>HP</span>
              <button data-testid="forge-slot-hp" onClick={() => setSelectingSlot('hp')}
                style={{ fontSize: 11, color: 'var(--rune-green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                ＋追加
              </button>
            </div>
            {(spec.hpMaterialIds ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(spec.hpMaterialIds ?? []).map((id, i) => {
                  const m = getMat(id);
                  return (
                    <button key={i} onClick={() => setSpec(s => ({ ...s, hpMaterialIds: s.hpMaterialIds?.filter((_, j) => j !== i) }))}
                      style={{ fontSize: 11, background: 'rgba(20,50,30,0.8)', border: '1px solid rgba(107,217,152,0.3)', borderRadius: 3, padding: '2px 6px', color: 'var(--rune-green)', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                      {m?.icon}{m?.name} ✕
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* スキル */}
          <div style={slotStyle}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', width: 52, flexShrink: 0 }}>スキル</span>
            <button data-testid="forge-slot-skill" onClick={() => setSelectingSlot('skill')}
              style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
              {(() => {
                const skMat = getMat(spec.skillMaterialId);
                if (!skMat) return <span style={{ color: 'var(--text-dim)' }}>＋ 任意</span>;
                return (
                  <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {skMat.icon} {skMat.name}
                    {skMat.effect.type === 'skill' && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#c084fc', background: 'rgba(88,28,135,0.45)', padding: '1px 4px', borderRadius: 3 }}>
                        {formatSkillUses(skMat.effect.skill.uses)}
                      </span>
                    )}
                  </span>
                );
              })()}
            </button>
            {spec.skillMaterialId && (
              <button onClick={() => setSpec(s => ({ ...s, skillMaterialId: undefined }))}
                style={{ color: 'var(--text-dim)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            )}
          </div>
        </div>

        {/* エラー */}
        {validation.errors.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {validation.errors.map((e, i) => (
              <p key={i} style={{ fontSize: 11, color: 'var(--rune-red)', fontFamily: 'var(--font-display)' }}>• {e}</p>
            ))}
          </div>
        )}

        {/* 生成ボタン */}
        <button
          data-testid="forge-create-button"
          onClick={() => setShowConfirm(true)}
          disabled={!validation.valid}
          className="btn--primary"
          style={{ minHeight: 50, fontSize: 15 }}
        >
          🔨 カードを鍛造する
        </button>
      </div>

      {/* 確認ダイアログ */}
      <ConfirmSheet
        open={showConfirm}
        title="カードを鍛造しますか？"
        onConfirm={handleForge}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="鍛造する"
        loading={forging}
      >
        <div style={{ textAlign: 'center', padding: '0 0 8px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            マテリアルを消費してカードを生成します
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)' }}>総コスト</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>
              {validation.totalCost}
            </span>
          </div>
        </div>
      </ConfirmSheet>

      {/* 非表示ファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* 画像クロップモーダル */}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* 画像ライブラリモーダル */}
      {showLibrary && (
        <ImageLibraryModal
          images={userImages}
          onSelect={handleLibrarySelect}
          onDeleted={removeUserImage}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
