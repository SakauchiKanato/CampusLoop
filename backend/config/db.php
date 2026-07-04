<?php
/**
 * PostgreSQL データベース接続設定
 * 
 * 大学のサーバー情報に合わせて、以下の定数を書き換えてください。
 */

define('DB_HOST', 'localhost');      // DBサーバーのホスト名
define('DB_PORT', '5432');           // PostgreSQLのポート番号（デフォルト: 5432）
define('DB_NAME', 'knt416');     // データベース名
define('DB_USER', 'knt416');  // PostgreSQLのユーザー名
define('DB_PASS', 'nFb55bRP'); // パスワード

/**
 * PDOインスタンスを生成して返す関数
 * 接続に失敗した場合は JSON エラーを返して終了する
 *
 * @return PDO
 */
function get_db(): PDO {
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'データベース接続に失敗しました。',
            'error'   => $e->getMessage()  // 本番環境では削除してください
        ]);
        exit;
    }
}
