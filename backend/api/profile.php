<?php
/**
 * プロフィール更新 API
 * PUT /api/profile.php
 *
 * リクエストボディ (JSON):
 * {
 *   "user_id": 1,
 *   "faculty": "経営学部3年",
 *   "circle":  "軽音サークル",
 *   "campus":  "有明キャンパス"
 * }
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "user": { "id": 1, "username": "...", "campus": "...", "faculty": "...", "circle": "..." } }
 * 失敗: { "success": false, "message": "エラーメッセージ" }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'PUTメソッドのみ使用できます。']);
    exit;
}

// 更新対象は必ずログイン中の本人。リクエストの user_id は信用しない（他人になりすまし防止）。
$user_id = require_login();

$body = json_decode(file_get_contents('php://input'), true);

$faculty = trim($body['faculty'] ?? '');
$circle  = trim($body['circle'] ?? '');
$campus  = trim($body['campus'] ?? '');

$pdo = get_db();

// ユーザー存在確認
$stmt = $pdo->prepare('SELECT id, username FROM users WHERE id = :id');
$stmt->execute([':id' => $user_id]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'ユーザーが見つかりません。']);
    exit;
}

// プロフィール更新
$updates = [];
$params  = [':id' => $user_id];

if ($faculty !== '') {
    $updates[] = 'faculty = :faculty';
    $params[':faculty'] = $faculty;
}
if ($circle !== '') {
    $updates[] = 'circle = :circle';
    $params[':circle'] = $circle;
}
if ($campus !== '') {
    $updates[] = 'campus = :campus';
    $params[':campus'] = $campus;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '更新する項目がありません。']);
    exit;
}

$sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = :id RETURNING id, username, campus, faculty, circle';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$updated = $stmt->fetch();

echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => (int)$updated['id'],
        'username' => $updated['username'],
        'campus'   => $updated['campus'],
        'faculty'  => $updated['faculty'],
        'circle'   => $updated['circle'],
    ]
]);
