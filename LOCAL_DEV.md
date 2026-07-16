# ローカル開発の起動手順

フロントは Vite（localhost:5173/5174）、バックエンドは PHP（localhost:8080）＋ PostgreSQL で動きます。
**フロントだけ起動しても「バックエンドに接続できません」になります。以下の3つすべてが必要です。**

## 1. PostgreSQL を起動する（初回はセットアップ）

```bash
# インストール（初回のみ）
brew install postgresql@16
brew services start postgresql@16

# ユーザーとDBの作成（初回のみ）※ backend/config/db.php の設定に合わせる
psql postgres -c "CREATE ROLE knt416 LOGIN PASSWORD 'nFb55bRP';"
createdb -O knt416 knt416
```

## 2. PHP サーバーを起動する（ポート8080）

フロントは `http://localhost:8080/MULoop/backend/api/...` にアクセスするため、
**MULoop の1つ上のディレクトリ**（mirai-pj）から起動します。

```bash
cd ~/ishibashiken/mirai-pj
php -S localhost:8080
```

※ `php` コマンドがない場合: `brew install php`

### テーブルの作成（初回・スキーマ変更時のみ）

PHPサーバー起動後、ブラウザで開く：

```
http://localhost:8080/MULoop/backend/db/init_db.php
```

⚠ 既存のテーブルとデータはすべて削除されます。デモユーザーは投入されないので、
新規登録画面（@stu.musashino-u.ac.jp のメール必須）からアカウントを作成してください。

## 3. フロントエンドを起動する

```bash
cd ~/ishibashiken/mirai-pj/MULoop/frontend
npm run dev
```

ブラウザで http://localhost:5173 （または5174）を開く。

## よくあるエラー

| 症状 | 原因と対処 |
|---|---|
| `ERR_CONNECTION_REFUSED :8080` / バックエンドに接続できません | PHPサーバーが未起動 → 手順2を実行 |
| データベース接続に失敗しました | PostgreSQLが未起動 or DB/ユーザー未作成 → 手順1を実行 |
| relation "users" does not exist | テーブル未作成 → init_db.php を実行 |
