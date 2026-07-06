<?php
/**
 * ユーザー新規登録 API
 * POST /api/register.php
 *
 * リクエストボディ (JSON):
 * {
 *   "username": "campus_taro",
 *   "password": "securepassword",
 *   "campus":   "有明キャンパス", // 省略可
 *   "faculty":  "経営学部3年",     // 省略可
 *   "circle":   "軽音サークル"     // 省略可
 * }
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "user": { "id": 1, "username": "campus_taro", "campus": "...", "faculty": "...", "circle": "..." } }
 * 失敗: { "success": false, "message": "エラーメッセージ" }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// POST メソッドのみ受け付ける
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POSTメソッドのみ使用できます。']);
    exit;
}

// リクエストボディを JSON としてパース
$body = json_decode(file_get_contents('php://input'), true);

$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';
$campus   = trim($body['campus'] ?? '有明キャンパス');
$faculty  = trim($body['faculty'] ?? '');
$circle   = trim($body['circle'] ?? '');

// バリデーション
if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ユーザー名とパスワードは必須です。']);
    exit;
}

if (strlen($username) < 3 || strlen($username) > 50) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ユーザー名は3〜50文字で入力してください。']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'パスワードは6文字以上で入力してください。']);
    exit;
}

$pdo = get_db();

// ユーザー名の重複チェック
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = :username');
$stmt->execute([':username' => $username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'このユーザー名はすでに使用されています。']);
    exit;
}

// パスワードをハッシュ化して保存
$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO users (username, password_hash, campus, faculty, circle) 
     VALUES (:username, :password_hash, :campus, :faculty, :circle) 
     RETURNING id'
);
$stmt->execute([
    ':username'      => $username,
    ':password_hash' => $password_hash,
    ':campus'        => $campus,
    ':faculty'       => $faculty,
    ':circle'        => $circle,
]);

$new_user = $stmt->fetch();

http_response_code(201);
echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => (int)$new_user['id'],
        'username' => $username,
        'campus'   => $campus,
        'faculty'  => $faculty,
        'circle'   => $circle,
    ]
]);
