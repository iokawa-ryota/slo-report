/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSettingInferenceDraft,
  getSettingInferenceDraftKey,
  loadSettingInferenceDraft,
  saveSettingInferenceDraft
} from './draftStorage';

describe('draftStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves the distinction between blank and zero values', () => {
    saveSettingInferenceDraft({
      sessionId: 'session-1',
      input: {
        totalGames: '',
        bigCount: '0',
        regCount: '',
        artGames: '0',
        artCommonBellCount: '',
        artMissCount: '0'
      }
    });

    const restored = loadSettingInferenceDraft();

    expect(restored.sessionId).toBe('session-1');
    expect(restored.input.totalGames).toBe('');
    expect(restored.input.bigCount).toBe('0');
    expect(restored.input.artGames).toBe('0');
    expect(restored.input.artCommonBellCount).toBe('');
    expect(restored.input.artMissCount).toBe('0');
  });

  it('clears only the machine-specific draft key', () => {
    saveSettingInferenceDraft({
      sessionId: 'session-2',
      input: {
        totalGames: '1000',
        bigCount: '',
        regCount: '',
        artGames: '',
        artCommonBellCount: '',
        artMissCount: ''
      }
    });

    clearSettingInferenceDraft();

    expect(localStorage.getItem(getSettingInferenceDraftKey('umineko2'))).toBeNull();
  });
});
