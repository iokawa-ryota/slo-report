import { describe, expect, it } from 'vitest';
import { calculateInputStats, calculateLoss } from './recordCalculations';

const baseFormData = {
  totalGames: '3000',
  bigCount: '10',
  regCount: '8',
  startTotalGames: '500',
  startBigCount: '2',
  startRegCount: '1',
  techMissCount: '3',
  techAttemptCount: '20',
  midSuccess: '5',
  midMiss: '2',
  rightSuccess: '4',
  rightMiss: '1',
  watermelonLossCount: '2',
  cherryLossCount: '3',
  otherLossCount: '7'
};

describe('calculateInputStats', () => {
  it('calculates simple mode stats and accuracy', () => {
    const result = calculateInputStats({
      formData: baseFormData,
      isMidStart: true,
      calcMode: 'simple',
      detailFields: { mid: true, right: true }
    });

    expect(result.personal.games).toBe(2500);
    expect(result.personal.big).toBe(8);
    expect(result.personal.reg).toBe(7);
    expect(result.personal.bigProb).toBe('312.5');
    expect(result.personal.regProb).toBe('357.1');
    expect(result.personal.combinedProb).toBe('166.7');
    expect(result.personal.techAccuracy).toBe('85.0');
  });

  it('ignores mid inputs when machine detailFields.mid is false', () => {
    const result = calculateInputStats({
      formData: baseFormData,
      isMidStart: false,
      calcMode: 'detail',
      detailFields: { mid: false, right: true }
    });

    expect(result.personal.games).toBe(3000);
    expect(result.personal.techAccuracy).toBe('80.0');
  });
});

describe('calculateLoss', () => {
  it('calculates simple mode total loss', () => {
    const result = calculateLoss({
      formData: baseFormData,
      calcMode: 'simple',
      currentConfig: {
        techLossPerMiss: 13,
        watermelonLoss: 15,
        cherryLoss: 4
      },
      detailFields: { mid: true, right: true }
    });

    expect(result.misses).toBe(3);
    expect(result.total).toBe(88);
  });

  it('ignores mid misses when detailFields.mid is false', () => {
    const result = calculateLoss({
      formData: baseFormData,
      calcMode: 'detail',
      currentConfig: {
        techLossPerMiss: 13,
        watermelonLoss: 15,
        cherryLoss: 4
      },
      detailFields: { mid: false, right: true }
    });

    expect(result.misses).toBe(1);
    expect(result.total).toBe(62);
  });
});
