import React from 'react';
import { Menu, PlusCircle } from 'lucide-react';

const getHeaderTitle = (activeTab, selectedMachineTab) => {
  if (activeTab === 'dashboard') {
    return '総合ダッシュボード';
  }

  if (activeTab === 'machine-stats') {
    return `機種統計: ${selectedMachineTab}`;
  }

  if (activeTab === 'setting-inference') {
    return '設定推測';
  }

  if (activeTab === 'history') {
    return '全履歴';
  }

  return '';
};

export const AppHeader = ({
  activeTab,
  selectedMachineTab,
  onOpenSidebar,
  onCreateRecord
}) => (
  <header
    data-ui="app-header"
    className="fixed top-0 left-0 right-0 z-30 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 lg:left-64"
  >
    <div className="flex min-w-0 items-center gap-4">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 -ml-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="サイドバーを開く"
      >
        <Menu size={24} />
      </button>
      <div className="min-w-0 truncate text-sm font-black text-slate-800">
        {getHeaderTitle(activeTab, selectedMachineTab)}
      </div>
    </div>
    <button
      type="button"
      onClick={onCreateRecord}
      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-indigo-700"
    >
      <PlusCircle size={16} /> <span className="hidden sm:inline">データ入力</span>
    </button>
  </header>
);
