<?php
/**
 * 今のヒマ度ステータス API
 * GET /api/status.php?user_id=1
 * POST /api/status.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// 「今いる場所」タグの選択肢（企画書の画面Bワイヤーフレームに準拠）
const LOCATION_OPTIONS = ['学食', '図書館', '3号館ラウンジ', '芝生広場', 'その他'];

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GET または POST メソッドのみ使用できます。']);
    exit;
}

// 自分のステータスしか読み書きできない
$user_id = require_login();

$pdo = get_db();

// location 列がなければ追加する（既存DBを壊さずに導入できるように init_db 再実行は不要）
$pdo->exec('ALTER TABLE statuses ADD COLUMN IF NOT EXISTS location VARCHAR(50) DEFAULT NULL');

// ==============================
// GET: ステータス取得
// ==============================
if ($method === 'GET') {
    // 有効期限が未来のレコードのみ取得
    $stmt = $pdo->prepare(
        'SELECT level, location, comment, expires_at
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
                'location'   => $status['location'] ?? '',
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
                'location'   => '',
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

$level    = trim($body['level']     ?? 'busy');
$location = trim($body['location']  ?? '');
$comment  = trim($body['comment']   ?? '');
$hours    = isset($body['hours'])   ? (int)$body['hours']   : 1; // 有効時間（時間単位）

if (!in_array($level, ['free', 'chat', 'busy'])) {
    $level = 'busy';
}
if ($location !== '' && !in_array($location, LOCATION_OPTIONS, true)) {
    $location = '';
}

// expires_at を算出
$expires_at = date('Y-m-d H:i:s', strtotime("+$hours hours"));

$stmt = $pdo->prepare(
    'INSERT INTO statuses (user_id, level, location, comment, expires_at)
     VALUES (:user_id, :level, :location, :comment, :expires_at)
     ON CONFLICT (user_id)
     DO UPDATE SET level = EXCLUDED.level, location = EXCLUDED.location, comment = EXCLUDED.comment, expires_at = EXCLUDED.expires_at'
);
$stmt->execute([
    ':user_id'    => $user_id,
    ':level'      => $level,
    ':location'   => $location !== '' ? $location : null,
    ':comment'    => $comment,
    ':expires_at' => $expires_at,
]);

echo json_encode([
    'success' => true,
    'message' => 'ステータスを更新しました。',
    'status'  => [
        'level'      => $level,
        'location'   => $location,
        'comment'    => $comment,
        'expires_at' => $expires_at,
        'is_active'  => true
    ]
]);
