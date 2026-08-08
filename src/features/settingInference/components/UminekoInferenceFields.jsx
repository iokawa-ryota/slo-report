import React, { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { StepperField } from './StepperField.jsx';
import {
  UMINEKO2_BIG_COLOR_OPTIONS,
  UMINEKO2_BONUS_TRIGGER_OPTIONS,
  UMINEKO2_BONUS_TYPE_OPTIONS,
  UMINEKO2_REG_COLOR_OPTIONS,
  UMINEKO2_TRUTH_POINT_OPTIONS
} from '../config/umineko2.js';

const selectClass = 'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-500';
const listCardClass = 'rounded-2xl border border-slate-200 bg-slate-50 p-4';
const compactGridClass = 'grid grid-cols-2 gap-2 min-[420px]:grid-cols-3';
const twoColumnCompactGridClass = 'grid grid-cols-1 gap-2 min-[360px]:grid-cols-2';

const Accordion = ({ title, subtitle, children, defaultOpen = false, testId }) => (
  <details className="rounded-3xl border border-slate-200 bg-white shadow-sm" open={defaultOpen} data-testid={testId}>
    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5">
      <div>
        <h3 className="text-sm font-black text-slate-800">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
    </summary>
    <div className="border-t border-slate-100 p-4 sm:p-5">
      {children}
    </div>
  </details>
);

const LabeledField = ({ label, children, hint = '', fieldId }) => (
  <div className="space-y-1">
    <label htmlFor={fieldId} className="block text-xs font-black text-slate-700">{label}</label>
    {React.isValidElement(children) ? React.cloneElement(children, { id: fieldId }) : children}
    {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
  </div>
);

const EventCard = ({ title, subtitle, onDelete }) => (
  <div className={listCardClass}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-black text-slate-800">{title}</div>
        {subtitle && <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="min-h-11 min-w-11 rounded-xl border border-slate-200 bg-white text-slate-500"
        aria-label={`${title} を削除`}
      >
        <Trash2 size={16} className="mx-auto" />
      </button>
    </div>
  </div>
);

const ConfirmModal = ({ title, body, confirmLabel, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-black text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

const EntryModal = ({ title, subtitle, countLabel, onClose, children }) => (
  <div
    data-testid="entry-modal-overlay"
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
  >
    <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
      <div
        data-testid="entry-modal-panel"
        className="flex max-h-[100dvh] w-full min-h-0 flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black text-slate-800">{title}</div>
              {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
              {countLabel && <p className="mt-2 text-[11px] font-bold text-indigo-600">{countLabel}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 min-w-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
              aria-label={`${title} モーダルを閉じる`}
            >
              閉じる
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const SummaryActionCard = ({ title, description, countLabel, primaryLabel, onOpen }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-black text-slate-800">{title}</div>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
        <p className="mt-2 text-xs font-black text-indigo-600">{countLabel}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
      >
        <ExternalLink size={16} />
        {primaryLabel}
      </button>
    </div>
  </div>
);

const getBonusColorOptions = (bonusType) => (
  bonusType === 'REG' ? UMINEKO2_REG_COLOR_OPTIONS : UMINEKO2_BIG_COLOR_OPTIONS
);

const createEmptyBonusDraft = () => ({
  trigger: '',
  bonusType: '',
  bonusColor: ''
});

export const UminekoInferenceFields = ({
  input,
  handleFieldChange,
  adjustField,
  clearField,
  addListEntry,
  removeListEntry,
  showTopCounters = true
}) => {
  const [pendingClearField, setPendingClearField] = useState(null);
  const [bonusDraft, setBonusDraft] = useState(createEmptyBonusDraft);
  const [truthPointDraft, setTruthPointDraft] = useState(UMINEKO2_TRUTH_POINT_OPTIONS[0]);
  const [isSpecialBonusModalOpen, setIsSpecialBonusModalOpen] = useState(false);
  const [isTruthPointModalOpen, setIsTruthPointModalOpen] = useState(false);
  const [isLevel2NaviModalOpen, setIsLevel2NaviModalOpen] = useState(false);

  const derivedArtGames = (
    (Number(input.artLevel1Count || 0) * 30) +
    (Number(input.artLevel2Count || 0) * 50) +
    (Number(input.artLevel3Count || 0) * 90)
  );

  const requestClearField = (name, label) => {
    if (input[name] === '' || input[name] === null || input[name] === undefined) {
      return;
    }
    setPendingClearField({ name, label });
  };

  const handleClearFieldConfirm = () => {
    if (!pendingClearField) return;
    clearField(pendingClearField.name);
    setPendingClearField(null);
  };

  const addSpecialBonus = () => {
    if (!bonusDraft.trigger || !bonusDraft.bonusType || !bonusDraft.bonusColor) {
      return;
    }
    addListEntry('specialBonuses', bonusDraft);
    setBonusDraft(createEmptyBonusDraft());
  };

  const addTruthPointEvent = () => {
    addListEntry('truthPointEvents', { point: truthPointDraft });
  };

  return (
    <div className="space-y-6">
      <Accordion
        title="ボナ系"
        subtitle="総ゲーム数とボーナス回数、特定ボーナスを記録します"
        testId="bonus-accordion"
      >
        <div className="space-y-4">
          {showTopCounters && (
            <div className={compactGridClass}>
              <StepperField
                label="総ゲーム数"
                name="totalGames"
                value={input.totalGames}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-10, -1, 1, 10]}
                compact
                showAdjust={false}
              />
              <StepperField
                label="BIG回数"
                name="bigCount"
                value={input.bigCount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
                showAdjust={false}
              />
              <StepperField
                label="REG回数"
                name="regCount"
                value={input.regCount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
                showAdjust={false}
              />
            </div>
          )}

          <Accordion title="ボーナス詳細" subtitle="BIGビタとREG中の記録、特定ボーナス履歴をまとめます" testId="bonus-detail-accordion">
            <div className="space-y-4">
              <div className={twoColumnCompactGridClass}>
                <StepperField
                  label="BIGビタ分母"
                  name="bigBitaTrialCount"
                  value={input.bigBitaTrialCount}
                  onChange={handleFieldChange}
                  onAdjust={adjustField}
                  onClear={requestClearField}
                  steps={[-1, 1]}
                  compact
                  showAdjust={false}
                />
                <StepperField
                  label="BIGビタ成功"
                  name="bigBitaSuccessCount"
                  value={input.bigBitaSuccessCount}
                  onChange={handleFieldChange}
                  onAdjust={adjustField}
                  onClear={requestClearField}
                  steps={[-1, 1]}
                  compact
                  showAdjust={false}
                />
                <StepperField
                  label="REGゲーム数"
                  name="regGameCount"
                  value={input.regGameCount}
                  onChange={handleFieldChange}
                  onAdjust={adjustField}
                  onClear={requestClearField}
                  steps={[-1, 1]}
                  compact
                  showAdjust={false}
                />
                <StepperField
                  label="REG斜め青7"
                  name="regDiagonalBlue7Count"
                  value={input.regDiagonalBlue7Count}
                  onChange={handleFieldChange}
                  onAdjust={adjustField}
                  onClear={requestClearField}
                  steps={[-1, 1]}
                  compact
                  showAdjust={false}
                />
              </div>

              <StepperField
                label="REG平行青7"
                name="regParallelBlue7Count"
                value={input.regParallelBlue7Count}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                showAdjust={false}
              />

              <SummaryActionCard
                title="特定ボーナス履歴"
                description="確認できたボーナスを1件ずつ追加します。入力と履歴確認はモーダルで行います。"
                countLabel={`${input.specialBonuses.length}件記録済み`}
                primaryLabel="追加・確認"
                onOpen={() => setIsSpecialBonusModalOpen(true)}
              />
            </div>
          </Accordion>
        </div>
      </Accordion>

      <Accordion
        title="ART系"
        subtitle="ART中の設定差要素を記録します"
        testId="art-accordion"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-slate-800">ARTレベル回数</div>
                <p className="mt-1 text-xs text-slate-500">Lv1=30G / Lv2=50G / Lv3=90G を自動合算します。</p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-right">
                <div className="text-[11px] font-black uppercase text-slate-400">ART合計</div>
                <div className="text-lg font-black text-slate-800">{derivedArtGames.toLocaleString()}G</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <StepperField
                label="Lv1"
                name="artLevel1Count"
                value={input.artLevel1Count}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
              <StepperField
                label="Lv2"
                name="artLevel2Count"
                value={input.artLevel2Count}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
              <StepperField
                label="Lv3"
                name="artLevel3Count"
                value={input.artLevel3Count}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StepperField
              label="ART中共通ベル回数"
              name="artCommonBellCount"
              value={input.artCommonBellCount}
              onChange={handleFieldChange}
              onAdjust={adjustField}
              onClear={requestClearField}
              steps={[-1, 1]}
              compact
            />
            <StepperField
              label="ART中ハズレ回数"
              name="artMissCount"
              value={input.artMissCount}
              onChange={handleFieldChange}
              onAdjust={adjustField}
              onClear={requestClearField}
              steps={[-1, 1]}
              compact
            />
          </div>
        </div>
      </Accordion>

      <Accordion
        title="通常系"
        subtitle="通常時小役と示唆イベントを記録します"
        testId="normal-accordion"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-800">特殊条件</div>
            <p className="mt-1 text-xs text-slate-500">1枚役A/B/C と確定役Aをまとめて記録します。推測反映は今後拡張します。</p>
            <div className={`mt-3 ${twoColumnCompactGridClass}`}>
              <StepperField
                label="1枚役A"
                name="oneRoleACount"
                value={input.oneRoleACount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
              <StepperField
                label="1枚役B"
                name="oneRoleBCount"
                value={input.oneRoleBCount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
              <StepperField
                label="1枚役C"
                name="oneRoleCCount"
                value={input.oneRoleCCount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
              <StepperField
                label="確定役A"
                name="confirmedRoleACount"
                value={input.confirmedRoleACount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-800">ステージチェンジ時のロゴ発光</div>
            <p className="mt-1 text-xs text-slate-500">
              発光なしはサンプルから除外し、ロゴ発光「小 / 大」の内訳だけ記録します。小と大の合計から割合を見ます。
            </p>
            <div className={`mt-3 ${twoColumnCompactGridClass}`}>
              <StepperField
                label="ロゴ発光（小）"
                name="logoFlashSmallCount"
                value={input.logoFlashSmallCount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
              <StepperField
                label="ロゴ発光（大）"
                name="logoFlashLargeCount"
                value={input.logoFlashLargeCount}
                onChange={handleFieldChange}
                onAdjust={adjustField}
                onClear={requestClearField}
                steps={[-1, 1]}
                compact
              />
            </div>
          </div>

          <div className={twoColumnCompactGridClass}>
            <SummaryActionCard
              title="真実ポイント"
              description="周期天井到達時の真実ポイントを1件ずつ記録します。"
              countLabel={`${input.truthPointEvents.length}件記録済み`}
              primaryLabel="追加・確認"
              onOpen={() => setIsTruthPointModalOpen(true)}
            />

            <SummaryActionCard
              title="レベル2ナビ"
              description="契機ごとのART突入リプレイ回数とLv2ナビ発生回数を入力します。"
              countLabel={`${(Number(input.level2NaviSameColorSuccessCount || 0) + Number(input.level2NaviDifferentColorSuccessCount || 0) + Number(input.level2NaviOtherSuccessCount || 0)).toLocaleString()}回発生 / ${(Number(input.level2NaviSameColorTrialCount || 0) + Number(input.level2NaviDifferentColorTrialCount || 0) + Number(input.level2NaviOtherTrialCount || 0)).toLocaleString()}回試行`}
              primaryLabel="追加・確認"
              onOpen={() => setIsLevel2NaviModalOpen(true)}
            />
          </div>
        </div>
      </Accordion>

      {pendingClearField && (
        <ConfirmModal
          title={`${pendingClearField.label} をクリアしますか？`}
          body="この項目は未入力に戻ります。"
          confirmLabel="クリアする"
          onConfirm={handleClearFieldConfirm}
          onCancel={() => setPendingClearField(null)}
        />
      )}

      {isSpecialBonusModalOpen && (
        <EntryModal
          title="特定ボーナス履歴"
          subtitle="当選契機、BB/REG、当選色を1件ずつ残します。"
          countLabel={`${input.specialBonuses.length}件記録済み`}
          onClose={() => setIsSpecialBonusModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-800">特定ボーナスを追加</div>
              <div className="mt-3 space-y-3">
                <LabeledField label="当選契機" fieldId="bonus-trigger-modal">
                  <select
                    value={bonusDraft.trigger}
                    onChange={(event) => setBonusDraft((prev) => ({ ...prev, trigger: event.target.value }))}
                    className={selectClass}
                  >
                    <option value="">選択してください</option>
                    {UMINEKO2_BONUS_TRIGGER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </LabeledField>
                <LabeledField label="BB / REG" fieldId="bonus-type-modal">
                  <select
                    value={bonusDraft.bonusType}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      setBonusDraft((prev) => ({
                        ...prev,
                        bonusType: nextType,
                        bonusColor: ''
                      }));
                    }}
                    className={selectClass}
                  >
                    <option value="">選択してください</option>
                    {UMINEKO2_BONUS_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </LabeledField>
                <LabeledField label="当選色" fieldId="bonus-color-modal">
                  <select
                    value={bonusDraft.bonusColor}
                    onChange={(event) => setBonusDraft((prev) => ({ ...prev, bonusColor: event.target.value }))}
                    className={selectClass}
                    disabled={!bonusDraft.bonusType}
                  >
                    <option value="">選択してください</option>
                    {getBonusColorOptions(bonusDraft.bonusType).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </LabeledField>
                <button
                  type="button"
                  onClick={addSpecialBonus}
                  disabled={!bonusDraft.trigger || !bonusDraft.bonusType || !bonusDraft.bonusColor}
                  className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  このボーナスを1件追加
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {input.specialBonuses.length === 0 && <p className="text-sm text-slate-400">まだありません</p>}
              {input.specialBonuses.map((entry) => (
                <EventCard
                  key={entry.id}
                  title={`${entry.trigger} / ${entry.bonusType} / ${entry.bonusColor}`}
                  onDelete={() => removeListEntry('specialBonuses', entry.id)}
                />
              ))}
            </div>
          </div>
        </EntryModal>
      )}

      {isTruthPointModalOpen && (
        <EntryModal
          title="真実ポイント"
          subtitle="周期天井到達時の真実ポイントを1件ずつ記録します。"
          countLabel={`${input.truthPointEvents.length}件記録済み`}
          onClose={() => setIsTruthPointModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-800">真実ポイントを追加</div>
              <div className="mt-3 space-y-3">
                <LabeledField label="真実ポイント" fieldId="truth-point-modal">
                  <select value={truthPointDraft} onChange={(event) => setTruthPointDraft(event.target.value)} className={selectClass}>
                    {UMINEKO2_TRUTH_POINT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </LabeledField>
                <button type="button" onClick={addTruthPointEvent} className="min-h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-black text-white">
                  このイベントを1件追加
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {input.truthPointEvents.length === 0 && <p className="text-sm text-slate-400">まだありません</p>}
              {input.truthPointEvents.map((entry) => (
                <EventCard
                  key={entry.id}
                  title={`真実ポイント: ${entry.point}`}
                  onDelete={() => removeListEntry('truthPointEvents', entry.id)}
                />
              ))}
            </div>
          </div>
        </EntryModal>
      )}

      {isLevel2NaviModalOpen && (
        <EntryModal
          title="レベル2ナビ"
          subtitle="1geki の設定差に合わせて、契機ごとの試行回数とLv2ナビ発生回数を入力します。"
          countLabel={`${(Number(input.level2NaviSameColorSuccessCount || 0) + Number(input.level2NaviDifferentColorSuccessCount || 0) + Number(input.level2NaviOtherSuccessCount || 0)).toLocaleString()}回発生 / ${(Number(input.level2NaviSameColorTrialCount || 0) + Number(input.level2NaviDifferentColorTrialCount || 0) + Number(input.level2NaviOtherTrialCount || 0)).toLocaleString()}回試行`}
          onClose={() => setIsLevel2NaviModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-800">契機別のLv2ナビ入力</div>
              <p className="mt-1 text-xs text-slate-500">
                同色BB後、異色BB後、RB後・その他ごとに ART突入リプレイ回数 と Lv2ナビ発生回数 を入力します。
              </p>
              <div className="mt-3 space-y-4">
                <div className="rounded-2xl bg-white p-3">
                  <div className="mb-2 text-xs font-black text-slate-700">同色BB後</div>
                  <div className={twoColumnCompactGridClass}>
                    <StepperField
                      label="試行回数"
                      name="level2NaviSameColorTrialCount"
                      value={input.level2NaviSameColorTrialCount}
                      onChange={handleFieldChange}
                      onAdjust={adjustField}
                      onClear={requestClearField}
                      steps={[-1, 1]}
                      compact
                    />
                    <StepperField
                      label="Lv2ナビ発生"
                      name="level2NaviSameColorSuccessCount"
                      value={input.level2NaviSameColorSuccessCount}
                      onChange={handleFieldChange}
                      onAdjust={adjustField}
                      onClear={requestClearField}
                      steps={[-1, 1]}
                      compact
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <div className="mb-2 text-xs font-black text-slate-700">異色BB後</div>
                  <div className={twoColumnCompactGridClass}>
                    <StepperField
                      label="試行回数"
                      name="level2NaviDifferentColorTrialCount"
                      value={input.level2NaviDifferentColorTrialCount}
                      onChange={handleFieldChange}
                      onAdjust={adjustField}
                      onClear={requestClearField}
                      steps={[-1, 1]}
                      compact
                    />
                    <StepperField
                      label="Lv2ナビ発生"
                      name="level2NaviDifferentColorSuccessCount"
                      value={input.level2NaviDifferentColorSuccessCount}
                      onChange={handleFieldChange}
                      onAdjust={adjustField}
                      onClear={requestClearField}
                      steps={[-1, 1]}
                      compact
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <div className="mb-2 text-xs font-black text-slate-700">RB後・その他</div>
                  <div className={twoColumnCompactGridClass}>
                    <StepperField
                      label="試行回数"
                      name="level2NaviOtherTrialCount"
                      value={input.level2NaviOtherTrialCount}
                      onChange={handleFieldChange}
                      onAdjust={adjustField}
                      onClear={requestClearField}
                      steps={[-1, 1]}
                      compact
                    />
                    <StepperField
                      label="Lv2ナビ発生"
                      name="level2NaviOtherSuccessCount"
                      value={input.level2NaviOtherSuccessCount}
                      onChange={handleFieldChange}
                      onAdjust={adjustField}
                      onClear={requestClearField}
                      steps={[-1, 1]}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EntryModal>
      )}
    </div>
  );
};
