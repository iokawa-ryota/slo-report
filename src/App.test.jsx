/* @vitest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockRecords = [
  {
    id: 'record-1',
    date: '2026-03-01',
    machineName: 'バーサスリヴァイズ',
    totalGames: '1200',
    bigCount: '4',
    regCount: '3',
    startTotalGames: '0',
    startBigCount: '0',
    startRegCount: '0',
    investment: '1000',
    investmentUnit: '円',
    recovery: '1200',
    recoveryUnit: '枚',
    lendingRate: '20',
    exchangeRate: '50',
    techMissCount: '0',
    techAttemptCount: '0',
    midSuccess: '1',
    midNotWatermelon: '0',
    midMiss: '0',
    rightSuccess: '1',
    rightMiss: '0',
    watermelonLossCount: '0',
    cherryLossCount: '0',
    otherLossCount: '0',
    memo: 'older',
    profitYen: 22000,
    totalLoss: 0,
    totalMisses: 0,
    stats: { personal: { games: 1200, big: 4, reg: 3, techAccuracy: '100.0' } }
  },
  {
    id: 'record-2',
    date: '2026-03-10',
    machineName: '新ハナビ',
    totalGames: '800',
    bigCount: '2',
    regCount: '4',
    startTotalGames: '0',
    startBigCount: '0',
    startRegCount: '0',
    investment: '800',
    investmentUnit: '円',
    recovery: '600',
    recoveryUnit: '枚',
    lendingRate: '20',
    exchangeRate: '50',
    techMissCount: '1',
    techAttemptCount: '10',
    midSuccess: '0',
    midNotWatermelon: '0',
    midMiss: '0',
    rightSuccess: '0',
    rightMiss: '0',
    watermelonLossCount: '0',
    cherryLossCount: '0',
    otherLossCount: '0',
    memo: 'newer',
    profitYen: 10400,
    totalLoss: 13,
    totalMisses: 1,
    stats: { personal: { games: 800, big: 2, reg: 4, techAccuracy: '90.0' } }
  }
];

vi.mock('recharts', () => {
  const MockChart = ({ children }) => <div>{children}</div>;
  return {
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    LineChart: MockChart,
    Line: () => null,
    BarChart: MockChart,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ReferenceLine: () => null
  };
});

vi.mock('./firebase/config', () => ({
  isFirebaseConfigured: false
}));

vi.mock('./firebase/auth', () => ({
  loginAnonymously: vi.fn(),
  subscribeToAuthState: (callback) => {
    callback({ uid: 'local-user', email: null, isAnonymous: true });
    return () => {};
  },
  logout: vi.fn(),
  signInWithGoogle: vi.fn()
}));

const { createRecordMock } = vi.hoisted(() => ({
  createRecordMock: vi.fn()
}));
const updateRecordMock = vi.hoisted(() => ({
  updateRecordMock: vi.fn()
}));

vi.mock('./firebase/db', () => ({
  subscribeToRecords: (callback) => {
    callback(mockRecords);
    return () => {};
  },
  createRecord: createRecordMock,
  updateRecord: updateRecordMock.updateRecordMock,
  deleteRecord: vi.fn(),
  migrateFromLocalStorage: vi.fn()
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows the app without the Firebase login overlay in local mode', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: '総合ダッシュボード' })).toBeInTheDocument();
    expect(screen.queryByText('Google でサインイン')).not.toBeInTheDocument();
    expect(screen.getByText('v9.0.0 - Local Save Mode')).toBeInTheDocument();
  });

  it('does not submit the form when changing the lending rate', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'データ入力' })[0]);
    await screen.findByRole('button', { name: '10スロ' });
    await user.click(screen.getByRole('button', { name: '10スロ' }));

    expect(screen.getByRole('button', { name: '記録を保存する' })).toBeInTheDocument();
    expect(createRecordMock).not.toHaveBeenCalled();
  });

  it('returns to the previous screen after saving from recent history edit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '編集' })[0]);
    await user.clear(screen.getByDisplayValue('older'));
    await user.type(screen.getByRole('textbox'), 'edited-from-history');
    await user.click(screen.getByRole('button', { name: '修正を保存' }));

    expect(updateRecordMock.updateRecordMock).toHaveBeenCalled();
    expect((await screen.findAllByText('全機種 累計収支')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('直近5件の履歴').length).toBeGreaterThan(0);
  });

});
