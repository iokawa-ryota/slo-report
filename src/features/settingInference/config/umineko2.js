export const UMINEKO2_MACHINE_ID = 'umineko2';
export const UMINEKO2_SCHEMA_VERSION = 1;
export const UMINEKO2_CALCULATION_VERSION = 1;

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
  artGames: '',
  artCommonBellCount: '',
  artMissCount: '',
  logoFlashTotalCount: '',
  logoFlashSmallCount: '',
  logoFlashLargeCount: '',
  oneRoleACount: '',
  oneRoleBCount: '',
  oneRoleCCount: '',
  confirmedRoleACount: '',
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
  '100pt',
  '200pt',
  '300pt',
  '400pt',
  '500pt以上'
];

export const UMINEKO2_LEVEL2_NAVI_OPTIONS = [
  '通常ナビ',
  '赤ナビ',
  '金ナビ'
];

export const UMINEKO2_PROBABILITIES = {
  big: {
    label: 'BIG',
    denominators: [362.1, 350.5, 337.8, 327.7, 319.7, 313.6]
  },
  reg: {
    label: 'REG',
    denominators: [397.2, 390.1, 381.0, 374.5, 366.1, 360.1]
  },
  artCommonBell: {
    label: 'ART中共通ベル',
    denominators: [29.4, 28.3, 26.5, 22.6, 21.5, 21.0]
  },
  artMiss: {
    label: 'ART中ハズレ',
    denominators: [56.2, 55.4, 53.8, 52.3, 51.5, 50.3]
  }
};
