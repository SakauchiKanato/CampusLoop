<?php
/**
 * ユーザー新規登録 API
 * POST /api/register.php
 *
 * リクエストボディ (JSON):
 * {
 *   "username": "campus_taro",
 *   "email":    "taro@stu.musashino-u.ac.jp",  // @stu.musashino-u.ac.jp 必須
 *   "password": "securepassword",
 *   "campus":   "有明キャンパス", // 省略可
 *   "faculty":  "経営学部3年",     // 省略可
 *   "circle":   "軽音サークル"     // 省略可
 * }
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "user": { "id": 1, "username": "campus_taro", "email": "...", "campus": "...", "faculty": "...", "circle": "..." } }
 * 失敗: { "success": false, "message": "エラーメッセージ" }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// POST メソッドのみ受け付ける
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POSTメソッドのみ使用できます。']);
    exit;
}

// リクエストボディを JSON としてパース
$body = json_decode(file_get_contents('php://input'), true);

$username = trim($body['username'] ?? '');
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$campus   = trim($body['campus'] ?? '有明キャンパス');
$faculty  = trim($body['faculty'] ?? '');
$circle   = trim($body['circle'] ?? '');

// バリデーション: 必須項目
if (empty($username) || empty($password) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ユーザー名・メールアドレス・パスワードは必須です。']);
    exit;
}

// バリデーション: ユーザー名の長さ
if (strlen($username) < 3 || strlen($username) > 50) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ユーザー名は3〜50文字で入力してください。']);
    exit;
}

// バリデーション: パスワードの長さ
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'パスワードは6文字以上で入力してください。']);
    exit;
}

// バリデーション: 大学メールアドレスのみ許可
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '有効なメールアドレスを入力してください。']);
    exit;
}

$allowed_domain = '@stu.musashino-u.ac.jp';
// str_ends_with() は PHP 8.0+ のため、PHP 7 でも動く substr 比較を使う
$email_lower = strtolower($email);
if (substr($email_lower, -strlen($allowed_domain)) !== $allowed_domain) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '武蔵野大学の学生メール（@stu.musashino-u.ac.jp）のみ登録できます。']);
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

// メールアドレスの重複チェック
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute([':email' => strtolower($email)]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'このメールアドレスはすでに使用されています。']);
    exit;
}

// パスワードをハッシュ化して保存
$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO users (username, email, password_hash, campus, faculty, circle) 
     VALUES (:username, :email, :password_hash, :campus, :faculty, :circle) 
     RETURNING id'
);
$stmt->execute([
    ':username'      => $username,
    ':email'         => strtolower($email),
    ':password_hash' => $password_hash,
    ':campus'        => $campus,
    ':faculty'       => $faculty,
    ':circle'        => $circle,
]);

$new_user = $stmt->fetch();

// 登録成功時点でそのままログイン状態にする（フロントは登録直後にホーム画面へ遷移するため）
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$new_user['id'];

http_response_code(201);
echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => (int)$new_user['id'],
        'username' => $username,
        'email'    => strtolower($email),
        'campus'   => $campus,
        'faculty'  => $faculty,
        'circle'   => $circle,
    ]
]);
