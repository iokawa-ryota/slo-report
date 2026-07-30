import React from 'react';

const ResultBar = ({ label, percentage, emphasized = false }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm font-black ${emphasized ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</span>
      <span className={`text-sm font-black ${emphasized ? 'text-indigo-700' : 'text-slate-500'}`}>{percentage.toFixed(1)}%</span>
    </div>
    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full ${emphasized ? 'bg-indigo-600' : 'bg-slate-400'}`}
        style={{ width: `${Math.min(100, percentage)}%` }}
      />
    </div>
  </div>
);

export const InferenceResultCard = ({ inference }) => {
  if (inference.errors.length > 0) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 sm:p-5">
        <h3 className="text-sm font-black text-rose-700">入力エラー</h3>
        <ul className="mt-3 space-y-2 text-sm text-rose-700">
          {inference.errors.map((error) => (
            <li key={error}>- {error}</li>
          ))}
        </ul>
      </section>
    );
  }

  const result = inference.result;
  if (!result) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-2xl bg-indigo-50 p-4">
          <div className="text-[11px] font-black text-indigo-500 uppercase">最有力設定</div>
          <div className="mt-1 text-3xl font-black text-indigo-700">設定{result.mostLikelySetting}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-[11px] font-black text-slate-400 uppercase">設定4以上</div>
            <div className="mt-1 text-xl font-black text-slate-700">{result.percentageOverEqual4.toFixed(1)}%</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-[11px] font-black text-slate-400 uppercase">設定5以上</div>
            <div className="mt-1 text-xl font-black text-slate-700">{result.percentageOverEqual5.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {result.probabilities.map((item) => (
          <ResultBar
            key={item.setting}
            label={`設定${item.setting}`}
            percentage={item.percentage}
            emphasized={item.setting === result.mostLikelySetting}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="text-[11px] font-black text-emerald-600 uppercase">使用項目</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {inference.usedMetrics.length > 0 ? inference.usedMetrics.map((metric) => (
              <span key={metric.key} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                {metric.label}
              </span>
            )) : (
              <span className="text-sm text-emerald-700">なし</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-[11px] font-black text-slate-500 uppercase">除外項目</div>
          <div className="mt-2 space-y-2">
            {inference.excludedMetrics.map((metric) => (
              <div key={`${metric.key}-${metric.reason}`} className="text-xs font-semibold text-slate-600">
                {metric.label}: {metric.reason}
              </div>
            ))}
          </div>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-[11px] font-black text-amber-600 uppercase">サンプル不足警告</div>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {result.warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
