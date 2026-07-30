import React from 'react';

export const DateFilterPanel = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset
}) => {
  const hasActiveFilter = Boolean(startDate || endDate);

  return (
    <section
      data-ui="date-filter-panel"
      aria-label="期間フィルター"
      className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4"
    >
      <div className="mb-3 text-[10px] font-black uppercase text-slate-500">期間フィルター</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[9px] font-bold text-slate-600">開始日</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold"
          />
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-bold text-slate-600">終了日</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold"
          />
        </div>
        {hasActiveFilter && (
          <div className="sm:col-span-2">
            <button
              onClick={onReset}
              className="w-full rounded-lg bg-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 transition-all hover:bg-slate-300"
            >
              フィルターをリセット
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
