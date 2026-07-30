import React from 'react';
import {
  Cpu,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Target,
  X
} from 'lucide-react';
import { NavItem } from './AppSections';

export const AppSidebar = ({
  activeTab,
  isFirebaseConfigured,
  isOpen,
  machineOptions,
  onClose,
  onLogout,
  onSelectDashboard,
  onSelectHistory,
  onSelectMachine,
  onSelectSettingInference,
  selectedMachineTab
}) => (
  <aside
    data-ui="app-sidebar"
    className={`
      app-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}
  >
    <div className="flex h-full flex-col p-6">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2">
            <Target className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white">
            VERSUS
            <br />
            <span className="text-indigo-400">ANALYZER</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white lg:hidden"
          aria-label="サイドバーを閉じる"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1" aria-label="メインナビゲーション">
        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="総合ダッシュボード"
          active={activeTab === 'dashboard'}
          onClick={onSelectDashboard}
        />
        <div className="px-3 pb-2 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">機種別統計</div>
        {machineOptions.map((machine) => (
          <NavItem
            key={machine}
            icon={<Layers size={18} />}
            label={machine}
            active={activeTab === 'machine-stats' && selectedMachineTab === machine}
            onClick={() => onSelectMachine(machine)}
          />
        ))}
        <div className="px-3 pb-2 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">その他</div>
        <NavItem
          icon={<Cpu size={18} />}
          label="設定推測"
          active={activeTab === 'setting-inference'}
          onClick={onSelectSettingInference}
        />
        <NavItem
          icon={<History size={18} />}
          label="全履歴一覧"
          active={activeTab === 'history'}
          onClick={onSelectHistory}
        />
      </nav>

      <div className="space-y-3 border-t border-slate-800 pt-6">
        <div className="pb-3 text-center text-[10px] font-bold text-slate-500">
          {isFirebaseConfigured ? 'v9.0.0 - Firebase Sync' : 'v9.0.0 - Local Save Mode'}
        </div>
        {isFirebaseConfigured && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
          >
            <LogOut size={14} />
            ログアウト
          </button>
        )}
      </div>
    </div>
  </aside>
);
