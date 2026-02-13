/**
 * 機種別設定ファイル
 * 新しい機種を追加する場合は、このファイルに設定を追加してください
 */

export const MACHINE_CONFIG = {
  'バーサスリヴァイズ': {
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
  'その他': {
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
