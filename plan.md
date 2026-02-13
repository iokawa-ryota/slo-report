# 拡張計画メモ（機種追加向け）

## 目的
このドキュメントは、現行コードの内部仕様を把握し、今後の「新機種追加」を安全に進めるための実装ガイド。

## 現在の構成（重要ファイル）
- `src/App.jsx`
- `src/config/machineConfig.js`
- `src/firebase/db.js`
- `src/firebase/auth.js`
- `src/firebase/config.js`
- `src/main.jsx`

## アプリ内部仕様（要点）

### 1. データ取得と表示順
- Firestore からの一覧取得は `src/firebase/db.js` の `subscribeToRecords`。
- クエリは `orderBy('date', 'desc')` なので、`records` は「新しい日付が先頭」。
- 直近履歴表示は `src/App.jsx` の `RecentHistorySection` で `records.slice(0, 5)` を使用。

### 2. 認証と同期条件
- 認証監視は `src/App.jsx` の `useEffect` + `subscribeToAuthState`。
- Googleログイン（`user.email` あり）のときのみ `subscribeToRecords` を開始。
- 匿名ログイン時は同期せず、`records` は空配列になる。
- ローカルストレージ旧データ（`pachislo-records-v8`）はログイン時に一度だけ移行。

### 3. 記録データの保存仕様
- 保存処理は `src/App.jsx` の `handleSubmit`。
- Firestore 保存は `createRecord` / `updateRecord`（`src/firebase/db.js`）。
- 保存オブジェクトには以下を含む。
  - 生入力値（`date`, `machineName`, 投資回収、技術介入入力など）
  - 計算済み値（`profitYen`, `totalLoss`, `totalMisses`, `stats`）
  - 正規化用グループ（`tech`, `losses`）

### 4. 機種設定の単一ソース
- `src/config/machineConfig.js` の `MACHINE_CONFIG` が基本設定ソース。
- ナビとフォームの機種選択は `MACHINE_OPTIONS = Object.keys(MACHINE_CONFIG)` で自動反映。
- 現在の設定キー:
  - `regMax`
  - `techLossPerMiss`
  - `watermelonLoss` / `cherryLoss`
  - `watermelonName` / `cherryName`
  - `detailFields`（現状は補助情報。表示分岐は主に `App.jsx` の機種名条件で実施）

### 5. 技術介入UIの実装方式
- `calcMode` が `simple` / `detail` を切替。
- `detail` の表示コンポーネントは機種名で分岐。
  - `TechDetailSection_VersusRevise`
  - `TechDetailSection_Hanabi`
  - `TechDetailSection_LHanabi`
  - `TechDetailSection_Other`
- つまり「新機種追加時、UI差分があるならコンポーネント追加 + 分岐追加」が必要。

### 6. 計算ロジックの注意点
- 入力統計: `inputStats`（`useMemo`）
- 損失計算: `calculatedLoss`（`useMemo`）
- 一部機種で特殊分岐あり（例: `Lハナビ` は `mid` 非使用）。
- 機種を増やすほど `if (machineName === ...)` が増える構造。

## 新機種追加の標準手順（現行実装に合わせる）
1. `src/config/machineConfig.js` に機種設定を追加。
2. `App.jsx` の `handleSubmit` 内 `machineSection` マッピングを必要なら更新。
3. `detail` UIが既存と同じなら既存コンポーネントに合流、違うなら新規 `TechDetailSection_*` を作る。
4. `inputStats` と `calculatedLoss` で、その機種特有の入力無効化ロジックが必要か確認。
5. `SmallRoleLossSection` のラベル/係数が期待どおりか確認（`currentConfig` 依存）。
6. 編集時（`loadRecordForEdit`）に既存データと矛盾しないか確認。

## 既知の設計課題（拡張前に把握しておく）
- `App.jsx` が大きく、機種追加の影響範囲が広い。
- 機種仕様が `machineConfig` と `App.jsx` の条件分岐に分散している。
- `detailFields` が実装上の単一制御点になっていない。

## 改善計画（段階的）

### Phase 1: 機種仕様の一元化（優先）
- 目的: 追加コストを下げ、仕様漏れを防ぐ。
- 対応:
  - `machineConfig` に「どの入力を使うか」「計算時に参照する項目」を寄せる。
  - `App.jsx` の機種名 `if` を減らし、設定駆動にする。
- 進捗: 一部完了（`machineSection` / `detailVariant` / `detailFields` を設定駆動化済み）。

### Phase 2: 画面ロジック分割
- 目的: 保守性改善。
- 対応:
  - `App.jsx` を `hooks` と `components` に分離。
  - 例: `useRecordCalculations`, `MachineDetailForm`, `HistoryList`。

### Phase 3: 回帰防止
- 目的: 機種追加時の破壊的変更を防ぐ。
- 対応:
  - 少なくとも計算関数の単体テスト追加。
  - 機種ごとに「入力 -> totalLoss/accuracy」のスナップショット化。
- 進捗: 一部完了（`Vitest` 導入、`recordCalculations` の単体テスト追加済み）。

## 不具合・修正必須・要監視

### 修正必須（高優先）
- `lint` が現状エラーで失敗する。最低限、CI 前提なら `npm run lint` を通す必要がある。
- `App.jsx` が依然として大きく、機種追加の実装ミスリスクが高い。`Phase 2` の分割を優先候補にする。

### 要監視（中優先）
- 既存のフォーム項目（特に `mid*`）は機種切替時に値が残るため、機種ごとの不要項目クリア仕様を検討。
- `detailFields` / `detailVariant` の運用ルールを固定化して、追加時に `App.jsx` 修正が不要か定期確認。

### 対応済み（参考）
- 直近5件履歴の表示順修正（最新順）。
- モバイルで投資/回収プルダウンが見えない問題を修正。
- `Lハナビ` 追加と `mid-reel-section` 非表示対応。

## 追加実装時のチェックリスト
- [ ] 機種がサイドバーとフォーム選択肢に表示される
- [ ] 詳細モードUIが意図通り（不要入力が出ない）
- [ ] `totalLoss` と `totalMisses` が仕様通り
- [ ] 編集時に既存データが崩れない
- [ ] 直近5件・全履歴・機種別統計に表示される
- [ ] Firestore 保存後に再読込しても値が一致する

## 今後の実装方針（推奨）
当面は現行方式で機種追加を継続しつつ、次のタイミングで Phase 1（機種仕様一元化）を先に実施する。
理由は、機種数が増えるほど `App.jsx` の条件分岐メンテコストが急増するため。
