import { describe, expect, it } from 'vitest';
import { calculateUmineko2Inference } from './umineko2Inference';

describe('calculateUmineko2Inference', () => {
  it('excludes blank fields from likelihood calculation', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2000',
      bigCount: '5',
      regCount: '',
      artLevel1Count: '',
      artLevel2Count: '',
      artLevel3Count: '',
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
      artLevel1Count: '',
      artLevel2Count: '',
      artLevel3Count: '',
      artCommonBellCount: '',
      artMissCount: ''
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.map((metric) => metric.key)).toEqual(['big', 'reg']);
    expect(result.result.probabilities.reduce((sum, item) => sum + item.percentage, 0)).toBeCloseTo(100, 5);
  });

  it('does not use art metrics when art levels are blank', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2500',
      bigCount: '8',
      regCount: '7',
      oneRoleBCount: '',
      oneRoleCCount: '',
      confirmedRoleACount: '',
      artLevel1Count: '',
      artLevel2Count: '',
      artLevel3Count: '',
      artCommonBellCount: '10',
      artMissCount: '3'
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.map((metric) => metric.key)).toEqual(['big', 'reg']);
    expect(result.excludedMetrics.find((metric) => metric.key === 'artCommonBell')?.reason).toBe('ARTレベル回数が未入力');
  });

  it('treats zero art level counts with zero art metrics as unmeasured', () => {
    const result = calculateUmineko2Inference({
      totalGames: '2500',
      bigCount: '8',
      regCount: '7',
      artLevel1Count: '0',
      artLevel2Count: '0',
      artLevel3Count: '0',
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
      regGameCount: '10',
      regDiagonalBlue7Count: '8',
      regParallelBlue7Count: '4',
      artLevel1Count: '1',
      artLevel2Count: '1',
      artLevel3Count: '0',
      artCommonBellCount: '101',
      artMissCount: '0',
      level2NaviSameColorTrialCount: '3',
      level2NaviSameColorSuccessCount: '4'
    });

    expect(result.errors).toContain('BIG回数が総ゲーム数を超えています');
    expect(result.errors).toContain('REG中の青7揃い回数合計がREGゲーム数を超えています');
    expect(result.errors).toContain('ART中共通ベル回数がARTゲーム数を超えています');
    expect(result.errors).toContain('同色BB後のLv2ナビの発生回数が試行回数を超えています');
    expect(result.result).toBeNull();
  });

  it('uses total games plus art games as trials for sub-role metrics', () => {
    const result = calculateUmineko2Inference({
      totalGames: '1000',
      bigCount: '5',
      regCount: '4',
      artLevel1Count: '10',
      artLevel2Count: '0',
      artLevel3Count: '0',
      oneRoleBCount: '1200'
    });

    expect(result.errors).toEqual([]);
    expect(result.usedMetrics.find((metric) => metric.key === 'oneRoleB')).toMatchObject({
      key: 'oneRoleB',
      trials: 1300,
      successes: 1200
    });
  });

  it('returns validation errors when sub-role counts exceed total games plus art games', () => {
    const result = calculateUmineko2Inference({
      totalGames: '1000',
      bigCount: '5',
      regCount: '4',
      artLevel1Count: '10',
      artLevel2Count: '0',
      artLevel3Count: '0',
      oneRoleCCount: '1301'
    });

    expect(result.errors).toContain('1枚役Cが総ゲーム数とARTゲーム数の合計を超えています');
    expect(result.result).toBeNull();
  });

  it('normalizes probabilities to 100 percent', () => {
    const result = calculateUmineko2Inference({
      totalGames: '4200',
      bigCount: '14',
      regCount: '13',
      artLevel1Count: '10',
      artLevel2Count: '8',
      artLevel3Count: '3',
      artCommonBellCount: '30',
      artMissCount: '12'
    });

    expect(result.errors).toEqual([]);
    expect(result.result.probabilities.reduce((sum, item) => sum + item.percentage, 0)).toBeCloseTo(100, 5);
  });

  it('raises 4+ probability when art common bell is high-setting leaning', () => {
    const lowArt = calculateUmineko2Inference({
      totalGames: '4000',
      bigCount: '12',
      regCount: '11',
      artLevel1Count: '10',
      artLevel2Count: '8',
      artLevel3Count: '1',
      artCommonBellCount: '20',
      artMissCount: '14'
    });
    const highArt = calculateUmineko2Inference({
      totalGames: '4000',
      bigCount: '12',
      regCount: '11',
      artLevel1Count: '10',
      artLevel2Count: '8',
      artLevel3Count: '1',
      artCommonBellCount: '36',
      artMissCount: '14'
    });

    expect(highArt.result.probabilityOverEqual4).toBeGreaterThan(lowArt.result.probabilityOverEqual4);
  });

  it('uses truth point events in the likelihood calculation', () => {
    const lowTruth = calculateUmineko2Inference({
      totalGames: '3200',
      bigCount: '10',
      regCount: '8',
      truthPointEvents: [{ id: '1', point: '30pt' }, { id: '2', point: '30pt' }, { id: '3', point: '50pt' }]
    });
    const highTruth = calculateUmineko2Inference({
      totalGames: '3200',
      bigCount: '10',
      regCount: '8',
      truthPointEvents: [{ id: '1', point: '70pt' }, { id: '2', point: '200pt' }, { id: '3', point: '200pt' }]
    });

    expect(lowTruth.usedMetrics.map((metric) => metric.key)).toContain('truthPointPattern');
    expect(highTruth.result.probabilityOverEqual4).toBeGreaterThan(lowTruth.result.probabilityOverEqual4);
  });

  it('uses replay reg special bonuses when recorded', () => {
    const noReplayReg = calculateUmineko2Inference({
      totalGames: '4000',
      bigCount: '12',
      regCount: '10',
      specialBonuses: []
    });
    const withReplayReg = calculateUmineko2Inference({
      totalGames: '4000',
      bigCount: '12',
      regCount: '10',
      specialBonuses: [
        { id: '1', trigger: 'リプレイ', bonusType: 'REG', bonusColor: '白' },
        { id: '2', trigger: 'リプレイ', bonusType: 'REG', bonusColor: '赤' }
      ]
    });

    expect(withReplayReg.usedMetrics.map((metric) => metric.key)).toContain('replayReg');
    expect(withReplayReg.result.probabilityOverEqual4).toBeGreaterThan(noReplayReg.result.probabilityOverEqual4);
  });

  it('uses level2 navi trial and success counts', () => {
    const lowLevel2 = calculateUmineko2Inference({
      totalGames: '3000',
      bigCount: '9',
      regCount: '8',
      level2NaviOtherTrialCount: '20',
      level2NaviOtherSuccessCount: '3'
    });
    const highLevel2 = calculateUmineko2Inference({
      totalGames: '3000',
      bigCount: '9',
      regCount: '8',
      level2NaviOtherTrialCount: '20',
      level2NaviOtherSuccessCount: '8'
    });

    expect(highLevel2.usedMetrics.map((metric) => metric.key)).toContain('level2NaviOther');
    expect(highLevel2.result.probabilityOverEqual4).toBeGreaterThan(lowLevel2.result.probabilityOverEqual4);
  });
});
