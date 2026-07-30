import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PlusCircle, 
  Target, 
  History,
  LayoutDashboard,
  Menu,
  X,
  Layers,
  LogOut,
  Loader,
  Cpu
} from 'lucide-react';
import { MACHINE_OPTIONS, getMachineConfig } from './config/machineConfig';
import { calculateInputStats, calculateLoss } from './utils/recordCalculations';
import { subscribeToRecords, createRecord, updateRecord, deleteRecord as deleteRecordFromDb, migrateFromLocalStorage } from './firebase/db';
import { loginAnonymously, subscribeToAuthState, logout, signInWithGoogle } from './firebase/auth';
import { isFirebaseConfigured } from './firebase/config';
import { SettingInferenceScreen } from './features/settingInference/components/SettingInferenceScreen';
import {
  ChartSection,
  NavItem,
  StatCard,
  RecordItem,
  InputSelect,
  InputPlain,
  GamesBonusSection,
  VersusReviseTechInterventionSection,
  ShinHanabiTechInterventionSection,
  LHanabiTechInterventionSection,
  TechDetailSectionOther,
  SmallRoleLossSection,
  InvestmentRecoverySection,
  RecentHistorySection
} from './components/AppSections';

const DEFAULT_DETAIL_FIELDS = { mid: true, right: true };
const APP_UI_STATE_KEY = 'app-ui-state-v1';

const loadUiState = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(sessionStorage.getItem(APP_UI_STATE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveUiState = (patch) => {
  if (typeof window === 'undefined') {
    return;
  }

  const current = loadUiState();
  sessionStorage.setItem(APP_UI_STATE_KEY, JSON.stringify({ ...current, ...patch }));
};

const createInitialFormData = () => ({
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

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [hasMigratedData, setHasMigratedData] = useState(false);
  const [allowGuestInference, setAllowGuestInference] = useState(false);
  const [restoredScrollY, setRestoredScrollY] = useState(() => {
    const uiState = loadUiState();
    return Number.isFinite(uiState.scrollY) ? uiState.scrollY : null;
  });

  // Firebase 認証の初期化
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAllowGuestInference(false);
        // ローカルストレージからのデータ移行をチェック
        const localData = localStorage.getItem('pachislo-records-v8');
        if (localData && !hasMigratedData && isFirebaseConfigured) {
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
    if (user) {
      const unsubscribe = subscribeToRecords(setRecords);
      return unsubscribe;
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState(() => {
    const uiState = loadUiState();
    return uiState.activeTab || 'dashboard';
  });
  const [previousTab, setPreviousTab] = useState('dashboard');
  const [selectedMachineTab, setSelectedMachineTab] = useState(() => {
    const uiState = loadUiState();
    return uiState.selectedMachineTab || MACHINE_OPTIONS[0];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calcMode, setCalcMode] = useState('detail'); 
  const [isMidStart, setIsMidStart] = useState(false); 
  const [lossChartType, setLossChartType] = useState('bar');
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState(''); 

  const [formData, setFormData] = useState(createInitialFormData);

  const currentConfig = getMachineConfig(formData.machineName);
  const detailFields = currentConfig.detailFields || DEFAULT_DETAIL_FIELDS;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'machineName') {
      const nextConfig = getMachineConfig(value);
      const nextDetailFields = nextConfig.detailFields || DEFAULT_DETAIL_FIELDS;
      setFormData(prev => ({
        ...prev,
        machineName: value,
        ...(nextDetailFields.mid ? {} : { midSuccess: '', midNotWatermelon: '', midMiss: '' }),
        ...(nextDetailFields.right ? {} : { rightSuccess: '', rightMiss: '' })
      }));
      return;
    }
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

  const filterRecordsByDateRange = useCallback((targetRecords) => {
    if (!dateRangeStart && !dateRangeEnd) return targetRecords;
    return targetRecords.filter(r => {
      const recordDate = r.date;
      const isAfterStart = !dateRangeStart || recordDate >= dateRangeStart;
      const isBeforeEnd = !dateRangeEnd || recordDate <= dateRangeEnd;
      return isAfterStart && isBeforeEnd;
    });
  }, [dateRangeStart, dateRangeEnd]);

  const dashboardChartData = useMemo(() => getChartDataForRecords(filterRecordsByDateRange(records)), [records, filterRecordsByDateRange]);
  
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
  }, [records, selectedMachineTab, filterRecordsByDateRange]);

  const totalStats = useMemo(() => {
    const filteredRecords = filterRecordsByDateRange(records);
    const yen = filteredRecords.reduce((acc, r) => acc + r.profitYen, 0);
    const loss = filteredRecords.reduce((acc, r) => acc + (r.totalLoss || 0), 0);
    const games = filteredRecords.reduce((acc, r) => acc + (r.stats?.personal?.games || 0), 0);
    return { yen, loss, games };
  }, [records, filterRecordsByDateRange]);

  const inputStats = useMemo(() => {
    return calculateInputStats({ formData, isMidStart, calcMode, detailFields });
  }, [formData, isMidStart, calcMode, detailFields]);

  const calculatedLoss = useMemo(() => {
    return calculateLoss({ formData, calcMode, currentConfig, detailFields });
  }, [formData, currentConfig, calcMode, detailFields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lRate = Number(formData.lendingRate);
    const eRate = Number(formData.exchangeRate);
    const invYen = formData.investmentUnit === '円' ? Number(formData.investment) : Number(formData.investment) * lRate;
    const recYen = formData.recoveryUnit === '円' ? Number(formData.recovery) : Math.floor(Number(formData.recovery) * ((lRate * 50) / eRate));
    const machineSection = currentConfig.machineSection || 'other';
    
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
      if (editingRecordId !== null) {
        // 編集モード - Firebase を更新
        await updateRecord(editingRecordId, recordData);
        setActiveTab(previousTab);
      } else {
        // 新規作成モード - Firebase に追加
        await createRecord(recordData);
      }
      
      setEditingRecordId(null);
      setShowForm(false);
      setFormData(createInitialFormData());
    } catch (error) {
      console.error('Error saving record:', error);
      alert('レコードの保存に失敗しました');
    }
  };

  const loadRecordForEdit = (recordId) => {
    if (editingRecordId === recordId && !showForm) {
      setShowForm(true);
      setActiveTab('form');
      return;
    }

    const recordToEdit = records.find((record) => record.id === recordId);
    if (!recordToEdit) return;

    setPreviousTab(activeTab);
    setFormData(recordToEdit);
    setEditingRecordId(recordId);
    setShowForm(true);
    setActiveTab('form');
  };

  const openNewRecordForm = () => {
    setEditingRecordId(null);
    setFormData(createInitialFormData());
    setShowForm(true);
    setActiveTab('form');
  };

  const cancelEdit = () => {
    setShowForm(false);
    setActiveTab(previousTab);

    if (editingRecordId === null) {
      setFormData(createInitialFormData());
    }
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

  const detailSectionComponents = {
    versusRevise: VersusReviseTechInterventionSection,
    hanabi: ShinHanabiTechInterventionSection,
    lHanabi: LHanabiTechInterventionSection,
    other: TechDetailSectionOther
  };
  const DetailSectionComponent = detailSectionComponents[currentConfig.detailVariant] || TechDetailSectionOther;
  const shouldShowLoginOverlay = !isLoading && !user && isFirebaseConfigured && !(allowGuestInference && activeTab === 'setting-inference');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.history.scrollRestoration = 'manual';

    let ticking = false;
    const persistScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        saveUiState({ scrollY: window.scrollY });
        ticking = false;
      });
    };

    window.addEventListener('scroll', persistScroll, { passive: true });
    window.addEventListener('beforeunload', persistScroll);

    return () => {
      window.removeEventListener('scroll', persistScroll);
      window.removeEventListener('beforeunload', persistScroll);
    };
  }, []);

  useEffect(() => {
    saveUiState({ activeTab, selectedMachineTab });
  }, [activeTab, selectedMachineTab]);

  useEffect(() => {
    if (restoredScrollY === null || isLoading || showForm) {
      return;
    }

    const restore = () => {
      window.scrollTo({ top: restoredScrollY, behavior: 'auto' });
      setRestoredScrollY(null);
    };

    const timer = window.setTimeout(restore, 0);
    return () => window.clearTimeout(timer);
  }, [restoredScrollY, isLoading, showForm, activeTab]);

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

      {shouldShowLoginOverlay && (
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

              <button
                onClick={() => {
                  setAllowGuestInference(true);
                  setActiveTab('setting-inference');
                }}
                className="w-full px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-semibold transition-colors text-sm"
              >
                設定推測のみ使う（ローカル）
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
        app-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:translate-x-0
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
            <NavItem icon={<Cpu size={18}/>} label="設定推測" active={activeTab === 'setting-inference'} onClick={() => {setActiveTab('setting-inference'); setIsSidebarOpen(false);}} />
            <NavItem icon={<History size={18}/>} label="全履歴一覧" active={activeTab === 'history'} onClick={() => {setActiveTab('history'); setIsSidebarOpen(false);}} />
          </nav>

          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div className="text-[10px] text-slate-500 font-bold text-center pb-3">
              {isFirebaseConfigured ? 'v9.0.0 - Firebase Sync' : 'v9.0.0 - Local Save Mode'}
            </div>
            {isFirebaseConfigured && (
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 text-xs font-semibold"
              >
                <LogOut size={14} />
                ログアウト
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <header className="fixed top-0 left-0 right-0 lg:left-64 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <div className="font-black text-slate-800 text-sm flex items-center gap-2">
              {activeTab === 'dashboard' && '総合ダッシュボード'}
              {activeTab === 'machine-stats' && `機種統計: ${selectedMachineTab}`}
              {activeTab === 'setting-inference' && '設定推測'}
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

        <div className="pt-20 p-6 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-500 uppercase mb-3">期間フィルター</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
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
              <RecentHistorySection
                records={filterRecordsByDateRange(records)}
                onEdit={loadRecordForEdit}
                onDelete={deleteRecord}
              />
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
              {(activeTab === 'history' ? filterRecordsByDateRange(records) : machineSpecificData.records).map((r) => {
                return <RecordItem key={r.id} record={r} onDelete={deleteRecord} onEdit={loadRecordForEdit} />;
              })}
            </div>
          )}

          {activeTab === 'setting-inference' && (
            <SettingInferenceScreen />
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto overflow-x-hidden sm:items-center sm:p-4">
            <div className="bg-white shadow-2xl w-full min-h-screen rounded-none sm:min-h-0 sm:max-w-2xl sm:rounded-3xl sm:my-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><PlusCircle className="text-indigo-600"/> {editingRecordId !== null ? '実践記録を編集' : '新規実践記録'}</h2>
                <button type="button" aria-label="フォームを閉じる" onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-600"><X/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 pb-10 space-y-6 max-h-none overflow-y-auto overflow-x-hidden text-left sm:max-h-[80vh]">
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
                      <DetailSectionComponent formData={formData} handleInputChange={handleInputChange} />
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
                    {editingRecordId !== null ? '修正を保存' : '記録を保存する'}
                  </button>
                  {editingRecordId !== null && (
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


export default App;
