## 対応機種

- バーサスリヴァイズ
- 新ハナビ
- その他（カスタム設定）

## セットアップ

### 必要な環境

- Node.js 20.19+ または 22.12+

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/iokawa-ryota/slo-report.git
cd slo-report

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### ビルド

```bash
# 本番用ビルド
npm run build

# ビルドしたファイルをプレビュー
npm run preview
```

## 機種設定のカスタマイズ

新しい機種を追加する場合は、`src/config/machineConfig.js` を編集してください。

```javascript
export const MACHINE_CONFIG = {
  '新機種名': {
    regMax: 100,              // REG最大獲得枚数
    techLossPerMiss: 11,      // 技術介入1ミスあたりの損失枚数
    watermelonLoss: 12,       // スイカこぼし1回の損失枚数
    cherryLoss: 2,            // チェリー取りこぼし1回の損失枚数
    watermelonName: 'スイカ', // 表示名
    cherryName: 'チェリー',   // 表示名
    detailFields: {
      mid: true,              // 中リール第1停止の入力欄
      right: true             // 右リール第1停止の入力欄
    }
  }
};
```

## 技術スタック

- **フレームワーク**: React 19
- **ビルドツール**: Vite 7
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **グラフ**: Recharts

## GitHub Pages へのデプロイ

```bash
# ビルドして gh-pages ブランチにデプロイ
npm run build
# 生成された dist フォルダを GitHub Pages に設定
```

## 作者

iokawa-ryota

