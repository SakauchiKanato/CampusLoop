<?php
/**
 * 時間割保存 API（1コマ単位での UPSERT）
 * POST /api/save_timetable.php
 *
 * リクエストボディ (JSON):
 * {
 *   "user_id":     1,
 *   "day_of_week": 2,         // 1=月〜5=金
 *   "period":      3,         // 1〜5限
 *   "title":       "経済学Ⅰ",
 *   "location":    "A301",
 *   "type":        "face-to-face"  // または "online"
 * }
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "message": "保存しました。" }
 * 失敗: { "success": false, "message": "..." }
 *
 * DELETE /api/save_timetable.php  （コマの削除）
 * {
 *   "user_id":     1,
 *   "day_of_week": 2,
 *   "period":      3
 * }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST または DELETE メソッドのみ使用できます。']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

$user_id     = isset($body['user_id'])     ? (int)$body['user_id']     : null;
$day_of_week = isset($body['day_of_week']) ? (int)$body['day_of_week'] : null;
$period      = isset($body['period'])      ? (int)$body['period']      : null;

if (!$user_id || !$day_of_week || !$period) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id, day_of_week, period は必須です。']);
    exit;
}

$pdo = get_db();

// ==============================
// DELETE: コマを削除
// ==============================
if ($method === 'DELETE') {
    $stmt = $pdo->prepare(
        'DELETE FROM timetables WHERE user_id = :user_id AND day_of_week = :day_of_week AND period = :period'
    );
    $stmt->execute([
        ':user_id'     => $user_id,
        ':day_of_week' => $day_of_week,
        ':period'      => $period,
    ]);
    echo json_encode(['success' => true, 'message' => '削除しました。']);
    exit;
}

// ==============================
// POST: コマを登録または更新（UPSERT）
// ==============================
$title    = trim($body['title']    ?? '');
$location = trim($body['location'] ?? '');
$type     = trim($body['type']     ?? 'face-to-face');

if (empty($title)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'title は必須です。']);
    exit;
}

if (!in_array($type, ['face-to-face', 'online'])) {
    $type = 'face-to-face';
}

// PostgreSQLのUPSERT構文（ON CONFLICT）を使用
$stmt = $pdo->prepare(
    'INSERT INTO timetables (user_id, day_of_week, period, title, location, type)
     VALUES (:user_id, :day_of_week, :period, :title, :location, :type)
     ON CONFLICT (user_id, day_of_week, period)
     DO UPDATE SET title = EXCLUDED.title, location = EXCLUDED.location, type = EXCLUDED.type'
);
$stmt->execute([
    ':user_id'     => $user_id,
    ':day_of_week' => $day_of_week,
    ':period'      => $period,
    ':title'       => $title,
    ':location'    => $location,
    ':type'        => $type,
]);

echo json_encode(['success' => true, 'message' => '保存しました。']);
