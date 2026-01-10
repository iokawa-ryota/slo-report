import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, 
  Target, 
  Trash2,
  Calculator,
  History,
  TrendingUp,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  LayoutDashboard,
  Menu,
  X,
  Layers,
  Calendar
} from 'lucide-react';
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
import { MACHINE_CONFIG, MACHINE_OPTIONS } from './config/machineConfig';

const App = () => {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('pachislo-records-v8');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pachislo-records-v8', JSON.stringify(records));
  }, [records]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMachineTab, setSelectedMachineTab] = useState(MACHINE_OPTIONS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calcMode, setCalcMode] = useState('detail'); 
  const [isMidStart, setIsMidStart] = useState(false); 
  const [lossChartType, setLossChartType] = useState('bar'); 

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    machineName: MACHINE_OPTIONS[0],
    totalGames: '',
    bigCount: '',
    regCount: '',
    startTotalGames: '0',
    startBigCount: '0',
    startRegCount: '0',
    investment: '',
    investmentUnit: '円',
    recovery: '',
    recoveryUnit: '枚',
    lendingRate: '20',
    exchangeRate: '50',
    techMissCount: '', 
    techAttemptCount: '',
    midSuccess: '',
    midNotWatermelon: '',
    midMiss: '',
    rightSuccess: '',
    rightMiss: '',
    watermelonLossCount: '0',
    cherryLossCount: '0',
    otherLossCount: '0',
    memo: ''
  });

  const currentConfig = MACHINE_CONFIG[formData.machineName] || MACHINE_CONFIG['その他'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getChartDataForRecords = (targetRecords) => {
    const sorted = [...targetRecords].reverse();
    let cumulativeProfit = 0;
    return sorted.map((r) => {
      const lRate = Number(r.lendingRate || 20);
      const invMedals = r.investmentUnit === '枚' ? Number(r.investment) : Number(r.investment) / lRate;
      const recMedals = r.recoveryUnit === '枚' ? Number(r.recovery) : Number(r.recovery) / (lRate * 50 / Number(r.exchangeRate));
      const diffMedals = Math.floor(recMedals - invMedals);
      cumulativeProfit += diffMedals;
      
      return {
        name: r.date,
        diff: diffMedals,
        cumulative: cumulativeProfit,
        loss: r.totalLoss || 0,
        displayDate: r.date.split('-').slice(1).join('/')
      };
    });
  };

  const dashboardChartData = useMemo(() => getChartDataForRecords(records), [records]);
  
  const machineSpecificData = useMemo(() => {
    const filtered = records.filter(r => r.machineName === selectedMachineTab);
    return {
      records: filtered,
      chart: getChartDataForRecords(filtered),
      stats: {
        yen: filtered.reduce((acc, r) => acc + r.profitYen, 0),
        loss: filtered.reduce((acc, r) => acc + (r.totalLoss || 0), 0),
        games: filtered.reduce((acc, r) => acc + (r.stats?.personal?.games || 0), 0),
        big: filtered.reduce((acc, r) => acc + (r.stats?.personal?.big || 0), 0),
        reg: filtered.reduce((acc, r) => acc + (r.stats?.personal?.reg || 0), 0),
      }
    };
  }, [records, selectedMachineTab]);

  const totalStats = useMemo(() => {
    const yen = records.reduce((acc, r) => acc + r.profitYen, 0);
    const loss = records.reduce((acc, r) => acc + (r.totalLoss || 0), 0);
    const games = records.reduce((acc, r) => acc + (r.stats?.personal?.games || 0), 0);
    return { yen, loss, games };
  }, [records]);

  const inputStats = useMemo(() => {
    const g_end = Number(formData.totalGames) || 0;
    const b_end = Number(formData.bigCount) || 0;
    const r_end = Number(formData.regCount) || 0;
    const g_start = isMidStart ? Number(formData.startTotalGames || 0) : 0;
    const b_start = isMidStart ? Number(formData.startBigCount || 0) : 0;
    const r_start = isMidStart ? Number(formData.startRegCount || 0) : 0;
    const myGames = Math.max(0, g_end - g_start);
    const myBig = Math.max(0, b_end - b_start);
    const myReg = Math.max(0, r_end - r_start);
    const calcProb = (g, c) => (c > 0 ? (g / c).toFixed(1) : '-');

    let accuracy = null;
    if (calcMode === 'simple') {
      const misses = Number(formData.techMissCount || 0);
      const attempts = Number(formData.techAttemptCount || 0);
      if (attempts > 0) accuracy = (((attempts - misses) / attempts) * 100).toFixed(1);
    } else {
      const midS = Number(formData.midSuccess || 0);
      const midN = Number(formData.midNotWatermelon || 0);
      const midM = Number(formData.midMiss || 0);
      const rightS = Number(formData.rightSuccess || 0);
      const rightM = Number(formData.rightMiss || 0);
      
      const requiredAttempts = midS + midM + rightS + rightM;
      if (requiredAttempts > 0) {
        accuracy = (((midS + rightS) / requiredAttempts) * 100).toFixed(1);
      }
    }

    return {
      personal: {
        games: myGames, big: myBig, reg: myReg,
        bigProb: calcProb(myGames, myBig),
        regProb: calcProb(myGames, myReg),
        combinedProb: calcProb(myGames, myBig + myReg),
        techAccuracy: accuracy
      }
    };
  }, [formData, isMidStart, calcMode]);

  const calculatedLoss = useMemo(() => {
    let techLoss = 0;
    let totalMisses = 0;
    if (calcMode === 'simple') {
      totalMisses = Number(formData.techMissCount || 0);
      techLoss = totalMisses * currentConfig.techLossPerMiss;
    } else if (calcMode === 'detail') {
      totalMisses = Number(formData.midMiss || 0) + Number(formData.rightMiss || 0);
      techLoss = totalMisses * currentConfig.techLossPerMiss;
    }
    const wmLoss = Number(formData.watermelonLossCount || 0) * currentConfig.watermelonLoss;
    const chLoss = Number(formData.cherryLossCount || 0) * currentConfig.cherryLoss;
    return { 
      total: techLoss + wmLoss + chLoss + Number(formData.otherLossCount || 0),
      misses: totalMisses
    };
  }, [formData, currentConfig, calcMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const lRate = Number(formData.lendingRate);
    const eRate = Number(formData.exchangeRate);
    const invYen = formData.investmentUnit === '円' ? Number(formData.investment) : Number(formData.investment) * lRate;
    const recYen = formData.recoveryUnit === '円' ? Number(formData.recovery) : Math.floor(Number(formData.recovery) * ((lRate * 50) / eRate));
    
    const newRecord = {
      ...formData,
      id: Date.now(),
      profitYen: recYen - invYen,
      totalLoss: calculatedLoss.total,
      totalMisses: calculatedLoss.misses,
      stats: inputStats,
      calcMode: calcMode
    };

    setRecords([newRecord, ...records]);
    setShowForm(false);
    setFormData(prev => ({
      ...prev, 
      totalGames: '', bigCount: '', regCount: '', investment: '', recovery: '', 
      techMissCount: '', techAttemptCount: '', 
      midSuccess: '', midNotWatermelon: '', midMiss: '', rightSuccess: '', rightMiss: '',
      watermelonLossCount: '0', cherryLossCount: '0', otherLossCount: '0'
    }));
  };

  const deleteRecord = (id) => {
    if (window.confirm('削除しますか？')) setRecords(records.filter(r => r.id !== id));
  };

  const ChartSection = ({ data, lossType, setLossType }) => (
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

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 relative">
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Target className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-black text-white tracking-tighter">VERSUS<br/><span className="text-indigo-400">ANALYZER</span></h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1">
            <NavItem icon={<LayoutDashboard size={18}/>} label="総合ダッシュボード" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setIsSidebarOpen(false);}} />
            <div className="pt-4 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">機種別統計</div>
            {MACHINE_OPTIONS.map(m => (
              <NavItem 
                key={m} 
                icon={<Layers size={18}/>} 
                label={m} 
                active={activeTab === 'machine-stats' && selectedMachineTab === m} 
                onClick={() => {setActiveTab('machine-stats'); setSelectedMachineTab(m); setIsSidebarOpen(false);}} 
              />
            ))}
            <div className="pt-4 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">その他</div>
            <NavItem icon={<History size={18}/>} label="全履歴一覧" active={activeTab === 'history'} onClick={() => {setActiveTab('history'); setIsSidebarOpen(false);}} />
          </nav>

          <div className="pt-6 border-t border-slate-800 text-[10px] text-slate-500 font-bold text-center">
            v9.0.0 - Vite + React
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <div className="font-black text-slate-800 text-sm flex items-center gap-2">
              {activeTab === 'dashboard' && '総合ダッシュボード'}
              {activeTab === 'machine-stats' && `機種統計: ${selectedMachineTab}`}
              {activeTab === 'history' && '全履歴'}
            </div>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-xs shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <PlusCircle size={16} /> <span className="hidden sm:inline">データ入力</span>
          </button>
        </header>

        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="全機種 累計収支" value={`${totalStats.yen.toLocaleString()}円`} color={totalStats.yen >= 0 ? "text-emerald-600" : "text-rose-600"} />
                <StatCard title="全機種 累計欠損" value={`-${totalStats.loss.toLocaleString()}枚`} color="text-rose-500" />
                <StatCard title="全機種 総回転数" value={`${totalStats.games.toLocaleString()} G`} color="text-slate-600" />
              </div>
              <ChartSection data={dashboardChartData} lossType={lossChartType} setLossType={setLossChartType} />
            </>
          )}

          {activeTab === 'machine-stats' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="機種別収支" value={`${machineSpecificData.stats.yen.toLocaleString()}円`} color={machineSpecificData.stats.yen >= 0 ? "text-emerald-600" : "text-rose-600"} />
                <StatCard title="技術欠損" value={`-${machineSpecificData.stats.loss.toLocaleString()}枚`} color="text-rose-500" />
                <StatCard title="BIG回数" value={`${machineSpecificData.stats.big}回`} color="text-indigo-600" />
                <StatCard title="REG回数" value={`${machineSpecificData.stats.reg}回`} color="text-indigo-400" />
              </div>
              {machineSpecificData.chart.length > 0 ? (
                <ChartSection data={machineSpecificData.chart} lossType={lossChartType} setLossType={setLossChartType} />
              ) : (
                <div className="bg-white p-12 rounded-3xl text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">データがまだありません</div>
              )}
            </>
          )}

          {(activeTab === 'history' || (activeTab === 'machine-stats' && machineSpecificData.records.length > 0)) && (
            <div className="space-y-4 mt-4 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{activeTab === 'history' ? '全履歴' : `${selectedMachineTab} の履歴`}</h3>
              {(activeTab === 'history' ? records : machineSpecificData.records).map(r => (
                <RecordItem key={r.id} record={r} onDelete={deleteRecord} />
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><PlusCircle className="text-indigo-600"/> 新規実践記録</h2>
                <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600"><X/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputSelect label="機種" name="machineName" value={formData.machineName} onChange={handleInputChange} options={MACHINE_OPTIONS} />
                  <InputPlain label="日付" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                </div>
                
                <GamesBonusSection 
                  isMidStart={isMidStart} 
                  setIsMidStart={setIsMidStart}
                  formData={formData}
                  handleInputChange={handleInputChange}
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputWithUnit label="投資" name="investment" value={formData.investment} onChange={handleInputChange} unit={formData.investmentUnit} unitName="investmentUnit" options={["円", "枚"]} />
                  <InputWithUnit label="回収" name="recovery" value={formData.recovery} onChange={handleInputChange} unit={formData.recoveryUnit} unitName="recoveryUnit" options={["枚", "円"]} />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-700 uppercase">技術介入詳細</h3>
                      {inputStats.personal.techAccuracy && (
                        <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                          精度: {inputStats.personal.techAccuracy}%
                        </span>
                      )}
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg text-[9px] font-bold">
                      <button type="button" onClick={() => setCalcMode('simple')} className={`px-2 py-1 rounded transition-all ${calcMode === 'simple' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>簡易</button>
                      <button type="button" onClick={() => setCalcMode('detail')} className={`px-2 py-1 rounded transition-all ${calcMode === 'detail' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>詳細</button>
                    </div>
                  </div>
                  
                  {calcMode === 'simple' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <InputPlain label="総試行回数" name="techAttemptCount" value={formData.techAttemptCount} onChange={handleInputChange} />
                      <InputPlain label="失敗回数" name="techMissCount" value={formData.techMissCount} onChange={handleInputChange} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">中リール第1停止</label>
                          <div className="grid grid-cols-3 gap-2">
                            <InputPlain label="スイカ揃い(15枚)" name="midSuccess" placeholder="成功" value={formData.midSuccess} onChange={handleInputChange} />
                            <InputPlain label="救済(15枚)" name="midNotWatermelon" placeholder="救済" value={formData.midNotWatermelon} onChange={handleInputChange} color="text-indigo-400" />
                            <InputPlain label="失敗(4枚)" name="midMiss" placeholder="失敗" value={formData.midMiss} onChange={handleInputChange} color="text-rose-500" />
                          </div>
                        </div>
                        <div className="space-y-3 pt-2">
                          <label className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-100 block pb-1">右リール第1停止</label>
                          <div className="grid grid-cols-2 gap-2">
                            <InputPlain label="成功(15枚)" name="rightSuccess" placeholder="成功" value={formData.rightSuccess} onChange={handleInputChange} />
                            <InputPlain label="失敗(4枚)" name="rightMiss" placeholder="失敗" value={formData.rightMiss} onChange={handleInputChange} color="text-rose-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 grid grid-cols-3 gap-2">
                    <InputPlain label={`${currentConfig.watermelonName}零し`} name="watermelonLossCount" value={formData.watermelonLossCount} onChange={handleInputChange} color="text-rose-400" />
                    <InputPlain label={`${currentConfig.cherryName}欠損`} name="cherryLossCount" value={formData.cherryLossCount} onChange={handleInputChange} color="text-rose-400" />
                    <InputPlain label="他損失(枚)" name="otherLossCount" value={formData.otherLossCount} onChange={handleInputChange} color="text-rose-400" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">今回の合計損失</div>
                    <div className="text-xl font-black text-rose-500">-{calculatedLoss.total} 枚</div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm">記録を保存する</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components ---

const NavItem = ({ icon, label, active, onClick }) => (
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

const StatCard = ({ title, value, color, className = "" }) => (
  <div className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col justify-center min-h-[110px] ${className}`}>
    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{title}</div>
    <div className={`text-xl font-black ${color}`}>{value}</div>
  </div>
);

const RecordItem = ({ record, onDelete }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 group hover:border-indigo-200 transition-all text-left">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${record.profitYen >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
          {record.profitYen >= 0 ? "WIN" : "LOSE"}
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
          <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/> {record.date}</div>
        </div>
      </div>
      <button onClick={() => onDelete(record.id)} className="text-slate-200 hover:text-rose-500 transition-colors opacity-0 lg:group-hover:opacity-100 focus:opacity-100 px-2 py-1"><Trash2 size={16}/></button>
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

const DataBox = ({ label, value, color = "text-slate-600" }) => (
  <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{label}</div>
    <div className={`text-[11px] font-black ${color}`}>{value}</div>
  </div>
);

const InputSelect = ({ label, name, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 text-sm cursor-pointer">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const InputPlain = ({ label, name, value, onChange, type = "number", color = "text-slate-400", placeholder = "" }) => (
  <div className="space-y-1 w-full">
    {label && <label className={`text-[10px] font-black ${color} uppercase px-1`}>{label}</label>}
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
  </div>
);

const InputWithUnit = ({ label, name, value, onChange, unit, unitName, options }) => (
  <div className="space-y-1 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase px-1">{label}</label>
    <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white focus-within:border-indigo-500 transition-all">
      <input type="number" name={name} value={value} onChange={onChange} className="flex-1 p-3 font-bold outline-none text-sm" />
      <select name={unitName} value={unit} onChange={onChange} className="bg-slate-50 px-2 font-bold text-[10px] border-l border-slate-200 cursor-pointer outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </div>
);

const GamesBonusSection = ({ isMidStart, setIsMidStart, formData, handleInputChange }) => (
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

export default App;
