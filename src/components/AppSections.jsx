import React from 'react';
import { Trash2, Calculator, History, TrendingUp, LineChart as LineChartIcon, BarChart as BarChartIcon, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const ChartSection = ({ data, lossType, setLossType }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-500" /> 累計差枚推移 (枚)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="displayDate" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
          <Calculator size={16} className="text-rose-500" /> 損失枚数
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['bar', 'line'].map(t => (
            <button key={t} onClick={() => setLossType(t)} className={`p-1 rounded ${lossType === t ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
              {t === 'bar' ? <BarChartIcon size={14} /> : <LineChartIcon size={14} />}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {lossType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="loss" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="loss" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all text-left ${
      active
        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
        : 'hover:bg-slate-800 text-slate-400 border border-transparent'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

export const StatCard = ({ title, value, color, className = '' }) => (
  <div className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col justify-center min-h-[110px] ${className}`}>
    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{title}</div>
    <div className={`text-xl font-black ${color}`}>{value}</div>
  </div>
);

const DataBox = ({ label, value, color = 'text-slate-600' }) => (
  <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{label}</div>
    <div className={`text-[11px] font-black ${color}`}>{value}</div>
  </div>
);

export const RecordItem = ({ record, recordIndex, onDelete, onEdit }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 group hover:border-indigo-200 transition-all text-left">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${record.profitYen >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {record.profitYen >= 0 ? 'WIN' : 'LOSE'}
        </div>
        <div>
          <div className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            {record.machineName}
            {record.stats?.personal?.techAccuracy && (
              <span className="bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded">
                精度 {record.stats.personal.techAccuracy}%
              </span>
            )}
          </div>
          <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10} /> {record.date}</div>
        </div>
      </div>
      <div className="flex gap-2 opacity-0 lg:group-hover:opacity-100 focus:opacity-100">
        <button onClick={() => onEdit(recordIndex)} className="text-indigo-500 hover:text-indigo-700 transition-colors px-2 py-1 font-bold text-[11px]">編集</button>
        <button onClick={() => onDelete(record.id)} className="text-slate-200 hover:text-rose-500 transition-colors px-2 py-1"><Trash2 size={16} /></button>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      <DataBox label="実践G数" value={`${record.stats?.personal?.games}G`} />
      <DataBox label="ボーナス" value={`B${record.stats?.personal?.big} R${record.stats?.personal?.reg}`} />
      <DataBox label="収支" value={`${record.profitYen.toLocaleString()}円`} color={record.profitYen >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
      <DataBox label="技術ミス" value={`${record.totalMisses || 0}回`} color="text-rose-400" />
      <DataBox label="損失合計" value={`-${record.totalLoss}枚`} color="text-rose-500" />
    </div>
  </div>
);

export const InputSelect = ({ label, name, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 text-sm cursor-pointer">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export const InputPlain = ({ label, name, value, onChange, type = 'number', color = 'text-slate-400', placeholder = '' }) => (
  <div className="space-y-1 w-full">
    {label && <label className={`text-[10px] font-black ${color} uppercase px-1`}>{label}</label>}
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
  </div>
);

const InputWithUnit = ({ label, name, value, onChange, unit, unitName, options }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1">{label}</label>
    <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-200 bg-white focus-within:border-indigo-500 transition-all">
      <input type="number" name={name} value={value} onChange={onChange} className="min-w-0 flex-1 p-3 font-bold outline-none text-sm" />
      <select name={unitName} value={unit} onChange={onChange} className="min-w-[56px] bg-slate-50 px-2.5 font-bold text-xs border-l border-slate-200 cursor-pointer outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </div>
);

export const GamesBonusSection = ({ isMidStart, setIsMidStart, formData, handleInputChange }) => (
  <div id="games-bonus-section" className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-400 uppercase">ゲーム数・ボーナス</span>
      <button type="button" onClick={() => setIsMidStart(!isMidStart)} className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${isMidStart ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>途中打ち設定</button>
    </div>
    {isMidStart && (
      <div id="mid-start-section" className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-200">
        <InputPlain label="開始G" name="startTotalGames" value={formData.startTotalGames} onChange={handleInputChange} />
        <InputPlain label="開始B" name="startBigCount" value={formData.startBigCount} onChange={handleInputChange} />
        <InputPlain label="開始R" name="startRegCount" value={formData.startRegCount} onChange={handleInputChange} />
      </div>
    )}
    <div id="final-games-section" className="grid grid-cols-3 gap-2">
      <InputPlain label="終了総G" name="totalGames" value={formData.totalGames} onChange={handleInputChange} />
      <InputPlain label="終了B" name="bigCount" value={formData.bigCount} onChange={handleInputChange} />
      <InputPlain label="終了R" name="regCount" value={formData.regCount} onChange={handleInputChange} />
    </div>
  </div>
);

export const TechDetailSectionVersusRevise = ({ formData, handleInputChange }) => (
  <div id="tech-detail-section-versus-revise" className="space-y-4">
    <div id="mid-reel-section" className="grid grid-cols-1 gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
      <div className="space-y-3">
        <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">中リール第1停止</label>
        <div id="mid-inputs" className="grid grid-cols-3 gap-2">
          <InputPlain label="スイカ揃い(15枚)" name="midSuccess" placeholder="成功" value={formData.midSuccess} onChange={handleInputChange} />
          <InputPlain label="救済(15枚)" name="midNotWatermelon" placeholder="救済" value={formData.midNotWatermelon} onChange={handleInputChange} color="text-indigo-400" />
          <InputPlain label="失敗(4枚)" name="midMiss" placeholder="失敗" value={formData.midMiss} onChange={handleInputChange} color="text-rose-500" />
        </div>
      </div>
      <div id="right-reel-section" className="space-y-3 pt-2">
        <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">右リール第1停止</label>
        <div id="right-inputs" className="grid grid-cols-2 gap-2">
          <InputPlain label="成功(15枚)" name="rightSuccess" placeholder="成功" value={formData.rightSuccess} onChange={handleInputChange} />
          <InputPlain label="失敗(4枚)" name="rightMiss" placeholder="失敗" value={formData.rightMiss} onChange={handleInputChange} color="text-rose-500" />
        </div>
      </div>
    </div>
  </div>
);

export const TechDetailSectionHanabi = ({ formData, handleInputChange }) => (
  <div id="tech-detail-section-hanabi" className="space-y-4">
    <div id="mid-reel-section" className="grid grid-cols-1 gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
      <div className="space-y-3">
        <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">中リール第1停止</label>
        <div id="mid-inputs" className="grid grid-cols-3 gap-2">
          <InputPlain label="氷揃い(15枚)" name="midSuccess" placeholder="成功" value={formData.midSuccess} onChange={handleInputChange} />
          <InputPlain label="救済(15枚)" name="midNotWatermelon" placeholder="救済" value={formData.midNotWatermelon} onChange={handleInputChange} color="text-indigo-400" />
          <InputPlain label="失敗(4枚)" name="midMiss" placeholder="失敗" value={formData.midMiss} onChange={handleInputChange} color="text-rose-500" />
        </div>
      </div>
      <div id="right-reel-section" className="space-y-3 pt-2">
        <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">右リール第1停止</label>
        <div id="right-inputs" className="grid grid-cols-2 gap-2">
          <InputPlain label="成功(15枚)" name="rightSuccess" placeholder="成功" value={formData.rightSuccess} onChange={handleInputChange} />
          <InputPlain label="失敗(4枚)" name="rightMiss" placeholder="失敗" value={formData.rightMiss} onChange={handleInputChange} color="text-rose-500" />
        </div>
      </div>
    </div>
  </div>
);

export const TechDetailSectionLHanabi = ({ formData, handleInputChange }) => (
  <div id="tech-detail-section-l-hanabi" className="space-y-4">
    <div id="right-reel-section" className="grid grid-cols-1 gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
      <div className="space-y-3">
        <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">右リール第1停止</label>
        <div id="right-inputs" className="grid grid-cols-2 gap-2">
          <InputPlain label="成功(15枚)" name="rightSuccess" placeholder="成功" value={formData.rightSuccess} onChange={handleInputChange} />
          <InputPlain label="失敗(4枚)" name="rightMiss" placeholder="失敗" value={formData.rightMiss} onChange={handleInputChange} color="text-rose-500" />
        </div>
      </div>
    </div>
  </div>
);

export const TechDetailSectionOther = () => (
  <div id="tech-detail-section-other" className="space-y-4">
    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
      <p className="text-[11px] text-slate-500 text-center">この機種は技術介入の詳細トラッキングに対応していません。簡易モードで記録してください。</p>
    </div>
  </div>
);

export const SmallRoleLossSection = ({ currentConfig, formData, handleInputChange }) => (
  <div id="small-role-loss-section" className="bg-rose-50 p-4 rounded-2xl border border-rose-100 grid grid-cols-3 gap-2">
    <InputPlain label={`${currentConfig.watermelonName}欠損`} name="watermelonLossCount" value={formData.watermelonLossCount} onChange={handleInputChange} color="text-rose-400" />
    <InputPlain label={`${currentConfig.cherryName}欠損`} name="cherryLossCount" value={formData.cherryLossCount} onChange={handleInputChange} color="text-rose-400" />
    <InputPlain label="他損失(枚)" name="otherLossCount" value={formData.otherLossCount} onChange={handleInputChange} color="text-rose-400" />
  </div>
);

export const InvestmentRecoverySection = ({ formData, handleInputChange }) => (
  <div id="investment-recovery-section" className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <InputWithUnit label="投資" name="investment" value={formData.investment} onChange={handleInputChange} unit={formData.investmentUnit} unitName="investmentUnit" options={['円', '枚']} />
      <InputWithUnit label="回収" name="recovery" value={formData.recovery} onChange={handleInputChange} unit={formData.recoveryUnit} unitName="recoveryUnit" options={['枚', '円']} />
    </div>
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2">貸玉レート</label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: '20', label: '20スロ' },
          { value: '10', label: '10スロ' },
          { value: '5', label: '5スロ' }
        ].map(rate => (
          <button
            key={rate.value}
            onClick={() => handleInputChange({ target: { name: 'lendingRate', value: rate.value } })}
            className={`px-2 py-2.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              formData.lendingRate === rate.value
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {rate.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const RecentHistorySection = ({ records, onEdit }) => {
  const recentRecords = records.slice(0, 5);

  if (recentRecords.length === 0) {
    return (
      <div id="recent-history-section" className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
          <History size={16} />
          直近5件の履歴
        </h3>
        <p className="text-[11px] text-slate-400 text-center py-4">記録はまだありません</p>
      </div>
    );
  }

  return (
    <div id="recent-history-section" className="mt-8 space-y-3">
      <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
        <History size={16} />
        直近5件の履歴
      </h3>
      <div className="space-y-2">
        {recentRecords.map((record, index) => {
          const lRate = Number(record.lendingRate || 20);
          const invMedals = record.investmentUnit === '枚' ? Number(record.investment) : Number(record.investment) / lRate;
          const recMedals = record.recoveryUnit === '枚' ? Number(record.recovery) : Number(record.recovery) / (lRate * 50 / Number(record.exchangeRate));
          const diffMedals = Math.floor(recMedals - invMedals);
          const diffYen = Math.floor(diffMedals * lRate);
          const isProfit = diffMedals >= 0;

          return (
            <div key={index} className="p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => onEdit(index)}>
                  <p className="text-[11px] font-bold text-slate-700">{record.date} - {record.machineName}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    投資: {record.investment}{record.investmentUnit} / 回収: {record.recovery}{record.recoveryUnit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-[12px] font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isProfit ? '+' : ''}{diffMedals} 枚
                    </p>
                    <p className={`text-[11px] font-semibold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isProfit ? '+' : ''}{diffYen.toLocaleString()} 円
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(index)}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold hover:bg-indigo-200 whitespace-nowrap"
                  >
                    編集
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
