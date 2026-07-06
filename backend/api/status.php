<?php
/**
 * 今のヒマ度ステータス API
 * GET /api/status.php?user_id=1
 * POST /api/status.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GET または POST メソッドのみ使用できます。']);
    exit;
}

$pdo = get_db();

// ==============================
// GET: ステータス取得
// ==============================
if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id は必須です。']);
        exit;
    }
    
    // 有効期限が未来のレコードのみ取得
    $stmt = $pdo->prepare(
        'SELECT level, comment, expires_at
         FROM statuses
         WHERE user_id = :user_id AND expires_at > CURRENT_TIMESTAMP'
    );
    $stmt->execute([':user_id' => $user_id]);
    $status = $stmt->fetch();
    
    if ($status) {
        echo json_encode([
            'success' => true,
            'status'  => [
                'level'      => $status['level'],
                'comment'    => $status['comment'],
                'expires_at' => $status['expires_at'],
                'is_active'  => true
            ]
        ]);
    } else {
        // 有効期限切れ、またはレコードなしの場合はデフォルト
        echo json_encode([
            'success' => true,
            'status'  => [
                'level'      => 'busy', // デフォルトは勉強中/非表示
                'comment'    => '',
                'expires_at' => '',
                'is_active'  => false
            ]
        ]);
    }
    exit;
}

// ==============================
// POST: ステータス更新（UPSERT）
// ==============================
$body = json_decode(file_get_contents('php://input'), true);

$user_id = isset($body['user_id']) ? (int)$body['user_id'] : null;
$level   = trim($body['level']     ?? 'busy');
$comment = trim($body['comment']   ?? '');
$hours   = isset($body['hours'])   ? (int)$body['hours']   : 1; // 有効時間（時間単位）

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id は必須です。']);
    exit;
}

if (!in_array($level, ['free', 'chat', 'busy'])) {
    $level = 'busy';
}

// expires_at を算出
$expires_at = date('Y-m-d H:i:s', strtotime("+$hours hours"));

$stmt = $pdo->prepare(
    'INSERT INTO statuses (user_id, level, comment, expires_at)
     VALUES (:user_id, :level, :comment, :expires_at)
     ON CONFLICT (user_id)
     DO UPDATE SET level = EXCLUDED.level, comment = EXCLUDED.comment, expires_at = EXCLUDED.expires_at'
);
$stmt->execute([
    ':user_id'    => $user_id,
    ':level'      => $level,
    ':comment'    => $comment,
    ':expires_at' => $expires_at,
]);

echo json_encode([
    'success' => true,
    'message' => 'ステータスを更新しました。',
    'status'  => [
        'level'      => $level,
        'comment'    => $comment,
        'expires_at' => $expires_at,
        'is_active'  => true
    ]
]);
