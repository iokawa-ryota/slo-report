# Firestore セキュリティルール設定手順

## 1. Firebaseコンソールでセキュリティルールを更新

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `slo-report` を選択
3. 左メニューから「Firestore Database」→「ルール」タブをクリック
4. 以下のルールをコピー&ペースト:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーごとのサブコレクション: 自分のデータのみ読み書き可能
    // userIdentifier はメールアドレスの@前部分（例: iokawa-ryota@gmail.com → iokawa-ryota）
    match /users/{userIdentifier}/records/{recordId} {
      allow read, write: if request.auth != null && request.auth.token.email != null && 
        request.auth.token.email.split('@')[0] == userIdentifier;
    }
    
    // その他のドキュメントはデフォルトで拒否
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. 「公開」ボタンをクリックして適用

## 2. 複合インデックスを作成

1. Firebaseコンソールの「Firestore Database」→「インデックス」タブ
2. 「複合」タブで「インデックスを追加」をクリック
3. 以下を設定:
   - **コレクションID**: `records`（※ サブコレクションのため、コレクショングループインデックスが必要）
   - **クエリの範囲**: コレクション グループ
   - **フィールド**:
     - `date` / 降順
   - **自動ID**: 昇順（デフォルト）
4. 「インデックスを作成」をクリック

**または**: アプリを起動して初回クエリを実行すると、コンソールにインデックス作成用URLが表示されます。そのリンクからワンクリックで作成できます。

## 3. 動作確認

1. ローカルで開発サーバーを起動: `npm run dev`
2. Googleサインインして新規レコードを作成
3. Firestoreコンソールで `users/{uid}/records` にデータが保存されることを確認
4. ブラウザのコンソールにエラーがないことを確認

## 4. デプロイ

```powershell
git add .
git commit -m "feat: Implement subcollection structure for user data isolation"
git push
```

GitHub Actionsで自動デプロイが開始されます。

## セキュリティルールの説明

- `match /users/{userIdentifier}/records/{recordId}`: ユーザーごとのサブコレクション
  - `userIdentifier` = メールアドレスの@前部分（例: `iokawa-ryota@gmail.com` → `iokawa-ryota`）
- `request.auth != null`: 認証済みユーザーのみアクセス可能
- `request.auth.token.email.split('@')[0] == userIdentifier`: 自分のメールローカルパートのみアクセス可能
- 他のユーザーのデータは完全に隔離され、読み書き不可

## トラブルシューティング

### エラー: `Missing or insufficient permissions`
- セキュリティルールが正しく設定されているか確認
- ログインしているユーザーのUIDとパスの `{userId}` が一致しているか確認

### エラー: `The query requires an index`
- インデックスが作成されるまで数分かかる場合があります
- コンソールのエラーメッセージ内のリンクから直接作成できます

### 過去データが表示されない
- サブコレクション化により、旧 `pachislo_records` コレクションのデータは表示されません
- 新規作成したデータは `users/{uid}/records` に保存されます
- 過去データが不要な場合は、旧コレクションは削除してOKです
