/**
 * 機種別設定ファイル
 * 新しい機種を追加する場合は、このファイルに設定を追加してください
 */

export const FALLBACK_MACHINE = 'その他';
export const MACHINE_SECTION_VALUES = ['versusRevise', 'hanabi', 'other'];
export const DETAIL_VARIANT_VALUES = ['versusRevise', 'hanabi', 'lHanabi', 'other'];

export const MACHINE_CONFIG = {
  'バーサスリヴァイズ': {
    machineSection: 'versusRevise',
    detailVariant: 'versusRevise',
    // REG最大獲得枚数
    regMax: 112,
    // 技術介入1回のミスによる損失枚数
    techLossPerMiss: 11,
    // スイカこぼし1回の損失枚数
    watermelonLoss: 12,
    // チェリー取りこぼし1回の損失枚数
    cherryLoss: 2,
    // 表示名（フォームで使用）
    watermelonName: 'スイカ',
    cherryName: 'チェリー',
    // 技術介入の詳細モードで使用するフィールド
    detailFields: {
      mid: true,  // 中リール第1停止の入力欄を表示
      right: true // 右リール第1停止の入力欄を表示
    }
  },
  '新ハナビ': {
    machineSection: 'hanabi',
    detailVariant: 'hanabi',
    regMax: 71,
    techLossPerMiss: 13,
    watermelonLoss: 15,
    cherryLoss: 4,
    watermelonName: '氷',
    cherryName: 'チェリー',
    detailFields: {
      mid: true,
      right: true
    }
  },
  'Lハナビ': {
    machineSection: 'hanabi',
    detailVariant: 'lHanabi',
    regMax: 71,
    techLossPerMiss: 13,
    watermelonLoss: 15,
    cherryLoss: 4,
    watermelonName: '氷',
    cherryName: 'チェリー',
    detailFields: {
      mid: false,
      right: true
    }
  },
  [FALLBACK_MACHINE]: {
    machineSection: 'other',
    detailVariant: 'other',
    regMax: 0,
    techLossPerMiss: 10,
    watermelonLoss: 15,
    cherryLoss: 4,
    watermelonName: '小役',
    cherryName: '小役',
    detailFields: {
      mid: false,
      right: false
    }
  }
};

// 機種名のリストを取得（選択肢として使用）
export const MACHINE_OPTIONS = Object.keys(MACHINE_CONFIG);

// デフォルトの機種名
export const DEFAULT_MACHINE = MACHINE_OPTIONS[0];

const validateMachineConfig = () => {
  for (const [machineName, config] of Object.entries(MACHINE_CONFIG)) {
    const requiredStringKeys = ['machineSection', 'detailVariant', 'watermelonName', 'cherryName'];
    const requiredNumberKeys = ['regMax', 'techLossPerMiss', 'watermelonLoss', 'cherryLoss'];

    for (const key of requiredStringKeys) {
      if (typeof config[key] !== 'string' || config[key].length === 0) {
        throw new Error(`Invalid machine config "${machineName}": "${key}" must be a non-empty string`);
      }
    }

    for (const key of requiredNumberKeys) {
      if (typeof config[key] !== 'number' || Number.isNaN(config[key])) {
        throw new Error(`Invalid machine config "${machineName}": "${key}" must be a number`);
      }
    }

    if (!MACHINE_SECTION_VALUES.includes(config.machineSection)) {
      throw new Error(`Invalid machine config "${machineName}": unknown machineSection "${config.machineSection}"`);
    }
    if (!DETAIL_VARIANT_VALUES.includes(config.detailVariant)) {
      throw new Error(`Invalid machine config "${machineName}": unknown detailVariant "${config.detailVariant}"`);
    }

    if (!config.detailFields || typeof config.detailFields !== 'object') {
      throw new Error(`Invalid machine config "${machineName}": "detailFields" is required`);
    }
    if (typeof config.detailFields.mid !== 'boolean' || typeof config.detailFields.right !== 'boolean') {
      throw new Error(`Invalid machine config "${machineName}": detailFields.mid/right must be boolean`);
    }
  }

  if (!MACHINE_CONFIG[FALLBACK_MACHINE]) {
    throw new Error(`Invalid machine config: fallback machine "${FALLBACK_MACHINE}" is missing`);
  }
};

validateMachineConfig();

export const getMachineConfig = (machineName) => (
  MACHINE_CONFIG[machineName] || MACHINE_CONFIG[FALLBACK_MACHINE]
);
