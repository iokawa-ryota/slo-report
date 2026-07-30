import React, { useState } from 'react';
import { Cloud, CloudOff, Cpu, RefreshCw, Save } from 'lucide-react';
import { useUmineko2Draft } from '../hooks/useUmineko2Draft.js';
import { canSyncSettingInference, saveSettingInferenceSession } from '../storage/firestoreStorage.js';
import { InferenceResultCard } from './InferenceResultCard.jsx';
import { StepperField } from './StepperField.jsx';

const sectionClass = 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';

export const SettingInferenceScreen = () => {
  const {
    input,
    sessionId,
    setSessionId,
    inference,
    handleFieldChange,
    clearField,
    adjustField,
    resetDraft
  } = useUmineko2Draft();
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const syncEnabled = canSyncSettingInference();

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
      setSaveError(error.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${sectionClass} bg-slate-900 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-indigo-300">Setting Inference</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">うみねこのなく頃に2</h2>
            <p className="mt-2 text-sm text-slate-300">
              Phase 1 は BIG / REG / ART中共通ベル / ART中ハズレのみで推測します。
            </p>
          </div>
          <div className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${syncEnabled ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>
            {syncEnabled ? <Cloud size={16} /> : <CloudOff size={16} />}
            {syncEnabled ? 'Firestore保存可' : 'ローカル利用中'}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">入力</h3>
            <p className="mt-1 text-xs text-slate-500">未入力は除外、0 は実測値として使います。</p>
          </div>
          <button
            type="button"
            onClick={resetDraft}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600"
          >
            入力をリセット
          </button>
        </div>

        <div className="mt-4 space-y-3" data-testid="setting-inference-fields">
          <StepperField
            label="総ゲーム数"
            name="totalGames"
            value={input.totalGames}
            onChange={handleFieldChange}
            onAdjust={adjustField}
            onClear={clearField}
            steps={[-1, 1]}
          />
          <StepperField
            label="BIG回数"
            name="bigCount"
            value={input.bigCount}
            onChange={handleFieldChange}
            onAdjust={adjustField}
            onClear={clearField}
            steps={[-1, 1]}
          />
          <StepperField
            label="REG回数"
            name="regCount"
            value={input.regCount}
            onChange={handleFieldChange}
            onAdjust={adjustField}
            onClear={clearField}
            steps={[-1, 1]}
          />
          <StepperField
            label="ARTゲーム数"
            name="artGames"
            value={input.artGames}
            onChange={handleFieldChange}
            onAdjust={adjustField}
            onClear={clearField}
            steps={[-10, -1, 1, 10]}
            hint="ART関連はこの値が未入力または0なら推測対象外です"
          />
          <StepperField
            label="ART中共通ベル回数"
            name="artCommonBellCount"
            value={input.artCommonBellCount}
            onChange={handleFieldChange}
            onAdjust={adjustField}
            onClear={clearField}
            steps={[-1, 1]}
          />
          <StepperField
            label="ART中ハズレ回数"
            name="artMissCount"
            value={input.artMissCount}
            onChange={handleFieldChange}
            onAdjust={adjustField}
            onClear={clearField}
            steps={[-1, 1]}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">推定結果</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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
        </div>

        {!syncEnabled && (
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Googleログイン済みの場合のみ保存・同期できます。未ログイン時も入力と推測、ドラフト保存は利用できます。
          </p>
        )}
        {saveMessage && <p className="mt-3 text-sm font-bold text-emerald-600">{saveMessage}</p>}
        {saveError && <p className="mt-3 text-sm font-bold text-rose-600">{saveError}</p>}

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
          入力中の内容はこの端末の `localStorage` に自動保存されます。ページ再読込後も復元されます。
        </p>
      </section>
    </div>
  );
};
