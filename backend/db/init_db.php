<?php
/**
 * データベース初期化スクリプト
 *
 * schema.sql を実行してテーブルを再構築する。
 * ※ デプロイに向けて架空のデモユーザー投入は廃止しました。
 *    アカウントは新規登録画面（@stu.musashino-u.ac.jp のメール必須）から作成し、
 *    友達追加機能で実際のユーザー同士をつなげてください。
 *
 * 実行方法:
 * - ブラウザからアクセス: http://<サーバーURL>/MULoop/backend/db/init_db.php
 * - CLIから実行: php init_db.php
 *
 * ⚠ 注意: 既存のテーブルとデータはすべて削除されます。
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = get_db();

    // schema.sql の読み込みと実行
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("schema.sql が見つかりません。");
    }

    $sql = file_get_contents($schemaFile);
    $pdo->exec($sql);
    echo "【成功】データベーステーブルを再構築しました。\n<br>";
    echo "【完了】セットアップが完了しました。新規登録画面からアカウントを作成してください。";

} catch (Exception $e) {
    http_response_code(500);
    echo "【エラー】接続または実行に失敗しました: " . htmlspecialchars($e->getMessage());
}
