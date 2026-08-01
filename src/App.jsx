import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  PlusCircle, 
  X,
  Loader,
} from 'lucide-react';
import { MACHINE_OPTIONS, getMachineConfig } from './config/machineConfig';
import { calculateInputStats, calculateLoss } from './utils/recordCalculations';
import { subscribeToRecords, createRecord, updateRecord, deleteRecord as deleteRecordFromDb, migrateFromLocalStorage } from './firebase/db';
import { loginAnonymously, subscribeToAuthState, logout, signInWithGoogle } from './firebase/auth';
import { isFirebaseConfigured } from './firebase/config';
import { SettingInferenceScreen } from './features/settingInference/components/SettingInferenceScreen';
import { subscribeToSettingInferenceSessions } from './features/settingInference/storage/firestoreStorage';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { DateFilterPanel } from './components/DateFilterPanel';
import {
  ChartSection,
  StatCard,
  RecordItem,
  SettingInferenceSessionSection,
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
const UMINEKO_MACHINE_NAME = 'うみねこのなく頃に2';

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
  const [settingInferenceSessions, setSettingInferenceSessions] = useState([]);
  const [hasMigratedData, setHasMigratedData] = useState(false);
  const [allowGuestInference, setAllowGuestInference] = useState(false);
  const [settingInferenceContext, setSettingInferenceContext] = useState(null);
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

  useEffect(() => {
    if (!user) {
      setSettingInferenceSessions([]);
      return undefined;
    }

    return subscribeToSettingInferenceSessions(setSettingInferenceSessions);
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
  const [openInferenceAfterSave, setOpenInferenceAfterSave] = useState(false);
  const [calcMode, setCalcMode] = useState('detail'); 
  const recordFormRef = useRef(null);
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

  const getSettingInferenceSessionDate = useCallback((session) => {
    if (session.linkedRecordDate) return session.linkedRecordDate;
    const timestamp = session.updatedAt?.toDate?.() || session.createdAt?.toDate?.();
    return timestamp ? timestamp.toISOString().split('T')[0] : '';
  }, []);
  
  const machineSpecificData = useMemo(() => {
    const allMachineRecords = records.filter(r => r.machineName === selectedMachineTab);
    const filtered = filterRecordsByDateRange(allMachineRecords);
    const techAccuracyValues = filtered
      .map(r => r.stats?.personal?.techAccuracy)
      .filter(v => v !== undefined && v !== null);
    const avgTechAccuracy = techAccuracyValues.length > 0
      ? Math.round(techAccuracyValues.reduce((a, b) => a + b, 0) / techAccuracyValues.length)
      : 0;

    const filteredInferenceSessions = selectedMachineTab === UMINEKO_MACHINE_NAME
      ? settingInferenceSessions.filter((session) => {
        if (session.machineId !== 'umineko2') return false;
        const sessionDate = getSettingInferenceSessionDate(session);
        if (!dateRangeStart && !dateRangeEnd) return true;
        const isAfterStart = !dateRangeStart || sessionDate >= dateRangeStart;
        const isBeforeEnd = !dateRangeEnd || sessionDate <= dateRangeEnd;
        return isAfterStart && isBeforeEnd;
      })
      : [];

    return {
      records: filtered,
      settingInferenceSessions: filteredInferenceSessions,
      chart: getChartDataForRecords(filtered),
      stats: {
        yen: filtered.reduce((acc, r) => acc + r.profitYen, 0),
        loss: filtered.reduce((acc, r) => acc + (r.totalLoss || 0), 0),
        games: filtered.reduce((acc, r) => acc + (r.stats?.personal?.games || 0), 0),
        big: filtered.reduce((acc, r) => acc + (r.stats?.personal?.big || 0), 0),
        reg: filtered.reduce((acc, r) => acc + (r.stats?.personal?.reg || 0), 0),
        techAccuracy: avgTechAccuracy,
        inferenceCount: filteredInferenceSessions.length,
      }
    };
  }, [records, selectedMachineTab, filterRecordsByDateRange, settingInferenceSessions, getSettingInferenceSessionDate, dateRangeStart, dateRangeEnd]);

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

  const isUminekoRecordForm = formData.machineName === UMINEKO_MACHINE_NAME;
  const linkedInferenceSessionForEditing = useMemo(() => (
    editingRecordId
      ? settingInferenceSessions.find((session) => session.linkedRecordId === editingRecordId) || null
      : null
  ), [editingRecordId, settingInferenceSessions]);

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
      let savedRecordId = editingRecordId;

      if (editingRecordId !== null) {
        // 編集モード - Firebase を更新
        await updateRecord(editingRecordId, recordData);
        setActiveTab(previousTab);
      } else {
        // 新規作成モード - Firebase に追加
        savedRecordId = await createRecord(recordData);
      }

      const shouldOpenInference = openInferenceAfterSave && formData.machineName === UMINEKO_MACHINE_NAME && savedRecordId;
      
      setEditingRecordId(null);
      setShowForm(false);
      setFormData(createInitialFormData());
      setOpenInferenceAfterSave(false);

      if (shouldOpenInference) {
        openSettingInferenceForRecord({
          id: savedRecordId,
          date: recordData.date
        });
        return;
      }
    } catch (error) {
      console.error('Error saving record:', error);
      alert('レコードの保存に失敗しました');
      setOpenInferenceAfterSave(false);
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
    setOpenInferenceAfterSave(false);
    setShowForm(true);
    setActiveTab('form');
  };

  const openSettingInferenceForRecord = (record) => {
    setSettingInferenceContext({
      sessionId: null,
      input: null,
      linkedRecordId: record.id,
      linkedRecordDate: record.date,
      key: `record-${record.id}`
    });
    setActiveTab('setting-inference');
    setIsSidebarOpen(false);
  };

  const openSavedSettingInferenceSession = (session) => {
    setSettingInferenceContext({
      sessionId: session.id,
      input: session.input,
      linkedRecordId: session.linkedRecordId || null,
      linkedRecordDate: session.linkedRecordDate || getSettingInferenceSessionDate(session),
      key: `session-${session.id}`
    });
    setActiveTab('setting-inference');
    setIsSidebarOpen(false);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setActiveTab(previousTab);
    setOpenInferenceAfterSave(false);

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

      <AppSidebar
        activeTab={activeTab}
        isFirebaseConfigured={isFirebaseConfigured}
        isOpen={isSidebarOpen}
        machineOptions={MACHINE_OPTIONS}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={logout}
        onSelectDashboard={() => {
          setActiveTab('dashboard');
          setIsSidebarOpen(false);
        }}
        onSelectHistory={() => {
          setActiveTab('history');
          setIsSidebarOpen(false);
        }}
        onSelectMachine={(machine) => {
          setActiveTab('machine-stats');
          setSelectedMachineTab(machine);
          setIsSidebarOpen(false);
        }}
        onSelectSettingInference={() => {
          setSettingInferenceContext(null);
          setActiveTab('setting-inference');
          setIsSidebarOpen(false);
        }}
        selectedMachineTab={selectedMachineTab}
      />

      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <AppHeader
          activeTab={activeTab}
          selectedMachineTab={selectedMachineTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onCreateRecord={openNewRecordForm}
        />

        <div className="pt-24 p-6 md:p-8 max-w-6xl mx-auto w-full">
          {activeTab !== 'setting-inference' && (
            <DateFilterPanel
              startDate={dateRangeStart}
              endDate={dateRangeEnd}
              onStartDateChange={setDateRangeStart}
              onEndDateChange={setDateRangeEnd}
              onReset={() => {
                setDateRangeStart('');
                setDateRangeEnd('');
              }}
            />
          )}

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
                <StatCard title={selectedMachineTab === UMINEKO_MACHINE_NAME ? '設定推測保存数' : '技術精度'} value={selectedMachineTab === UMINEKO_MACHINE_NAME ? `${machineSpecificData.stats.inferenceCount}件` : `${machineSpecificData.stats.techAccuracy}%`} color={selectedMachineTab === UMINEKO_MACHINE_NAME ? 'text-indigo-600' : 'text-amber-600'} />
              </div>
              {machineSpecificData.chart.length > 0 ? (
                <ChartSection data={machineSpecificData.chart} lossType={lossChartType} setLossType={setLossChartType} />
              ) : (
                <div className="bg-white p-12 rounded-3xl text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">データがまだありません</div>
              )}
              {selectedMachineTab === UMINEKO_MACHINE_NAME && (
                <SettingInferenceSessionSection
                  sessions={machineSpecificData.settingInferenceSessions}
                  onOpenSettingInference={openSavedSettingInferenceSession}
                />
              )}
            </>
          )}

          {(activeTab === 'history' || (activeTab === 'machine-stats' && machineSpecificData.records.length > 0)) && (
            <div className="space-y-4 mt-4 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{activeTab === 'history' ? '全履歴' : `${selectedMachineTab} の履歴`}</h3>
              {(activeTab === 'history' ? filterRecordsByDateRange(records) : machineSpecificData.records).map((r) => {
                const linkedInference = selectedMachineTab === UMINEKO_MACHINE_NAME
                  ? machineSpecificData.settingInferenceSessions.find((session) => session.linkedRecordId === r.id)
                  : null;
                return (
                  <RecordItem
                    key={r.id}
                    record={r}
                    onDelete={deleteRecord}
                    onEdit={loadRecordForEdit}
                    onOpenSettingInference={r.machineName === UMINEKO_MACHINE_NAME ? openSettingInferenceForRecord : null}
                    hasLinkedInference={Boolean(linkedInference)}
                  />
                );
              })}
            </div>
          )}

          {activeTab === 'setting-inference' && (
            <SettingInferenceScreen
              key={settingInferenceContext?.key || 'default-setting-inference'}
              linkedRecordId={settingInferenceContext?.linkedRecordId || null}
              linkedRecordDate={settingInferenceContext?.linkedRecordDate || null}
              initialOverride={settingInferenceContext ? {
                sessionId: settingInferenceContext.sessionId,
                input: settingInferenceContext.input
              } : null}
            />
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto overflow-x-hidden sm:items-center sm:p-4">
            <div className="bg-white shadow-2xl w-full min-h-screen rounded-none sm:min-h-0 sm:max-w-2xl sm:rounded-3xl sm:my-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><PlusCircle className="text-indigo-600"/> {editingRecordId !== null ? '実践記録を編集' : '新規実践記録'}</h2>
                <button type="button" aria-label="フォームを閉じる" onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-600"><X/></button>
              </div>
              <form ref={recordFormRef} onSubmit={handleSubmit} className="p-6 pb-10 space-y-6 max-h-none overflow-y-auto overflow-x-hidden text-left sm:max-h-[80vh]">
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

                {isUminekoRecordForm && (
                  <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <div>
                      <div className="text-xs font-black uppercase text-indigo-600">うみねこ実戦メモ</div>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        収支記録を保存したあと、この実戦に紐づけて設定推測を残せます。
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        新規記録では「保存して設定推測へ」、編集時は連携済みセッションの再編集もできます。
                      </p>
                    </div>
                    {editingRecordId !== null && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openSettingInferenceForRecord({ id: editingRecordId, date: formData.date })}
                          className="min-h-11 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-black text-indigo-700"
                        >
                          {linkedInferenceSessionForEditing ? '連携中の設定推測を開く' : 'この実戦の設定推測を開く'}
                        </button>
                        {linkedInferenceSessionForEditing && (
                          <button
                            type="button"
                            onClick={() => openSavedSettingInferenceSession(linkedInferenceSessionForEditing)}
                            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                          >
                            保存済み設定推測を再編集
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

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

                {!isUminekoRecordForm && (
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
                )}

                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm">
                    {editingRecordId !== null ? '修正を保存' : '記録を保存する'}
                  </button>
                  {isUminekoRecordForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenInferenceAfterSave(true);
                        recordFormRef.current?.requestSubmit();
                      }}
                      className="px-4 py-4 bg-white text-indigo-700 border border-indigo-200 rounded-2xl font-black hover:bg-indigo-50 transition-all text-sm"
                    >
                      保存して設定推測へ
                    </button>
                  )}
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
