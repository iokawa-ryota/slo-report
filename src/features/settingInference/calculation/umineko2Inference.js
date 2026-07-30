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
  artMiss: 'artMiss'
};

const SAMPLE_WARNING_GAMES = 1500;
const SAMPLE_WARNING_ART_GAMES = 300;
const LOG_FLOOR = 1e-12;

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

const binomialLogLikelihood = (trials, successes, denominator) => {
  const p = Math.min(Math.max(1 / denominator, LOG_FLOOR), 1 - LOG_FLOOR);
  return (successes * safeLog(p)) + ((trials - successes) * safeLog(1 - p));
};

const pushExcluded = (excludedMetrics, key, reason) => {
  excludedMetrics.push({
    key,
    label: UMINEKO2_PROBABILITIES[key].label,
    reason
  });
};

export const validateUmineko2Input = (rawInput) => {
  const errors = [];
  const normalizedInput = {
    totalGames: parseOptionalCount(rawInput.totalGames, UMINEKO2_PHASE1_FIELDS.totalGames.label, errors),
    bigCount: parseOptionalCount(rawInput.bigCount, UMINEKO2_PHASE1_FIELDS.bigCount.label, errors),
    regCount: parseOptionalCount(rawInput.regCount, UMINEKO2_PHASE1_FIELDS.regCount.label, errors),
    artGames: parseOptionalCount(rawInput.artGames, UMINEKO2_PHASE1_FIELDS.artGames.label, errors),
    artCommonBellCount: parseOptionalCount(rawInput.artCommonBellCount, UMINEKO2_PHASE1_FIELDS.artCommonBellCount.label, errors),
    artMissCount: parseOptionalCount(rawInput.artMissCount, UMINEKO2_PHASE1_FIELDS.artMissCount.label, errors)
  };

  if (normalizedInput.totalGames !== null) {
    if (normalizedInput.totalGames === 0) {
      if ((normalizedInput.bigCount || 0) > 0 || (normalizedInput.regCount || 0) > 0) {
        errors.push('総ゲーム数が0の場合、BIG回数とREG回数は0を超えられません');
      }
    } else {
      if (normalizedInput.bigCount !== null && normalizedInput.bigCount > normalizedInput.totalGames) {
        errors.push('BIG回数が総ゲーム数を超えています');
      }
      if (normalizedInput.regCount !== null && normalizedInput.regCount > normalizedInput.totalGames) {
        errors.push('REG回数が総ゲーム数を超えています');
      }
    }
  }

  if (normalizedInput.artGames === null) {
    return { normalizedInput, errors };
  }

  if (normalizedInput.artGames === 0) {
    if ((normalizedInput.artCommonBellCount || 0) > 0 || (normalizedInput.artMissCount || 0) > 0) {
      errors.push('ARTゲーム数が0の場合、ART中共通ベル回数とART中ハズレ回数は0を超えられません');
    }
    return { normalizedInput, errors };
  }

  if (normalizedInput.artCommonBellCount !== null && normalizedInput.artCommonBellCount > normalizedInput.artGames) {
    errors.push('ART中共通ベル回数がARTゲーム数を超えています');
  }
  if (normalizedInput.artMissCount !== null && normalizedInput.artMissCount > normalizedInput.artGames) {
    errors.push('ART中ハズレ回数がARTゲーム数を超えています');
  }

  return { normalizedInput, errors };
};

const buildUsedAndExcludedMetrics = (normalizedInput) => {
  const usedMetrics = [];
  const excludedMetrics = [];

  if (normalizedInput.totalGames === null) {
    pushExcluded(excludedMetrics, METRIC_KEYS.big, '総ゲーム数が未入力');
    pushExcluded(excludedMetrics, METRIC_KEYS.reg, '総ゲーム数が未入力');
  } else if (normalizedInput.totalGames === 0) {
    pushExcluded(excludedMetrics, METRIC_KEYS.big, '総ゲーム数0は未計測扱い');
    pushExcluded(excludedMetrics, METRIC_KEYS.reg, '総ゲーム数0は未計測扱い');
  } else {
    if (normalizedInput.bigCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.big, 'BIG回数が未入力');
    } else {
      usedMetrics.push({
        key: METRIC_KEYS.big,
        label: UMINEKO2_PROBABILITIES.big.label,
        trials: normalizedInput.totalGames,
        successes: normalizedInput.bigCount
      });
    }

    if (normalizedInput.regCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.reg, 'REG回数が未入力');
    } else {
      usedMetrics.push({
        key: METRIC_KEYS.reg,
        label: UMINEKO2_PROBABILITIES.reg.label,
        trials: normalizedInput.totalGames,
        successes: normalizedInput.regCount
      });
    }
  }

  if (normalizedInput.artGames === null) {
    pushExcluded(excludedMetrics, METRIC_KEYS.artCommonBell, 'ARTゲーム数が未入力');
    pushExcluded(excludedMetrics, METRIC_KEYS.artMiss, 'ARTゲーム数が未入力');
  } else if (normalizedInput.artGames === 0) {
    pushExcluded(excludedMetrics, METRIC_KEYS.artCommonBell, 'ARTゲーム数0は未計測扱い');
    pushExcluded(excludedMetrics, METRIC_KEYS.artMiss, 'ARTゲーム数0は未計測扱い');
  } else {
    if (normalizedInput.artCommonBellCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.artCommonBell, 'ART中共通ベル回数が未入力');
    } else {
      usedMetrics.push({
        key: METRIC_KEYS.artCommonBell,
        label: UMINEKO2_PROBABILITIES.artCommonBell.label,
        trials: normalizedInput.artGames,
        successes: normalizedInput.artCommonBellCount
      });
    }

    if (normalizedInput.artMissCount === null) {
      pushExcluded(excludedMetrics, METRIC_KEYS.artMiss, 'ART中ハズレ回数が未入力');
    } else {
      usedMetrics.push({
        key: METRIC_KEYS.artMiss,
        label: UMINEKO2_PROBABILITIES.artMiss.label,
        trials: normalizedInput.artGames,
        successes: normalizedInput.artMissCount
      });
    }
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
  const logLikelihoods = UMINEKO2_SETTING_LABELS.map((settingLabel, settingIndex) => (
    usedMetrics.reduce((sum, metric) => (
      sum + binomialLogLikelihood(
        metric.trials,
        metric.successes,
        UMINEKO2_PROBABILITIES[metric.key].denominators[settingIndex]
      )
    ), 0)
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
