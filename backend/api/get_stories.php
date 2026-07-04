<?php
/**
 * ストーリー一覧取得 API
 * GET /api/get_stories.php?user_id=1
 *
 * クエリパラメータ:
 * - user_id (任意): 特定のユーザーのストーリーのみ取得
 *
 * レスポンス (JSON):
 * {
 *   "success": true,
 *   "stories": [
 *     {
 *       "id": 1, "user_id": 2, "username": "tanaka_kun",
 *       "caption": "...", "location": "学食", "status": "free",
 *       "image_path": "uploads/xxx.jpg", "created_at": "...", "expires_at": "..."
 *     }
 *   ]
 * }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GETメソッドのみ使用できます。']);
    exit;
}

$pdo     = get_db();
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

// 有効期限内（expires_at が現在時刻より後）のストーリーのみ取得
if ($user_id) {
    $stmt = $pdo->prepare(
        'SELECT s.id, s.user_id, u.username, s.caption, s.location, s.status, s.image_path, s.created_at, s.expires_at
         FROM stories s
         JOIN users u ON s.user_id = u.id
         WHERE s.user_id = :user_id AND s.expires_at > NOW()
         ORDER BY s.created_at DESC'
    );
    $stmt->execute([':user_id' => $user_id]);
} else {
    $stmt = $pdo->prepare(
        'SELECT s.id, s.user_id, u.username, s.caption, s.location, s.status, s.image_path, s.created_at, s.expires_at
         FROM stories s
         JOIN users u ON s.user_id = u.id
         WHERE s.expires_at > NOW()
         ORDER BY s.created_at DESC'
    );
    $stmt->execute();
}

$stories = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'stories' => $stories
]);
