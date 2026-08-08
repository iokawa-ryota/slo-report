import React from 'react';

const baseButtonClass = 'min-h-11 min-w-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-black text-sm active:scale-[0.98]';

export const StepperField = ({
  label,
  name,
  value,
  onChange,
  onAdjust,
  onClear,
  steps,
  hint,
  compact = false,
  showAdjust = true
}) => (
  <div className={`min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-3.5' : 'p-4'}`}>
    <div className={`gap-3 ${compact ? 'flex items-start justify-between' : 'flex items-start justify-between'}`}>
      <div className="min-w-0 flex-1">
        <label htmlFor={name} className={`block font-black text-slate-700 ${compact ? 'text-[13px] leading-snug' : 'text-xs'}`}>{label}</label>
        {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onClear(name, label)}
        className={`shrink-0 rounded-xl px-2.5 font-bold text-slate-500 ${compact ? 'min-h-8 text-[11px]' : 'min-h-11 text-[11px]'}`}
      >
        クリア
      </button>
    </div>

    <div className="mt-3">
      <input
        id={name}
        name={name}
        inputMode="numeric"
        type="text"
        value={value}
        onChange={onChange}
        placeholder="未入力"
        className={`w-full rounded-xl border border-slate-200 px-3 text-center font-black outline-none focus:border-indigo-500 ${compact ? 'h-12 text-[17px]' : 'h-12 px-4 text-lg'}`}
      />
    </div>

    {showAdjust && (
      <div className={`mt-3 grid gap-2 ${compact && steps.length > 2 ? 'grid-cols-2 min-[520px]:grid-cols-4' : steps.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {steps.map((step) => {
          const prefix = step > 0 ? '+' : '';
          return (
            <button
              key={step}
              type="button"
              onClick={() => onAdjust(name, step)}
              className={`${baseButtonClass} ${compact ? 'min-h-11 min-w-0 px-0 text-sm' : ''}`}
            >
              {`${prefix}${step}`}
            </button>
          );
        })}
      </div>
    )}
  </div>
);
