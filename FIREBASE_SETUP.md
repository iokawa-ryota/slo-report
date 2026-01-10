# VERSUS ANALYZER - Firebase マルチデバイス版

ブラウザのローカルストレージの代わりに Firebase を使用して、複数デバイス間でデータを同期できるようにしました。

## 🚀 セットアップ手順

### 1. Firebase プロジェクトを作成

1. [Firebase コンソール](https://console.firebase.google.com)にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例：`pachislo-analyzer`）
4. Google アナリティクスは不要（スキップ可）

### 2. Firestore データベースを設定

1. Firebase コンソール内で「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. 場所を選択（日本を推奨：`asia-northeast1`）
4. セキュリティルールを選択：**テストモード** を選択
5. 「作成」をクリック

### 3. Authentication を設定

1. 「Authentication」を選択
2. 「Sign-in method」タブをクリック
3. 「Anonymous」プロバイダを有効化

### 4. Firebase の設定情報を取得

1. Firebase コンソールの設定ギア → 「プロジェクト設定」
2. 「アプリ」セクションで Web アプリ `</>` をクリック
3. 以下の情報をコピーします：
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 5. ローカルファイルに環境変数を設定

`.env.local` ファイルを作成（`.env.local.example` を参考）：

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 6. アプリケーションを起動

```bash
npm run dev
```

## 📝 機能

✅ **マルチデバイス同期**
- Firebase Firestore を使用して、複数デバイス間でリアルタイムにデータを同期

✅ **データ移行**
- 初回起動時に、ローカルストレージのデータが自動的に Firebase に移行されます

✅ **匿名認証**
- ログイン不要で使用可能（複数デバイスで同じデータを扱う場合は Device ID で管理）

✅ **CRUD 操作**
- 記録の作成・更新・削除がリアルタイムに全デバイスに反映

## 🔐 Firestore セキュリティルール（本番環境）

以下は本番環境推奨のセキュリティルール：

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /pachislo_records/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

## 🚨 重要な注意事項

- **テストモード**：セットアップ直後はテストモード（全員が読み書き可能）です
- 本番環境では **セキュリティルールを設定** してください
- `.env.local` ファイルは **Git にコミットしない** こと

## 📦 ファイル構成

```
src/
├── firebase/
│   ├── config.js       # Firebase 初期化
│   ├── auth.js         # 認証関数
│   └── db.js           # Firestore CRUD 操作
├── App.jsx             # メインアプリケーション（Firebase 統合版）
└── ...
```

## 🔄 データベーススキーマ

### `pachislo_records` コレクション

各記録は以下の構造で保存されます：

```javascript
{
  userId: "user_id",
  date: "2026-01-10",
  machineName: "バーサスリヴァイズ",
  totalGames: 500,
  bigCount: 5,
  regCount: 10,
  investment: 1000,
  investmentUnit: "円",
  recovery: 2000,
  recoveryUnit: "円",
  // ... その他のフィールド
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 💡 トラブルシューティング

### データが同期されない
1. `.env.local` に正しい Firebase 設定が入っているか確認
2. Firestore の読み書き権限が有効か確認
3. ブラウザのコンソールにエラーがないか確認

### 認証エラー
1. Firebase コンソールで Anonymous Authentication が有効か確認
2. ブラウザキャッシュをクリアして再度試す

## 📞 サポート

問題が発生した場合は、ブラウザの開発者ツール（F12）のコンソールを確認して、エラーメッセージを確認してください。
