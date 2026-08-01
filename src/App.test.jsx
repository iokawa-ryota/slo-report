/* @vitest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const getActiveMemoField = () => screen.getAllByRole('textbox').at(-1);

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

vi.mock('./firebase/config', () => ({
  isFirebaseConfigured: false
}));

vi.mock('./firebase/auth', () => ({
  loginAnonymously: vi.fn(),
  subscribeToAuthState: (callback) => {
    callback({ uid: 'local-user', email: null, isAnonymous: true });
    return () => {};
  },
  getCurrentUser: () => ({ uid: 'local-user', email: null, isAnonymous: true }),
  logout: vi.fn(),
  signInWithGoogle: vi.fn()
}));

const { createRecordMock } = vi.hoisted(() => ({
  createRecordMock: vi.fn()
}));
const updateRecordMock = vi.hoisted(() => ({
  updateRecordMock: vi.fn()
}));
const deleteRecordMock = vi.hoisted(() => ({
  deleteRecordMock: vi.fn()
}));

vi.mock('./firebase/db', () => ({
  subscribeToRecords: (callback) => {
    callback(mockRecords);
    return () => {};
  },
  createRecord: createRecordMock,
  updateRecord: updateRecordMock.updateRecordMock,
  deleteRecord: deleteRecordMock.deleteRecordMock,
  migrateFromLocalStorage: vi.fn()
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the app without the Firebase login overlay in local mode', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: '総合ダッシュボード' })).toBeInTheDocument();
    expect(screen.queryByText('Google でサインイン')).not.toBeInTheDocument();
    expect(screen.getByText('v9.0.0 - Local Save Mode')).toBeInTheDocument();
    expect(document.querySelector('header')).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
    expect(document.querySelector('[data-ui="app-body"]')).toHaveClass('pt-20');
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

    await user.click(screen.getAllByLabelText('直近履歴を編集: 2026-03-01 バーサスリヴァイズ')[0]);
    await user.clear(screen.getByDisplayValue('older'));
    await user.type(getActiveMemoField(), 'edited-from-history');
    await user.click(screen.getByRole('button', { name: '修正を保存' }));

    expect(updateRecordMock.updateRecordMock).toHaveBeenCalled();
    expect((await screen.findAllByText('全機種 累計収支')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('直近5件の履歴').length).toBeGreaterThan(0);
  });

  it('keeps unsaved edit content when closing the edit form with x', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByLabelText('直近履歴を編集: 2026-03-01 バーサスリヴァイズ')[0]);
    const memoField = getActiveMemoField();
    await user.clear(memoField);
    await user.type(memoField, 'draft-kept-after-close');

    await user.click(screen.getAllByRole('button', { name: 'フォームを閉じる' }).at(-1));
    expect(screen.queryAllByRole('heading', { name: '実践記録を編集' })).toHaveLength(0);

    await user.click(screen.getAllByLabelText('直近履歴を編集: 2026-03-01 バーサスリヴァイズ')[0]);
    expect(getActiveMemoField()).toHaveValue('draft-kept-after-close');
  });

  it('deletes a record from recent history', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByLabelText('直近履歴を削除: 2026-03-01 バーサスリヴァイズ')[0]);

    expect(window.confirm).toHaveBeenCalledWith('削除しますか？');
    expect(deleteRecordMock.deleteRecordMock).toHaveBeenCalledWith('record-1');
  });

  it('uses single-column mobile-first layouts in cramped form sections', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'データ入力' })[0]);
    await screen.findByRole('button', { name: '記録を保存する' });

    expect(document.querySelector('form')?.parentElement).toHaveClass('min-h-screen', 'rounded-none', 'sm:rounded-3xl');
    expect(document.querySelector('#final-games-section')).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
    expect(document.querySelector('#small-role-loss-section')).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
    expect(document.querySelector('#recent-history-section .group > div')).toHaveClass('flex-col', 'sm:flex-row');
  });

  it('allows local setting inference usage without login', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '設定推測' })[0]);

    expect(await screen.findByText('入力')).toBeInTheDocument();
    expect(screen.getByText('未入力は除外、0 は実測値として扱います。入力内容は自動保存されます。')).toBeInTheDocument();

    const totalGamesInput = screen.getByRole('textbox', { name: '総ゲーム数' });
    await user.type(totalGamesInput, '2000');
    await user.type(screen.getByRole('textbox', { name: 'BIG回数' }), '6');

    expect(screen.getByText('使用項目')).toBeInTheDocument();
    expect(screen.getByText('除外項目')).toBeInTheDocument();
  });

  it('confirms before resetting the setting inference draft', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '設定推測' })[0]);

    const totalGamesInput = await screen.findByRole('textbox', { name: '総ゲーム数' });
    await user.clear(totalGamesInput);
    await user.type(totalGamesInput, '2500');
    await user.click(screen.getByRole('button', { name: '入力をリセット' }));

    expect(screen.getByText('入力をリセットしますか？')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '総ゲーム数' })).toHaveValue('2500');

    await user.click(screen.getByRole('button', { name: 'リセットする' }));

    expect(screen.queryByText('入力をリセットしますか？')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '総ゲーム数' })).toHaveValue('');
  });

  it('resets the special bonus form after adding an entry and supports unknown trigger', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '設定推測' })[0]);

    await user.click(await screen.findAllByRole('button', { name: '追加・確認' }).then((buttons) => buttons[0]));
    expect(await screen.findByRole('option', { name: '不明' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '当選契機' }), '単独');
    await user.selectOptions(screen.getByRole('combobox', { name: 'BB / REG' }), 'REG');
    await user.selectOptions(screen.getByRole('combobox', { name: '当選色' }), '白');
    await user.click(screen.getByRole('button', { name: 'このボーナスを1件追加' }));

    expect(screen.getByRole('combobox', { name: '当選契機' })).toHaveValue('不明');
    expect(screen.getByRole('combobox', { name: 'BB / REG' })).toHaveValue('BIG');
    expect(screen.getByRole('combobox', { name: '当選色' })).toHaveValue('赤異色');
    expect(screen.getByText('単独 / REG / 白')).toBeInTheDocument();
  });

  it('manages truth point events inside a modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '設定推測' })[0]);
    await user.click((await screen.findAllByRole('button', { name: '追加・確認' }))[1]);

    expect(await screen.findByText('真実ポイントを追加')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '真実ポイント' }), '200pt');
    await user.click(screen.getByRole('button', { name: 'このイベントを1件追加' }));

    expect(screen.getByText('真実ポイント: 200pt')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '真実ポイント モーダルを閉じる' }));

    expect(screen.queryByText('真実ポイントを追加')).not.toBeInTheDocument();
    expect(screen.getAllByText('1件記録済み').length).toBeGreaterThan(0);
  });

  it('confirms before clearing a setting inference field', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '設定推測' })[0]);

    const totalGamesInput = await screen.findByRole('textbox', { name: '総ゲーム数' });
    await user.clear(totalGamesInput);
    await user.type(totalGamesInput, '3000');
    await user.click(screen.getAllByRole('button', { name: 'クリア' })[0]);

    expect(screen.getByText('総ゲーム数 をクリアしますか？')).toBeInTheDocument();
    expect(totalGamesInput).toHaveValue('3000');

    await user.click(screen.getByRole('button', { name: 'クリアする' }));

    expect(screen.queryByText('総ゲーム数 をクリアしますか？')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '総ゲーム数' })).toHaveValue('');
  });

});
