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
  hint
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <label htmlFor={name} className="block text-xs font-black text-slate-700">{label}</label>
        {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onClear(name)}
        className="min-h-11 rounded-xl px-3 text-[11px] font-bold text-slate-500"
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
        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-center text-lg font-black outline-none focus:border-indigo-500"
      />
    </div>

    <div className={`mt-3 grid gap-2 ${steps.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
      {steps.map((step) => {
        const prefix = step > 0 ? '+' : '';
        return (
          <button
            key={step}
            type="button"
            onClick={() => onAdjust(name, step)}
            className={baseButtonClass}
          >
            {`${prefix}${step}`}
          </button>
        );
      })}
    </div>
  </div>
);
