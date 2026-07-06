<?php
/**
 * フレンド一覧 API
 * GET /api/friends.php?user_id=1
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GETメソッドのみ使用できます。']);
    exit;
}

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id は必須です。']);
    exit;
}

$pdo = get_db();

$stmt = $pdo->prepare(
    'SELECT 
        u.id as friend_id,
        u.username,
        u.avatar_url,
        u.faculty,
        u.circle
     FROM friendships f
     JOIN users u ON f.friend_id = u.id
     WHERE f.user_id = :user_id
     ORDER BY u.username ASC'
);
$stmt->execute([':user_id' => $user_id]);
$friends = $stmt->fetchAll();

foreach ($friends as &$f) {
    $f['friend_id'] = (int)$f['friend_id'];
}

echo json_encode([
    'success' => true,
    'friends' => $friends
]);
