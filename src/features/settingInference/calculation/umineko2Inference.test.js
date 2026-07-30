import { describe, expect, it } from 'vitest';
import { calculateUmineko2Inference } from './umineko2Inference';

describe('calculateUmineko2Inference', () => {
  it('excludes blank fields from likelihood calculation', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2000',
      bigCount: '5',
      regCount: '',
      artGames: '',
      artCommonBellCount: '',
      artMissCount: ''
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.map((metric) => metric.key)).toEqual(['big']);
    expect(result.excludedMetrics.map((metric) => metric.key)).toContain('reg');
    expect(result.excludedMetrics.map((metric) => metric.key)).toContain('artCommonBell');
    expect(result.excludedMetrics.map((metric) => metric.key)).toContain('artMiss');
  });

  it('treats zero counts as valid observations', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2000',
      bigCount: '0',
      regCount: '0',
      artGames: '',
      artCommonBellCount: '',
      artMissCount: ''
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.map((metric) => metric.key)).toEqual(['big', 'reg']);
    expect(result.result.probabilities.reduce((sum, item) => sum + item.percentage, 0)).toBe(100);
  });

  it('does not use art metrics when art games are blank', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2500',
      bigCount: '8',
      regCount: '7',
      artGames: '',
      artCommonBellCount: '10',
      artMissCount: '3'
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.map((metric) => metric.key)).toEqual(['big', 'reg']);
    expect(result.excludedMetrics.find((metric) => metric.key === 'artCommonBell')?.reason).toBe('ARTゲーム数が未入力');
  });

  it('treats artGames=0 with zero counts as unmeasured', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2500',
      bigCount: '8',
      regCount: '7',
      artGames: '0',
      artCommonBellCount: '0',
      artMissCount: '0'
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.map((metric) => metric.key)).toEqual(['big', 'reg']);
    expect(result.excludedMetrics.find((metric) => metric.key === 'artCommonBell')?.reason).toBe('ARTゲーム数0は未計測扱い');
  });

  it('returns validation errors when event counts exceed trials', () => {
    const result = calculateUmineko2Inference({
      totalGames: '1000',
      bigCount: '1001',
      regCount: '1',
      artGames: '100',
      artCommonBellCount: '101',
      artMissCount: '0'
    });

    expect(result.errors).toContain('BIG回数が総ゲーム数を超えています');
    expect(result.errors).toContain('ART中共通ベル回数がARTゲーム数を超えています');
    expect(result.result).toBeNull();
  });

  it('normalizes probabilities to 100 percent', () => {
    const result = calculateUmineko2Inference({
      totalGames: '4200',
      bigCount: '14',
      regCount: '13',
      artGames: '700',
      artCommonBellCount: '30',
      artMissCount: '12'
    });

    expect(result.errors).toEqual([]);
    expect(result.result.probabilities.reduce((sum, item) => sum + item.percentage, 0)).toBe(100);
  });

  it('raises 4+ probability when art common bell is high-setting leaning', () => {
    const lowArt = calculateUmineko2Inference({
      totalGames: '4000',
      bigCount: '12',
      regCount: '11',
      artGames: '800',
      artCommonBellCount: '20',
      artMissCount: '14'
    });
    const highArt = calculateUmineko2Inference({
      totalGames: '4000',
      bigCount: '12',
      regCount: '11',
      artGames: '800',
      artCommonBellCount: '36',
      artMissCount: '14'
    });

    expect(highArt.result.probabilityOverEqual4).toBeGreaterThan(lowArt.result.probabilityOverEqual4);
  });
});
