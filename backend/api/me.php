<?php
/**
 * 現在ログイン中のユーザー情報を返す API
 * GET /api/me.php
 *
 * フロントエンドがページ再読み込み時に「本当にログイン状態が有効か」を
 * サーバーに確認するためのエンドポイント。
 * ログイン中: { "success": true, "user": { ... } }
 * 未ログイン: 401 { "success": false, "message": "..." }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GETメソッドのみ使用できます。']);
    exit;
}

$user_id = require_login();

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, username, campus, faculty, circle FROM users WHERE id = :id');
$stmt->execute([':id' => $user_id]);
$user = $stmt->fetch();

if (!$user) {
    // ユーザーが削除済みなどでセッションだけ残っているケース
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'ユーザーが見つかりません。']);
    exit;
}

echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => (int)$user['id'],
        'username' => $user['username'],
        'campus'   => $user['campus'],
        'faculty'  => $user['faculty'],
        'circle'   => $user['circle'],
    ]
]);
