export const UMINEKO2_MACHINE_ID = 'umineko2';
export const UMINEKO2_SCHEMA_VERSION = 1;
export const UMINEKO2_CALCULATION_VERSION = 2;

export const UMINEKO2_SETTING_LABELS = [1, 2, 3, 4, 5, 6];

export const UMINEKO2_PHASE1_FIELDS = {
  totalGames: {
    key: 'totalGames',
    label: '総ゲーム数'
  },
  bigCount: {
    key: 'bigCount',
    label: 'BIG回数'
  },
  regCount: {
    key: 'regCount',
    label: 'REG回数'
  },
  artGames: {
    key: 'artGames',
    label: 'ARTゲーム数'
  },
  artLevel1Count: {
    key: 'artLevel1Count',
    label: 'ARTレベル1回数'
  },
  artLevel2Count: {
    key: 'artLevel2Count',
    label: 'ARTレベル2回数'
  },
  artLevel3Count: {
    key: 'artLevel3Count',
    label: 'ARTレベル3回数'
  },
  artCommonBellCount: {
    key: 'artCommonBellCount',
    label: 'ART中共通ベル回数'
  },
  artMissCount: {
    key: 'artMissCount',
    label: 'ART中ハズレ回数'
  }
};

export const UMINEKO2_PHASE1_DEFAULT_INPUT = {
  totalGames: '',
  bigCount: '',
  regCount: '',
  bigBitaTrialCount: '',
  bigBitaSuccessCount: '',
  regGameCount: '',
  regDiagonalBlue7Count: '',
  regParallelBlue7Count: '',
  artLevel1Count: '',
  artLevel2Count: '',
  artLevel3Count: '',
  artCommonBellCount: '',
  artMissCount: '',
  logoFlashSmallCount: '',
  logoFlashLargeCount: '',
  oneRoleACount: '',
  oneRoleBCount: '',
  oneRoleCCount: '',
  confirmedRoleACount: '',
  level2NaviSameColorTrialCount: '',
  level2NaviSameColorSuccessCount: '',
  level2NaviDifferentColorTrialCount: '',
  level2NaviDifferentColorSuccessCount: '',
  level2NaviOtherTrialCount: '',
  level2NaviOtherSuccessCount: '',
  specialBonuses: [],
  truthPointEvents: [],
  level2NaviEvents: []
};

export const UMINEKO2_BONUS_TRIGGER_OPTIONS = [
  '不明',
  'スイカ',
  'チェリー',
  '1枚役A',
  '1枚役B',
  '1枚役C',
  'リプレイ',
  'ベル',
  '単独',
  '確定役'
];

export const UMINEKO2_BONUS_TYPE_OPTIONS = ['BIG', 'REG'];

export const UMINEKO2_BIG_COLOR_OPTIONS = ['赤異色', '赤同色', '白異色', '白同色'];
export const UMINEKO2_REG_COLOR_OPTIONS = ['赤', '白'];

export const UMINEKO2_TRUTH_POINT_OPTIONS = [
  '30pt',
  '50pt',
  '70pt',
  '200pt'
];

export const UMINEKO2_PROBABILITIES = {
  big: {
    label: 'BIG',
    type: 'binomial',
    denominators: [362.1, 350.5, 337.8, 327.7, 319.7, 313.6]
  },
  reg: {
    label: 'REG',
    type: 'binomial',
    denominators: [397.2, 390.1, 381.0, 374.5, 366.1, 360.1]
  },
  artCommonBell: {
    label: 'ART中共通ベル',
    type: 'binomial',
    denominators: [29.4, 28.3, 26.5, 22.6, 21.5, 21.0]
  },
  artMiss: {
    label: 'ART中ハズレ',
    type: 'binomial',
    denominators: [56.2, 55.4, 53.8, 52.3, 51.5, 50.3]
  },
  oneRoleB: {
    label: '1枚役B',
    type: 'binomial',
    denominators: [89.8, 86.5, 82.7, 81.7, 79.6, 77.2]
  },
  oneRoleC: {
    label: '1枚役C',
    type: 'binomial',
    denominators: [148.9, 148.0, 145.6, 142.2, 139.3, 136.4]
  },
  confirmedRoleA: {
    label: '確定役A',
    type: 'binomial',
    denominators: [595.8, 585.1, 564.9, 528.5, 512.1, 496.5]
  },
  replayReg: {
    label: 'リプレイ+RB',
    type: 'binomial',
    denominators: [6553.6, 5041.2, 4096.0, 3276.8, 2730.7, 2184.5]
  },
  oneRoleCRedBig: {
    label: '1枚役C+赤同色BB',
    type: 'binomial',
    denominators: [16384.0, 13107.2, 10922.7, 9362.3, 8192.0, 7281.8]
  },
  confirmedRoleARedBig: {
    label: '確定役A+赤異色BB',
    type: 'binomial',
    denominators: [16384.0, 13107.2, 10922.7, 9362.3, 8192.0, 7281.8]
  },
  regBlue7Pattern: {
    label: 'REG中青7揃い',
    type: 'categorical',
    categories: ['diagonal', 'parallel', 'none'],
    probabilitiesBySetting: [
      [1 / 30.5, (1 / 11.4) - (1 / 30.5), 1 - (1 / 11.4)],
      [1 / 29.4, (1 / 10.7) - (1 / 29.4), 1 - (1 / 10.7)],
      [1 / 28.2, (1 / 10.0) - (1 / 28.2), 1 - (1 / 10.0)],
      [1 / 24.5, (1 / 8.7) - (1 / 24.5), 1 - (1 / 8.7)],
      [1 / 23.4, (1 / 8.0) - (1 / 23.4), 1 - (1 / 8.0)],
      [1 / 22.1, (1 / 7.3) - (1 / 22.1), 1 - (1 / 7.3)]
    ]
  },
  logoFlashPattern: {
    label: 'ロゴ発光パターン',
    type: 'categorical',
    categories: ['small', 'large'],
    probabilitiesBySetting: [
      [0.292, 0.708],
      [0.25, 0.75],
      [0.313, 0.687],
      [0.25, 0.75],
      [0.333, 0.667],
      [0.25, 0.75]
    ]
  },
  truthPointPattern: {
    label: '真実ポイント',
    type: 'categorical',
    categories: ['30pt', '50pt', '70pt', '200pt'],
    probabilitiesBySetting: [
      [0.521, 0.327, 0.125, 0.027],
      [0.517, 0.327, 0.135, 0.021],
      [0.513, 0.316, 0.146, 0.025],
      [0.496, 0.325, 0.15, 0.029],
      [0.488, 0.317, 0.16, 0.035],
      [0.484, 0.315, 0.166, 0.034]
    ]
  },
  level2NaviSameColor: {
    label: '同色BB後のLv2ナビ',
    type: 'binomialProbability',
    probabilities: [0.703, 0.699, 0.762, 0.766, 0.813, 0.82]
  },
  level2NaviDifferentColor: {
    label: '異色BB後のLv2ナビ',
    type: 'binomialProbability',
    probabilities: [0.527, 0.539, 0.617, 0.668, 0.73, 0.758]
  },
  level2NaviOther: {
    label: 'RB後・その他のLv2ナビ',
    type: 'binomialProbability',
    probabilities: [0.262, 0.23, 0.27, 0.266, 0.348, 0.391]
  }
};
