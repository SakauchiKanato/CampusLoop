<?php
/**
 * ログイン API
 * POST /api/login.php
 *
 * リクエストボディ (JSON):
 * {
 *   "username": "campus_taro",
 *   "password": "securepassword"
 * }
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "user": { "id": 1, "username": "...", "campus": "...", "faculty": "...", "circle": "..." } }
 * 失敗: { "success": false, "message": "エラーメッセージ" }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POSTメソッドのみ使用できます。']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ユーザー名とパスワードを入力してください。']);
    exit;
}

$pdo = get_db();

// ユーザーをDBから取得
$stmt = $pdo->prepare('SELECT id, username, password_hash, campus, faculty, circle FROM users WHERE username = :username');
$stmt->execute([':username' => $username]);
$user = $stmt->fetch();

// ユーザーが存在しない、またはパスワードが違う場合
if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'ユーザー名またはパスワードが正しくありません。']);
    exit;
}

http_response_code(200);
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
