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
  Calendar,
  LogOut,
  Loader
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
import { subscribeToRecords, createRecord, updateRecord, deleteRecord as deleteRecordFromDb, migrateFromLocalStorage } from './firebase/db';
import { loginAnonymously, subscribeToAuthState, logout, getCurrentUser, signInWithGoogle } from './firebase/auth';

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [hasMigratedData, setHasMigratedData] = useState(false);

  // Firebase 認証の初期化
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // ローカルストレージからのデータ移行をチェック
        const localData = localStorage.getItem('pachislo-records-v8');
        if (localData && !hasMigratedData) {
          try {
            const records = JSON.parse(localData);
            if (records.length > 0) {
              await migrateFromLocalStorage(records);
              localStorage.removeItem('pachislo-records-v8');
              setHasMigratedData(true);
            }
          } catch (error) {
            console.error('Migration error:', error);
          }
        }
      } else {
        // ユーザーがログインしていない場合はログアウト状態を保つ
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [hasMigratedData]);

  // Firebase からのレコード購読（Googleサインイン済みユーザーのみ）
  useEffect(() => {
    if (user && user.email) {
      // Googleサインイン済み（email が存在する）のみ購読
      const unsubscribe = subscribeToRecords(setRecords);
      return unsubscribe;
    } else if (user && !user.email) {
      // 匿名ユーザーの場合は購読しない
      setRecords([]);
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previousTab, setPreviousTab] = useState('dashboard');
  const [selectedMachineTab, setSelectedMachineTab] = useState(MACHINE_OPTIONS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calcMode, setCalcMode] = useState('detail'); 
  const [isMidStart, setIsMidStart] = useState(false); 
  const [lossChartType, setLossChartType] = useState('bar');
  const [editingIndex, setEditingIndex] = useState(null);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState(''); 

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

  const dashboardChartData = useMemo(() => getChartDataForRecords(filterRecordsByDateRange(records)), [records, dateRangeStart, dateRangeEnd]);
  
  const machineSpecificData = useMemo(() => {
    const allMachineRecords = records.filter(r => r.machineName === selectedMachineTab);
    const filtered = filterRecordsByDateRange(allMachineRecords);
    const techAccuracyValues = filtered
      .map(r => r.stats?.personal?.techAccuracy)
      .filter(v => v !== undefined && v !== null);
    const avgTechAccuracy = techAccuracyValues.length > 0
      ? Math.round(techAccuracyValues.reduce((a, b) => a + b, 0) / techAccuracyValues.length)
      : 0;

    return {
      records: filtered,
      chart: getChartDataForRecords(filtered),
      stats: {
        yen: filtered.reduce((acc, r) => acc + r.profitYen, 0),
        loss: filtered.reduce((acc, r) => acc + (r.totalLoss || 0), 0),
        games: filtered.reduce((acc, r) => acc + (r.stats?.personal?.games || 0), 0),
        big: filtered.reduce((acc, r) => acc + (r.stats?.personal?.big || 0), 0),
        reg: filtered.reduce((acc, r) => acc + (r.stats?.personal?.reg || 0), 0),
        techAccuracy: avgTechAccuracy,
      }
    };
  }, [records, selectedMachineTab, dateRangeStart, dateRangeEnd]);

  function filterRecordsByDateRange(targetRecords) {
    if (!dateRangeStart && !dateRangeEnd) return targetRecords;
    return targetRecords.filter(r => {
      const recordDate = r.date;
      const isAfterStart = !dateRangeStart || recordDate >= dateRangeStart;
      const isBeforeEnd = !dateRangeEnd || recordDate <= dateRangeEnd;
      return isAfterStart && isBeforeEnd;
    });
  }

  const totalStats = useMemo(() => {
    const filteredRecords = filterRecordsByDateRange(records);
    const yen = filteredRecords.reduce((acc, r) => acc + r.profitYen, 0);
    const loss = filteredRecords.reduce((acc, r) => acc + (r.totalLoss || 0), 0);
    const games = filteredRecords.reduce((acc, r) => acc + (r.stats?.personal?.games || 0), 0);
    return { yen, loss, games };
  }, [records, dateRangeStart, dateRangeEnd]);

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
      const useMidInputs = formData.machineName !== 'Lハナビ';
      const midS = useMidInputs ? Number(formData.midSuccess || 0) : 0;
      const midN = useMidInputs ? Number(formData.midNotWatermelon || 0) : 0;
      const midM = useMidInputs ? Number(formData.midMiss || 0) : 0;
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
      const midMiss = formData.machineName === 'Lハナビ' ? 0 : Number(formData.midMiss || 0);
      totalMisses = midMiss + Number(formData.rightMiss || 0);
      techLoss = totalMisses * currentConfig.techLossPerMiss;
    }
    const wmLoss = Number(formData.watermelonLossCount || 0) * currentConfig.watermelonLoss;
    const chLoss = Number(formData.cherryLossCount || 0) * currentConfig.cherryLoss;
    return { 
      total: techLoss + wmLoss + chLoss + Number(formData.otherLossCount || 0),
      misses: totalMisses
    };
  }, [formData, currentConfig, calcMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lRate = Number(formData.lendingRate);
    const eRate = Number(formData.exchangeRate);
    const invYen = formData.investmentUnit === '円' ? Number(formData.investment) : Number(formData.investment) * lRate;
    const recYen = formData.recoveryUnit === '円' ? Number(formData.recovery) : Math.floor(Number(formData.recovery) * ((lRate * 50) / eRate));
    const machineSection = (name => {
      if (name === 'バーサスリヴァイズ') return 'versusRevise';
      if (name === '新ハナビ' || name === 'Lハナビ') return 'hanabi';
      return 'other';
    })(formData.machineName);
    
    const recordData = {
      date: formData.date,
      machineName: formData.machineName,
      totalGames: formData.totalGames,
      bigCount: formData.bigCount,
      regCount: formData.regCount,
      startTotalGames: formData.startTotalGames,
      startBigCount: formData.startBigCount,
      startRegCount: formData.startRegCount,
      investment: formData.investment,
      investmentUnit: formData.investmentUnit,
      recovery: formData.recovery,
      recoveryUnit: formData.recoveryUnit,
      lendingRate: formData.lendingRate,
      exchangeRate: formData.exchangeRate,
      techMissCount: formData.techMissCount,
      techAttemptCount: formData.techAttemptCount,
      midSuccess: formData.midSuccess,
      midNotWatermelon: formData.midNotWatermelon,
      midMiss: formData.midMiss,
      rightSuccess: formData.rightSuccess,
      rightMiss: formData.rightMiss,
      watermelonLossCount: formData.watermelonLossCount,
      cherryLossCount: formData.cherryLossCount,
      otherLossCount: formData.otherLossCount,
      memo: formData.memo,
      profitYen: recYen - invYen,
      totalLoss: calculatedLoss.total,
      totalMisses: calculatedLoss.misses,
      stats: inputStats,
      calcMode: calcMode,
      // Grouped fields for easier per-record management
      tech: {
        mode: calcMode,
        machineSection,
        simple: {
          attempts: Number(formData.techAttemptCount || 0),
          misses: Number(formData.techMissCount || 0)
        },
        detail: {
          midSuccess: Number(formData.midSuccess || 0),
          midNotWatermelon: Number(formData.midNotWatermelon || 0),
          midMiss: Number(formData.midMiss || 0),
          rightSuccess: Number(formData.rightSuccess || 0),
          rightMiss: Number(formData.rightMiss || 0)
        },
        accuracy: inputStats.personal.techAccuracy || null
      },
      losses: {
        watermelon: Number(formData.watermelonLossCount || 0),
        cherry: Number(formData.cherryLossCount || 0),
        other: Number(formData.otherLossCount || 0),
        total: calculatedLoss.total
      }
    };

    try {
      if (editingIndex !== null) {
        // 編集モード - Firebase を更新
        const recordToUpdate = records[editingIndex];
        await updateRecord(recordToUpdate.id, recordData);
      } else {
        // 新規作成モード - Firebase に追加
        await createRecord(recordData);
      }
      
      setEditingIndex(null);
      setShowForm(false);
      setFormData(prev => ({
        ...prev, 
        totalGames: '', bigCount: '', regCount: '', investment: '', recovery: '', 
        techMissCount: '', techAttemptCount: '', 
        midSuccess: '', midNotWatermelon: '', midMiss: '', rightSuccess: '', rightMiss: '',
        watermelonLossCount: '0', cherryLossCount: '0', otherLossCount: '0', memo: ''
      }));
    } catch (error) {
      console.error('Error saving record:', error);
      alert('レコードの保存に失敗しました');
    }
  };

  const loadRecordForEdit = (index) => {
    setPreviousTab(activeTab);
    setFormData(records[index]);
    setEditingIndex(index);
    setShowForm(true);
    setActiveTab('form');
  };

  const openNewRecordForm = () => {
    setEditingIndex(null);
    setFormData(prev => ({
      ...prev, 
      totalGames: '', bigCount: '', regCount: '', investment: '', recovery: '', 
      techMissCount: '', techAttemptCount: '', 
      midSuccess: '', midNotWatermelon: '', midMiss: '', rightSuccess: '', rightMiss: '',
      watermelonLossCount: '0', cherryLossCount: '0', otherLossCount: '0', memo: ''
    }));
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setShowForm(false);
    setActiveTab(previousTab);
    setFormData(prev => ({
      ...prev, 
      totalGames: '', bigCount: '', regCount: '', investment: '', recovery: '', 
      techMissCount: '', techAttemptCount: '', 
      midSuccess: '', midNotWatermelon: '', midMiss: '', rightSuccess: '', rightMiss: '',
      watermelonLossCount: '0', cherryLossCount: '0', otherLossCount: '0', memo: ''
    }));
  };

  const deleteRecord = async (id) => {
    if (window.confirm('削除しますか？')) {
      try {
        await deleteRecordFromDb(id);
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('レコードの削除に失敗しました');
      }
    }
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
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="flex items-center justify-center gap-3">
              <Loader size={24} className="text-indigo-600 animate-spin" />
              <span className="text-slate-700 font-semibold">初期化中...</span>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !user && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm">
            <div className="mb-6">
              <div className="inline-block bg-indigo-100 p-4 rounded-full mb-4">
                <Target className="text-indigo-600" size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">VERSUS ANALYZER</h2>
              <p className="text-sm text-slate-600">マルチデバイス同期</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>🔵</span>
                Google でサインイン
              </button>
              
              <button
                onClick={() => loginAnonymously()}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors text-sm"
              >
                匿名で続行（同期なし）
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mt-4">
              複数デバイスでデータを共有するには Google アカウントでサインインしてください
            </p>
          </div>
        </div>
      )}

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

          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div className="text-[10px] text-slate-500 font-bold text-center pb-3">
              v9.0.0 - Firebase Sync
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 text-xs font-semibold"
            >
              <LogOut size={14} />
              ログアウト
            </button>
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
            onClick={openNewRecordForm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-xs shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <PlusCircle size={16} /> <span className="hidden sm:inline">データ入力</span>
          </button>
        </header>

        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-3">期間フィルター</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-600 block mb-1">開始日</label>
                <input 
                  type="date" 
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] font-semibold"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 block mb-1">終了日</label>
                <input 
                  type="date" 
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] font-semibold"
                />
              </div>
              {(dateRangeStart || dateRangeEnd) && (
                <div className="col-span-2">
                  <button 
                    onClick={() => {setDateRangeStart(''); setDateRangeEnd('');}}
                    className="w-full px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-300 transition-all"
                  >
                    フィルターをリセット
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="全機種 累計収支" value={`${totalStats.yen.toLocaleString()}円`} color={totalStats.yen >= 0 ? "text-emerald-600" : "text-rose-600"} />
                <StatCard title="全機種 累計欠損" value={`-${totalStats.loss.toLocaleString()}枚`} color="text-rose-500" />
                <StatCard title="全機種 総回転数" value={`${totalStats.games.toLocaleString()} G`} color="text-slate-600" />
              </div>
              <ChartSection data={dashboardChartData} lossType={lossChartType} setLossType={setLossChartType} />
              <RecentHistorySection records={filterRecordsByDateRange(records)} onEdit={loadRecordForEdit} />
            </>
          )}

          {activeTab === 'machine-stats' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard title="機種別収支" value={`${machineSpecificData.stats.yen.toLocaleString()}円`} color={machineSpecificData.stats.yen >= 0 ? "text-emerald-600" : "text-rose-600"} />
                <StatCard title="技術欠損" value={`-${machineSpecificData.stats.loss.toLocaleString()}枚`} color="text-rose-500" />
                <StatCard title="BIG回数" value={`${machineSpecificData.stats.big}回`} color="text-indigo-600" />
                <StatCard title="REG回数" value={`${machineSpecificData.stats.reg}回`} color="text-indigo-400" />
                <StatCard title="技術精度" value={`${machineSpecificData.stats.techAccuracy}%`} color="text-amber-600" />
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
              {(activeTab === 'history' ? filterRecordsByDateRange(records) : machineSpecificData.records).map((r, idx) => {
                const actualIndex = records.indexOf(r);
                return <RecordItem key={r.id} record={r} recordIndex={actualIndex} onDelete={deleteRecord} onEdit={loadRecordForEdit} />;
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><PlusCircle className="text-indigo-600"/> 新規実践記録</h2>
                <button onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-600"><X/></button>
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

                <InvestmentRecoverySection formData={formData} handleInputChange={handleInputChange} />

                <div id="memo-section" className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">メモ</label>
                  <textarea
                    id="memo"
                    name="memo"
                    value={formData.memo || ''}
                    onChange={handleInputChange}
                    placeholder="記録に関するメモがあれば入力してください"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows="3"
                  />
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
                    <>
                      {formData.machineName === 'バーサスリヴァイズ' && <TechDetailSection_VersusRevise formData={formData} handleInputChange={handleInputChange} />}
                      {formData.machineName === '新ハナビ' && <TechDetailSection_Hanabi formData={formData} handleInputChange={handleInputChange} />}
                      {formData.machineName === 'Lハナビ' && <TechDetailSection_LHanabi formData={formData} handleInputChange={handleInputChange} />}
                      {formData.machineName === 'その他' && <TechDetailSection_Other formData={formData} handleInputChange={handleInputChange} />}
                    </>
                  )}

                  <SmallRoleLossSection currentConfig={currentConfig} formData={formData} handleInputChange={handleInputChange} />
                  
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">今回の合計損失</div>
                    <div className="text-xl font-black text-rose-500">-{calculatedLoss.total} 枚</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm">
                    {editingIndex !== null ? '修正を保存' : '記録を保存する'}
                  </button>
                  {editingIndex !== null && (
                    <button type="button" onClick={cancelEdit} className="px-6 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-300 transition-all text-sm">
                      キャンセル
                    </button>
                  )}
                </div>
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

const RecordItem = ({ record, recordIndex, onDelete, onEdit }) => (
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
      <div className="flex gap-2 opacity-0 lg:group-hover:opacity-100 focus:opacity-100">
        <button onClick={() => onEdit(recordIndex)} className="text-indigo-500 hover:text-indigo-700 transition-colors px-2 py-1 font-bold text-[11px]">編集</button>
        <button onClick={() => onDelete(record.id)} className="text-slate-200 hover:text-rose-500 transition-colors px-2 py-1"><Trash2 size={16}/></button>
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
    <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-200 bg-white focus-within:border-indigo-500 transition-all">
      <input type="number" name={name} value={value} onChange={onChange} className="min-w-0 flex-1 p-3 font-bold outline-none text-sm" />
      <select name={unitName} value={unit} onChange={onChange} className="min-w-[56px] bg-slate-50 px-2.5 font-bold text-xs border-l border-slate-200 cursor-pointer outline-none">
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

const TechDetailSection_VersusRevise = ({ formData, handleInputChange }) => (
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

const TechDetailSection_Hanabi = ({ formData, handleInputChange }) => (
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

const TechDetailSection_LHanabi = ({ formData, handleInputChange }) => (
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

const TechDetailSection_Other = ({ formData, handleInputChange }) => (
  <div id="tech-detail-section-other" className="space-y-4">
    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
      <p className="text-[11px] text-slate-500 text-center">この機種は技術介入の詳細トラッキングに対応していません。簡易モードで記録してください。</p>
    </div>
  </div>
);

const TechDetailSection = ({ formData, handleInputChange }) => (
  <div id="tech-detail-section" className="space-y-4">
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

const SmallRoleLossSection = ({ currentConfig, formData, handleInputChange }) => (
  <div id="small-role-loss-section" className="bg-rose-50 p-4 rounded-2xl border border-rose-100 grid grid-cols-3 gap-2">
    <InputPlain label={`${currentConfig.watermelonName}欠損`} name="watermelonLossCount" value={formData.watermelonLossCount} onChange={handleInputChange} color="text-rose-400" />
    <InputPlain label={`${currentConfig.cherryName}欠損`} name="cherryLossCount" value={formData.cherryLossCount} onChange={handleInputChange} color="text-rose-400" />
    <InputPlain label="他損失(枚)" name="otherLossCount" value={formData.otherLossCount} onChange={handleInputChange} color="text-rose-400" />
  </div>
);

const InvestmentRecoverySection = ({ formData, handleInputChange }) => (
  <div id="investment-recovery-section" className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <InputWithUnit label="投資" name="investment" value={formData.investment} onChange={handleInputChange} unit={formData.investmentUnit} unitName="investmentUnit" options={["円", "枚"]} />
      <InputWithUnit label="回収" name="recovery" value={formData.recovery} onChange={handleInputChange} unit={formData.recoveryUnit} unitName="recoveryUnit" options={["枚", "円"]} />
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

const RecentHistorySection = ({ records, onEdit }) => {
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

export default App;
