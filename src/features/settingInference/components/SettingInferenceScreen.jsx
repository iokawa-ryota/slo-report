import React, { useMemo, useState } from 'react';
import {
  Cpu,
  RefreshCw,
  Save
} from 'lucide-react';
import { useUmineko2Draft } from '../hooks/useUmineko2Draft.js';
import {
  canSyncSettingInference,
  getSettingInferenceSaveErrorMessage,
  saveSettingInferenceSession
} from '../storage/firestoreStorage.js';
import { InferenceResultCard } from './InferenceResultCard.jsx';
import { UminekoInferenceFields } from './UminekoInferenceFields.jsx';

const sectionClass = 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';

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

const getSupportedLabels = (usedMetrics) => usedMetrics.map((metric) => metric.label).join(' / ');

export const SettingInferenceScreen = ({
  initialOverride = null,
  linkedRecordId = null,
  linkedRecordDate = null
}) => {
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
  } = useUmineko2Draft(initialOverride);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
        result: inference.result,
        linkedRecordId,
        linkedRecordDate
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

  const handleResetConfirm = () => {
    resetDraft();
    setShowResetConfirm(false);
    setSaveMessage('');
    setSaveError('');
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">入力</h3>
            <p className="mt-1 text-xs text-slate-500">未入力は除外、0 は実測値として扱います。入力内容は自動保存されます。</p>
            {linkedRecordId && (
              <p className="mt-2 text-xs font-bold text-indigo-600">
                連携中の収支レコード: {linkedRecordDate || '日付なし'} / {linkedRecordId}
              </p>
            )}
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

      <UminekoInferenceFields
        input={input}
        handleFieldChange={handleFieldChange}
        adjustField={adjustField}
        clearField={clearField}
        addListEntry={addListEntry}
        removeListEntry={removeListEntry}
      />

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

    </div>
  );
};
