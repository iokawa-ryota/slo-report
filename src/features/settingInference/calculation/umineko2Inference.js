import {
  UMINEKO2_CALCULATION_VERSION,
  UMINEKO2_PHASE1_FIELDS,
  UMINEKO2_PROBABILITIES,
  UMINEKO2_SCHEMA_VERSION,
  UMINEKO2_SETTING_LABELS
} from '../config/umineko2.js';

const METRIC_KEYS = {
  big: 'big',
  reg: 'reg',
  artCommonBell: 'artCommonBell',
  artMiss: 'artMiss',
  oneRoleB: 'oneRoleB',
  oneRoleC: 'oneRoleC',
  confirmedRoleA: 'confirmedRoleA',
  replayReg: 'replayReg',
  oneRoleCRedBig: 'oneRoleCRedBig',
  confirmedRoleARedBig: 'confirmedRoleARedBig',
  regBlue7Pattern: 'regBlue7Pattern',
  logoFlashPattern: 'logoFlashPattern',
  truthPointPattern: 'truthPointPattern',
  level2NaviSameColor: 'level2NaviSameColor',
  level2NaviDifferentColor: 'level2NaviDifferentColor',
  level2NaviOther: 'level2NaviOther'
};

const SAMPLE_WARNING_GAMES = 1500;
const SAMPLE_WARNING_ART_GAMES = 300;
const LOG_FLOOR = 1e-12;
const ART_LEVEL_GAME_COUNTS = {
  artLevel1Count: 30,
  artLevel2Count: 50,
  artLevel3Count: 90
};

const safeLog = (value) => Math.log(Math.max(value, LOG_FLOOR));

const parseOptionalCount = (value, label, errors) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    errors.push(`${label}は0以上の整数で入力してください`);
    return null;
  }

  return parsed;
};

const buildPercentages = (probabilities) => {
  const exactPercentages = probabilities.map((value) => value * 1000);
  const floors = exactPercentages.map((value) => Math.floor(value));
  const remainders = exactPercentages.map((value, index) => ({
    index,
    remainder: value - floors[index]
  }));
  let remaining = 1000 - floors.reduce((sum, value) => sum + value, 0);

  remainders.sort((a, b) => b.remainder - a.remainder);
  while (remaining > 0) {
    const next = remainders.shift();
    if (!next) break;
    floors[next.index] += 1;
    remaining -= 1;
  }

  return floors.map((value) => value / 10);
};

const softmaxFromLogLikelihoods = (logLikelihoods) => {
  const maxLog = Math.max(...logLikelihoods);
  const exps = logLikelihoods.map((value) => Math.exp(value - maxLog));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
};

const binomialLogLikelihood = (trials, successes, probability) => {
  const p = Math.min(Math.max(probability, LOG_FLOOR), 1 - LOG_FLOOR);
  return (successes * safeLog(p)) + ((trials - successes) * safeLog(1 - p));
};

const categoricalLogLikelihood = (counts, probabilities) => (
  counts.reduce((sum, count, index) => (
    sum + (count * safeLog(probabilities[index]))
  ), 0)
);

const pushExcluded = (excludedMetrics, key, reason) => {
  excludedMetrics.push({
    key,
    label: UMINEKO2_PROBABILITIES[key]?.label || key,
    reason
  });
};

const countSpecialBonuses = (specialBonuses = []) => specialBonuses.reduce((accumulator, entry) => {
  const next = { ...accumulator };

  if (entry.trigger === 'リプレイ' && entry.bonusType === 'REG') {
    next.replayReg += 1;
  }
  if (entry.trigger === '1枚役C' && entry.bonusType === 'BIG' && entry.bonusColor === '赤同色') {
    next.oneRoleCRedBig += 1;
  }
  if (entry.trigger === '確定役' && entry.bonusType === 'BIG' && entry.bonusColor === '赤異色') {
    next.confirmedRoleARedBig += 1;
  }

  return next;
}, {
  replayReg: 0,
  oneRoleCRedBig: 0,
  confirmedRoleARedBig: 0
});

const countTruthPointEvents = (truthPointEvents = []) => truthPointEvents.reduce((counts, entry) => ({
  ...counts,
  [entry.point]: (counts[entry.point] || 0) + 1
}), {
  '30pt': 0,
  '50pt': 0,
  '70pt': 0,
  '200pt': 0
});

export const validateUmineko2Input = (rawInput) => {
  const errors = [];
  const normalizedInput = {
    totalGames: parseOptionalCount(rawInput.totalGames, UMINEKO2_PHASE1_FIELDS.totalGames.label, errors),
    bigCount: parseOptionalCount(rawInput.bigCount, UMINEKO2_PHASE1_FIELDS.bigCount.label, errors),
    regCount: parseOptionalCount(rawInput.regCount, UMINEKO2_PHASE1_FIELDS.regCount.label, errors),
    bigBitaTrialCount: parseOptionalCount(rawInput.bigBitaTrialCount, 'BIGビタ分母', errors),
    bigBitaSuccessCount: parseOptionalCount(rawInput.bigBitaSuccessCount, 'BIGビタ成功', errors),
    regGameCount: parseOptionalCount(rawInput.regGameCount, 'REGゲーム数', errors),
    regDiagonalBlue7Count: parseOptionalCount(rawInput.regDiagonalBlue7Count, 'REG斜め青7', errors),
    regParallelBlue7Count: parseOptionalCount(rawInput.regParallelBlue7Count, 'REG平行青7', errors),
    artLevel1Count: parseOptionalCount(rawInput.artLevel1Count, UMINEKO2_PHASE1_FIELDS.artLevel1Count.label, errors),
    artLevel2Count: parseOptionalCount(rawInput.artLevel2Count, UMINEKO2_PHASE1_FIELDS.artLevel2Count.label, errors),
    artLevel3Count: parseOptionalCount(rawInput.artLevel3Count, UMINEKO2_PHASE1_FIELDS.artLevel3Count.label, errors),
    artCommonBellCount: parseOptionalCount(rawInput.artCommonBellCount, UMINEKO2_PHASE1_FIELDS.artCommonBellCount.label, errors),
    artMissCount: parseOptionalCount(rawInput.artMissCount, UMINEKO2_PHASE1_FIELDS.artMissCount.label, errors),
    logoFlashSmallCount: parseOptionalCount(rawInput.logoFlashSmallCount, 'ロゴ発光（小）', errors),
    logoFlashLargeCount: parseOptionalCount(rawInput.logoFlashLargeCount, 'ロゴ発光（大）', errors),
    oneRoleACount: parseOptionalCount(rawInput.oneRoleACount, '1枚役A', errors),
    oneRoleBCount: parseOptionalCount(rawInput.oneRoleBCount, '1枚役B', errors),
    oneRoleCCount: parseOptionalCount(rawInput.oneRoleCCount, '1枚役C', errors),
    confirmedRoleACount: parseOptionalCount(rawInput.confirmedRoleACount, '確定役A', errors),
    level2NaviSameColorTrialCount: parseOptionalCount(rawInput.level2NaviSameColorTrialCount, '同色BB後のART突入リプレイ回数', errors),
    level2NaviSameColorSuccessCount: parseOptionalCount(rawInput.level2NaviSameColorSuccessCount, '同色BB後のLv2ナビ発生回数', errors),
    level2NaviDifferentColorTrialCount: parseOptionalCount(rawInput.level2NaviDifferentColorTrialCount, '異色BB後のART突入リプレイ回数', errors),
    level2NaviDifferentColorSuccessCount: parseOptionalCount(rawInput.level2NaviDifferentColorSuccessCount, '異色BB後のLv2ナビ発生回数', errors),
    level2NaviOtherTrialCount: parseOptionalCount(rawInput.level2NaviOtherTrialCount, 'RB後・その他のART突入リプレイ回数', errors),
    level2NaviOtherSuccessCount: parseOptionalCount(rawInput.level2NaviOtherSuccessCount, 'RB後・その他のLv2ナビ発生回数', errors),
    specialBonuses: Array.isArray(rawInput.specialBonuses) ? rawInput.specialBonuses : [],
    truthPointEvents: Array.isArray(rawInput.truthPointEvents) ? rawInput.truthPointEvents : [],
    level2NaviEvents: Array.isArray(rawInput.level2NaviEvents) ? rawInput.level2NaviEvents : []
  };

  const hasAnyArtLevelInput = ['artLevel1Count', 'artLevel2Count', 'artLevel3Count']
    .some((key) => normalizedInput[key] !== null);
  const derivedArtGames = hasAnyArtLevelInput
    ? (
      (normalizedInput.artLevel1Count || 0) * ART_LEVEL_GAME_COUNTS.artLevel1Count +
      (normalizedInput.artLevel2Count || 0) * ART_LEVEL_GAME_COUNTS.artLevel2Count +
      (normalizedInput.artLevel3Count || 0) * ART_LEVEL_GAME_COUNTS.artLevel3Count
    )
    : null;
  normalizedInput.artGames = derivedArtGames;

  const totalGamesDependentCounts = [
    ['BIG回数', normalizedInput.bigCount],
    ['REG回数', normalizedInput.regCount],
    ['1枚役B', normalizedInput.oneRoleBCount],
    ['1枚役C', normalizedInput.oneRoleCCount],
    ['確定役A', normalizedInput.confirmedRoleACount]
  ];

  if (normalizedInput.totalGames !== null) {
    if (normalizedInput.totalGames === 0) {
      totalGamesDependentCounts.forEach(([label, count]) => {
        if ((count || 0) > 0) {
          errors.push(`総ゲーム数が0の場合、${label}は0を超えられません`);
        }
      });
    } else {
      totalGamesDependentCounts.forEach(([label, count]) => {
        if (count !== null && count > normalizedInput.totalGames) {
          errors.push(`${label}が総ゲーム数を超えています`);
        }
      });
    }
  }

  if (normalizedInput.artGames !== null) {
    if (normalizedInput.artGames === 0) {
      if ((normalizedInput.artCommonBellCount || 0) > 0 || (normalizedInput.artMissCount || 0) > 0) {
        errors.push('ARTゲーム数が0の場合、ART中共通ベル回数とART中ハズレ回数は0を超えられません');
      }
    } else {
      if (normalizedInput.artCommonBellCount !== null && normalizedInput.artCommonBellCount > normalizedInput.artGames) {
        errors.push('ART中共通ベル回数がARTゲーム数を超えています');
      }
      if (normalizedInput.artMissCount !== null && normalizedInput.artMissCount > normalizedInput.artGames) {
        errors.push('ART中ハズレ回数がARTゲーム数を超えています');
      }
    }
  }

  if (normalizedInput.regGameCount !== null) {
    const diagonal = normalizedInput.regDiagonalBlue7Count || 0;
    const parallel = normalizedInput.regParallelBlue7Count || 0;

    if (normalizedInput.regGameCount === 0) {
      if (diagonal > 0 || parallel > 0) {
        errors.push('REGゲーム数が0の場合、青7揃い回数は0を超えられません');
      }
    } else if (diagonal + parallel > normalizedInput.regGameCount) {
      errors.push('REG中の青7揃い回数合計がREGゲーム数を超えています');
    }
  } else if (normalizedInput.regDiagonalBlue7Count !== null || normalizedInput.regParallelBlue7Count !== null) {
    errors.push('REG中の青7揃いを使うにはREGゲーム数の入力が必要です');
  }

  [
    {
      trialKey: 'level2NaviSameColorTrialCount',
      successKey: 'level2NaviSameColorSuccessCount',
      label: '同色BB後のLv2ナビ'
    },
    {
      trialKey: 'level2NaviDifferentColorTrialCount',
      successKey: 'level2NaviDifferentColorSuccessCount',
      label: '異色BB後のLv2ナビ'
    },
    {
      trialKey: 'level2NaviOtherTrialCount',
      successKey: 'level2NaviOtherSuccessCount',
      label: 'RB後・その他のLv2ナビ'
    }
  ].forEach(({ trialKey, successKey, label }) => {
    const trials = normalizedInput[trialKey];
    const successes = normalizedInput[successKey];

    if (trials === null && successes === null) {
      return;
    }
    if (trials === null) {
      errors.push(`${label}を使うには試行回数の入力が必要です`);
      return;
    }
    if (successes === null) {
      errors.push(`${label}を使うには発生回数の入力が必要です`);
      return;
    }
    if (trials === 0 && successes > 0) {
      errors.push(`${label}の発生回数が試行回数を超えています`);
      return;
    }
    if (successes > trials) {
      errors.push(`${label}の発生回数が試行回数を超えています`);
    }
  });

  return { normalizedInput, errors };
};

const buildUsedAndExcludedMetrics = (normalizedInput) => {
  const usedMetrics = [];
  const excludedMetrics = [];

  const pushBinomialMetric = (key, trials, successes) => {
    usedMetrics.push({
      key,
      label: UMINEKO2_PROBABILITIES[key].label,
      type: 'binomial',
      trials,
      successes
    });
  };

  const pushCategoricalMetric = (key, counts) => {
    usedMetrics.push({
      key,
      label: UMINEKO2_PROBABILITIES[key].label,
      type: 'categorical',
      counts
    });
  };

  const specialBonusCounts = countSpecialBonuses(normalizedInput.specialBonuses);
  const truthPointCounts = countTruthPointEvents(normalizedInput.truthPointEvents);
  const truthPointTotal = Object.values(truthPointCounts).reduce((sum, value) => sum + value, 0);

  if (normalizedInput.totalGames === null) {
    [
      METRIC_KEYS.big,
      METRIC_KEYS.reg,
      METRIC_KEYS.oneRoleB,
      METRIC_KEYS.oneRoleC,
      METRIC_KEYS.confirmedRoleA,
      METRIC_KEYS.replayReg,
      METRIC_KEYS.oneRoleCRedBig,
      METRIC_KEYS.confirmedRoleARedBig
    ].forEach((key) => pushExcluded(excludedMetrics, key, '総ゲーム数が未入力'));
  } else if (normalizedInput.totalGames === 0) {
    [
      METRIC_KEYS.big,
      METRIC_KEYS.reg,
      METRIC_KEYS.oneRoleB,
      METRIC_KEYS.oneRoleC,
      METRIC_KEYS.confirmedRoleA,
      METRIC_KEYS.replayReg,
      METRIC_KEYS.oneRoleCRedBig,
      METRIC_KEYS.confirmedRoleARedBig
    ].forEach((key) => pushExcluded(excludedMetrics, key, '総ゲーム数0は未計測扱い'));
  } else {
    if (normalizedInput.bigCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.big, 'BIG回数が未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.big, normalizedInput.totalGames, normalizedInput.bigCount);
    }

    if (normalizedInput.regCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.reg, 'REG回数が未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.reg, normalizedInput.totalGames, normalizedInput.regCount);
    }

    if (normalizedInput.oneRoleBCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.oneRoleB, '1枚役Bが未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.oneRoleB, normalizedInput.totalGames, normalizedInput.oneRoleBCount);
    }

    if (normalizedInput.oneRoleCCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.oneRoleC, '1枚役Cが未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.oneRoleC, normalizedInput.totalGames, normalizedInput.oneRoleCCount);
    }

    if (normalizedInput.confirmedRoleACount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.confirmedRoleA, '確定役Aが未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.confirmedRoleA, normalizedInput.totalGames, normalizedInput.confirmedRoleACount);
    }

    if (specialBonusCounts.replayReg > 0) {
      pushBinomialMetric(METRIC_KEYS.replayReg, normalizedInput.totalGames, specialBonusCounts.replayReg);
    } else {
      pushExcluded(excludedMetrics, METRIC_KEYS.replayReg, '該当する特定ボーナス履歴が未入力');
    }

    if (specialBonusCounts.oneRoleCRedBig > 0) {
      pushBinomialMetric(METRIC_KEYS.oneRoleCRedBig, normalizedInput.totalGames, specialBonusCounts.oneRoleCRedBig);
    } else {
      pushExcluded(excludedMetrics, METRIC_KEYS.oneRoleCRedBig, '該当する特定ボーナス履歴が未入力');
    }

    if (specialBonusCounts.confirmedRoleARedBig > 0) {
      pushBinomialMetric(METRIC_KEYS.confirmedRoleARedBig, normalizedInput.totalGames, specialBonusCounts.confirmedRoleARedBig);
    } else {
      pushExcluded(excludedMetrics, METRIC_KEYS.confirmedRoleARedBig, '該当する特定ボーナス履歴が未入力');
    }
  }

  if (normalizedInput.artGames === null) {
    pushExcluded(excludedMetrics, METRIC_KEYS.artCommonBell, 'ARTレベル回数が未入力');
    pushExcluded(excludedMetrics, METRIC_KEYS.artMiss, 'ARTレベル回数が未入力');
  } else if (normalizedInput.artGames === 0) {
    pushExcluded(excludedMetrics, METRIC_KEYS.artCommonBell, 'ARTゲーム数0は未計測扱い');
    pushExcluded(excludedMetrics, METRIC_KEYS.artMiss, 'ARTゲーム数0は未計測扱い');
  } else {
    if (normalizedInput.artCommonBellCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.artCommonBell, 'ART中共通ベル回数が未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.artCommonBell, normalizedInput.artGames, normalizedInput.artCommonBellCount);
    }

    if (normalizedInput.artMissCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.artMiss, 'ART中ハズレ回数が未入力');
    } else {
      pushBinomialMetric(METRIC_KEYS.artMiss, normalizedInput.artGames, normalizedInput.artMissCount);
    }
  }

  if (normalizedInput.regGameCount === null) {
    pushExcluded(excludedMetrics, METRIC_KEYS.regBlue7Pattern, 'REGゲーム数が未入力');
  } else if (normalizedInput.regGameCount === 0) {
    pushExcluded(excludedMetrics, METRIC_KEYS.regBlue7Pattern, 'REGゲーム数0は未計測扱い');
  } else if (normalizedInput.regDiagonalBlue7Count === null || normalizedInput.regParallelBlue7Count === null) {
    pushExcluded(excludedMetrics, METRIC_KEYS.regBlue7Pattern, 'REG中青7揃い回数が未入力');
  } else {
    pushCategoricalMetric(METRIC_KEYS.regBlue7Pattern, [
      normalizedInput.regDiagonalBlue7Count,
      normalizedInput.regParallelBlue7Count,
      normalizedInput.regGameCount - normalizedInput.regDiagonalBlue7Count - normalizedInput.regParallelBlue7Count
    ]);
  }

  if (normalizedInput.logoFlashSmallCount === null || normalizedInput.logoFlashLargeCount === null) {
    pushExcluded(excludedMetrics, METRIC_KEYS.logoFlashPattern, 'ロゴ発光の小と大を両方入力してください');
  } else {
    const totalFlashCount = normalizedInput.logoFlashSmallCount + normalizedInput.logoFlashLargeCount;
    if (totalFlashCount === 0) {
      pushExcluded(excludedMetrics, METRIC_KEYS.logoFlashPattern, 'ロゴ発光が0回のため未計測扱い');
    } else {
      pushCategoricalMetric(METRIC_KEYS.logoFlashPattern, [
        normalizedInput.logoFlashSmallCount,
        normalizedInput.logoFlashLargeCount
      ]);
    }
  }

  if (truthPointTotal === 0) {
    pushExcluded(excludedMetrics, METRIC_KEYS.truthPointPattern, '真実ポイント履歴が未入力');
  } else {
    pushCategoricalMetric(METRIC_KEYS.truthPointPattern, [
      truthPointCounts['30pt'],
      truthPointCounts['50pt'],
      truthPointCounts['70pt'],
      truthPointCounts['200pt']
    ]);
  }

  [
    {
      key: METRIC_KEYS.level2NaviSameColor,
      trialKey: 'level2NaviSameColorTrialCount',
      successKey: 'level2NaviSameColorSuccessCount',
      missingReason: '同色BB後のLv2ナビ試行/発生回数が未入力'
    },
    {
      key: METRIC_KEYS.level2NaviDifferentColor,
      trialKey: 'level2NaviDifferentColorTrialCount',
      successKey: 'level2NaviDifferentColorSuccessCount',
      missingReason: '異色BB後のLv2ナビ試行/発生回数が未入力'
    },
    {
      key: METRIC_KEYS.level2NaviOther,
      trialKey: 'level2NaviOtherTrialCount',
      successKey: 'level2NaviOtherSuccessCount',
      missingReason: 'RB後・その他のLv2ナビ試行/発生回数が未入力'
    }
  ].forEach(({ key, trialKey, successKey, missingReason }) => {
    const trials = normalizedInput[trialKey];
    const successes = normalizedInput[successKey];

    if (trials === null && successes === null) {
      pushExcluded(excludedMetrics, key, missingReason);
      return;
    }
    if (trials === 0 && successes === 0) {
      pushExcluded(excludedMetrics, key, '試行回数0は未計測扱い');
      return;
    }
    if (trials !== null && successes !== null) {
      pushBinomialMetric(key, trials, successes);
    }
  });

  if (normalizedInput.oneRoleACount !== null) {
    excludedMetrics.push({
      key: 'oneRoleA',
      label: '1枚役A',
      reason: '1geki掲載の設定差対象外のため推測には未使用'
    });
  }

  if (normalizedInput.bigBitaTrialCount !== null || normalizedInput.bigBitaSuccessCount !== null) {
    excludedMetrics.push({
      key: 'bigBita',
      label: 'BIGビタ成功率',
      reason: '1geki掲載の設定推測項目ではないため未使用'
    });
  }

  return { usedMetrics, excludedMetrics };
};

const buildWarnings = (normalizedInput, usedMetrics) => {
  const warnings = [];

  if (usedMetrics.length === 0) {
    warnings.push('推測に使える項目がまだありません');
    return warnings;
  }

  if ((normalizedInput.totalGames || 0) > 0 && normalizedInput.totalGames < SAMPLE_WARNING_GAMES) {
    warnings.push(`総ゲーム数が${SAMPLE_WARNING_GAMES}G未満です`);
  }

  if ((normalizedInput.artGames || 0) > 0 && normalizedInput.artGames < SAMPLE_WARNING_ART_GAMES) {
    warnings.push(`ARTゲーム数が${SAMPLE_WARNING_ART_GAMES}G未満です`);
  }

  return warnings;
};

const getMetricLogLikelihood = (metric, settingIndex) => {
  const config = UMINEKO2_PROBABILITIES[metric.key];

  if (config.type === 'binomial') {
    return binomialLogLikelihood(metric.trials, metric.successes, 1 / config.denominators[settingIndex]);
  }
  if (config.type === 'binomialProbability') {
    return binomialLogLikelihood(metric.trials, metric.successes, config.probabilities[settingIndex]);
  }
  if (config.type === 'categorical') {
    return categoricalLogLikelihood(metric.counts, config.probabilitiesBySetting[settingIndex]);
  }

  return 0;
};

export const calculateUmineko2Inference = (rawInput) => {
  const { normalizedInput, errors } = validateUmineko2Input(rawInput);
  const { usedMetrics, excludedMetrics } = buildUsedAndExcludedMetrics(normalizedInput);

  if (errors.length > 0) {
    return {
      machineId: 'umineko2',
      schemaVersion: UMINEKO2_SCHEMA_VERSION,
      calculationVersion: UMINEKO2_CALCULATION_VERSION,
      input: normalizedInput,
      result: null,
      errors,
      usedMetrics,
      excludedMetrics
    };
  }

  const warnings = buildWarnings(normalizedInput, usedMetrics);
  const logLikelihoods = UMINEKO2_SETTING_LABELS.map((_, settingIndex) => (
    usedMetrics.reduce((sum, metric) => sum + getMetricLogLikelihood(metric, settingIndex), 0)
  ));

  const exactProbabilities = usedMetrics.length > 0
    ? softmaxFromLogLikelihoods(logLikelihoods)
    : UMINEKO2_SETTING_LABELS.map(() => 1 / UMINEKO2_SETTING_LABELS.length);
  const percentages = buildPercentages(exactProbabilities);

  const probabilities = UMINEKO2_SETTING_LABELS.map((setting, index) => ({
    setting,
    logLikelihood: logLikelihoods[index] || 0,
    probability: exactProbabilities[index],
    percentage: percentages[index]
  }));

  const mostLikelySetting = probabilities.reduce((best, current) => (
    current.probability > best.probability ? current : best
  ), probabilities[0]);
  const probabilityOverEqual4 = probabilities
    .filter((item) => item.setting >= 4)
    .reduce((sum, item) => sum + item.probability, 0);
  const probabilityOverEqual5 = probabilities
    .filter((item) => item.setting >= 5)
    .reduce((sum, item) => sum + item.probability, 0);

  return {
    machineId: 'umineko2',
    schemaVersion: UMINEKO2_SCHEMA_VERSION,
    calculationVersion: UMINEKO2_CALCULATION_VERSION,
    input: normalizedInput,
    errors: [],
    usedMetrics,
    excludedMetrics,
    result: {
      probabilities,
      mostLikelySetting: mostLikelySetting.setting,
      probabilityOverEqual4,
      probabilityOverEqual5,
      percentageOverEqual4: Math.round(probabilityOverEqual4 * 1000) / 10,
      percentageOverEqual5: Math.round(probabilityOverEqual5 * 1000) / 10,
      warnings,
      isSampleInsufficient: warnings.length > 0
    }
  };
};
