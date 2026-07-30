import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  Cpu,
  RefreshCw,
  Save,
  Trash2
} from 'lucide-react';
import { useUmineko2Draft } from '../hooks/useUmineko2Draft.js';
import {
  canSyncSettingInference,
  getSettingInferenceSaveErrorMessage,
  saveSettingInferenceSession
} from '../storage/firestoreStorage.js';
import { InferenceResultCard } from './InferenceResultCard.jsx';
import { StepperField } from './StepperField.jsx';
import {
  UMINEKO2_BIG_COLOR_OPTIONS,
  UMINEKO2_BONUS_TRIGGER_OPTIONS,
  UMINEKO2_BONUS_TYPE_OPTIONS,
  UMINEKO2_LEVEL2_NAVI_OPTIONS,
  UMINEKO2_REG_COLOR_OPTIONS,
  UMINEKO2_TRUTH_POINT_OPTIONS
} from '../config/umineko2.js';

const sectionClass = 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const inputClass = 'h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-indigo-500';
const selectClass = `${inputClass} bg-white`;
const listCardClass = 'rounded-2xl border border-slate-200 bg-slate-50 p-4';
const compactGridClass = 'grid grid-cols-3 gap-2';
const twoColumnCompactGridClass = 'grid grid-cols-2 gap-2';

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

const getBonusColorOptions = (bonusType) => (
  bonusType === 'REG' ? UMINEKO2_REG_COLOR_OPTIONS : UMINEKO2_BIG_COLOR_OPTIONS
);

const getSupportedLabels = (usedMetrics) => usedMetrics.map((metric) => metric.label).join(' / ');
const createDefaultBonusDraft = () => ({
  trigger: UMINEKO2_BONUS_TRIGGER_OPTIONS[0],
  bonusType: 'BIG',
  bonusColor: UMINEKO2_BIG_COLOR_OPTIONS[0]
});

export const SettingInferenceScreen = () => {
  const {
    input,
    sessionId,
    setSessionId,
    inference,
    handleFieldChange,
    clearField,
    adjustField,
    addListEntry,
    removeListEntry,
    resetDraft
  } = useUmineko2Draft();
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingClearField, setPendingClearField] = useState(null);
  const [bonusDraft, setBonusDraft] = useState(createDefaultBonusDraft);
  const [truthPointDraft, setTruthPointDraft] = useState(UMINEKO2_TRUTH_POINT_OPTIONS[0]);
  const [level2NaviDraft, setLevel2NaviDraft] = useState(UMINEKO2_LEVEL2_NAVI_OPTIONS[0]);

  const syncEnabled = canSyncSettingInference();
  const supportedMetricLabels = useMemo(() => getSupportedLabels(inference.usedMetrics), [inference.usedMetrics]);

  const handleSave = async () => {
    setSaveMessage('');
    setSaveError('');

    if (!syncEnabled) {
      setSaveError('Googleログイン済みのときだけFirestoreへ保存できます');
      return;
    }

    if (inference.errors.length > 0 || !inference.result) {
      setSaveError('入力エラーを解消してから保存してください');
      return;
    }

    setIsSaving(true);
    try {
      const nextSessionId = await saveSettingInferenceSession({
        sessionId,
        input,
        result: inference.result
      });
      setSessionId(nextSessionId);
      setSaveMessage('Firestoreへ保存しました');
    } catch (error) {
      setSaveError(getSettingInferenceSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const addSpecialBonus = () => {
    addListEntry('specialBonuses', bonusDraft);
    setBonusDraft(createDefaultBonusDraft());
  };

  const addTruthPointEvent = () => {
    addListEntry('truthPointEvents', { point: truthPointDraft });
  };

  const addLevel2NaviEvent = () => {
    addListEntry('level2NaviEvents', { pattern: level2NaviDraft });
  };

  const handleResetConfirm = () => {
    resetDraft();
    setShowResetConfirm(false);
    setBonusDraft(createDefaultBonusDraft());
    setSaveMessage('');
    setSaveError('');
  };

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

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">入力</h3>
            <p className="mt-1 text-xs text-slate-500">未入力は除外、0 は実測値として扱います。入力内容は自動保存されます。</p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600"
          >
            入力をリセット
          </button>
        </div>
      </section>

      <Accordion
        title="ボナ系"
        subtitle="総ゲーム数とボーナス回数、特定ボーナスを記録します"
        defaultOpen
        testId="bonus-accordion"
      >
        <div className="space-y-4">
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
            />
          </div>

          <Accordion title="ボーナス詳細" subtitle="BIGビタとREG中の記録、特定ボーナス履歴をまとめます" defaultOpen testId="bonus-detail-accordion">
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
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-black text-slate-800">特定ボーナスを追加</div>
                <div className="mt-3 space-y-3">
                  <LabeledField label="当選契機" fieldId="bonus-trigger">
                    <select
                      value={bonusDraft.trigger}
                      onChange={(event) => setBonusDraft((prev) => ({ ...prev, trigger: event.target.value }))}
                      className={selectClass}
                    >
                      {UMINEKO2_BONUS_TRIGGER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </LabeledField>
                  <LabeledField label="BB / REG" fieldId="bonus-type">
                    <select
                      value={bonusDraft.bonusType}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        setBonusDraft((prev) => ({
                          ...prev,
                          bonusType: nextType,
                          bonusColor: getBonusColorOptions(nextType)[0]
                        }));
                      }}
                      className={selectClass}
                    >
                      {UMINEKO2_BONUS_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </LabeledField>
                  <LabeledField label="当選色" fieldId="bonus-color">
                    <select
                      value={bonusDraft.bonusColor}
                      onChange={(event) => setBonusDraft((prev) => ({ ...prev, bonusColor: event.target.value }))}
                      className={selectClass}
                    >
                      {getBonusColorOptions(bonusDraft.bonusType).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </LabeledField>
                  <button type="button" onClick={addSpecialBonus} className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-black text-white">
                    このボーナスを1件追加
                  </button>
                </div>
              </div>

              <Accordion title={`特定ボーナス履歴 (${input.specialBonuses.length})`} subtitle="確認できたボーナスだけ積み上げます" testId="special-bonus-history">
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
              </Accordion>
            </div>
          </Accordion>
        </div>
      </Accordion>

      <Accordion
        title="ART系"
        subtitle="ART中の設定差要素を記録します"
        defaultOpen
        testId="art-accordion"
      >
        <div className="space-y-4">
          <div className={compactGridClass}>
            <StepperField
              label="ARTゲーム数"
              name="artGames"
              value={input.artGames}
              onChange={handleFieldChange}
              onAdjust={adjustField}
              onClear={requestClearField}
              steps={[-10, -1, 1, 10]}
              hint="ART分母"
              compact
            />
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
        defaultOpen
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-800">特殊条件</div>
              <p className="mt-1 text-xs text-slate-500">周期天井到達時の真実ポイントを1件ずつ記録します。</p>
              <div className="mt-3 space-y-3">
                <select value={truthPointDraft} onChange={(event) => setTruthPointDraft(event.target.value)} className={selectClass}>
                  {UMINEKO2_TRUTH_POINT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <button type="button" onClick={addTruthPointEvent} className="min-h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-black text-white">
                  このイベントを1件追加
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-800">特殊条件</div>
              <p className="mt-1 text-xs text-slate-500">レベル2ナビ発生抽選のパターンを1件ずつ記録します。</p>
              <div className="mt-3 space-y-3">
                <select value={level2NaviDraft} onChange={(event) => setLevel2NaviDraft(event.target.value)} className={selectClass}>
                  {UMINEKO2_LEVEL2_NAVI_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <button type="button" onClick={addLevel2NaviEvent} className="min-h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-black text-white">
                  このイベントを1件追加
                </button>
              </div>
            </div>
          </div>

          <div className={twoColumnCompactGridClass}>
            <Accordion title={`真実ポイント履歴 (${input.truthPointEvents.length})`} subtitle="到達したポイントを1回ごとに残します">
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
            </Accordion>

            <Accordion title={`レベル2ナビ履歴 (${input.level2NaviEvents.length})`} subtitle="確認できたナビを1回ごとに残します">
              <div className="space-y-3">
                {input.level2NaviEvents.length === 0 && <p className="text-sm text-slate-400">まだありません</p>}
                {input.level2NaviEvents.map((entry) => (
                  <EventCard
                    key={entry.id}
                    title={`レベル2ナビ: ${entry.pattern}`}
                    onDelete={() => removeListEntry('level2NaviEvents', entry.id)}
                  />
                ))}
              </div>
            </Accordion>
          </div>
        </div>
      </Accordion>

      <section className={sectionClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">推定結果</h3>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <Save size={16} />
              {isSaving ? '保存中...' : 'Firestoreへ保存'}
            </span>
          </button>
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          現在の確率計算に反映している項目:
          <span className="ml-2 font-black text-slate-800">{supportedMetricLabels || 'なし'}</span>
        </div>

        {!syncEnabled && (
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Googleログイン済みの場合のみ保存・同期できます。未ログイン時も入力と推測、ドラフト保存は利用できます。
          </p>
        )}
        {saveMessage && <p className="mt-3 text-sm font-bold text-emerald-600">{saveMessage}</p>}
        {saveError && <p className="mt-3 text-sm font-bold text-rose-600">{saveError}</p>}
        {saveError.includes('settingInferences') && (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            反映先: `users/{'{'}userIdentifier{'}'}/settingInferences/{'{'}sessionId{'}'}`。GitHub Pages の再デプロイでは直らないため、Firestore ルールの公開が必要です。
          </p>
        )}

        <div className="mt-4">
          <InferenceResultCard inference={inference} />
        </div>
      </section>

      <section className={`${sectionClass} bg-slate-50`}>
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-slate-500" />
          <h3 className="text-sm font-black text-slate-700">ドラフト保存</h3>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          入力内容は `localStorage` に自動保存されます。ボーナス履歴や示唆イベントも再読込後に復元されます。
        </p>
      </section>

      {showResetConfirm && (
        <ConfirmModal
          title="入力をリセットしますか？"
          body="現在のドラフト入力、追加済みのボーナス履歴、示唆イベントもすべて初期化されます。"
          confirmLabel="リセットする"
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {pendingClearField && (
        <ConfirmModal
          title={`${pendingClearField.label} をクリアしますか？`}
          body="この項目は未入力に戻ります。"
          confirmLabel="クリアする"
          onConfirm={handleClearFieldConfirm}
          onCancel={() => setPendingClearField(null)}
        />
      )}
    </div>
  );
};
