<?php
/**
 * 時間割 API
 * GET /api/timetable.php?user_id=1
 * POST /api/timetable.php (UPSERT)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GET または POST メソッドのみ使用できます。']);
    exit;
}

// 自分の時間割しか読み書きできない。user_id は常にログイン中の本人のもの。
$user_id = require_login();

$pdo = get_db();

// ==============================
// GET: 時間割の取得
// ==============================
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, day_of_week, period, subject, is_free, location, type
         FROM timetables
         WHERE user_id = :user_id
         ORDER BY day_of_week, period'
    );
    $stmt->execute([':user_id' => $user_id]);
    $timetable = $stmt->fetchAll();
    
    foreach ($timetable as &$row) {
        $row['id']          = (int)$row['id'];
        $row['day_of_week'] = (int)$row['day_of_week'];
        $row['period']      = (int)$row['period'];
        $row['is_free']     = (bool)$row['is_free'];
    }
    
    echo json_encode([
        'success'   => true,
        'timetable' => $timetable
    ]);
    exit;
}

// ==============================
// POST: コマの登録または更新（UPSERT）
// ==============================
$body = json_decode(file_get_contents('php://input'), true);

$day_of_week = isset($body['day_of_week']) ? (int)$body['day_of_week'] : null;
$period      = isset($body['period'])      ? (int)$body['period']      : null;
$subject     = trim($body['subject']       ?? '');
$is_free     = isset($body['is_free'])     ? (bool)$body['is_free']    : false;
$location    = trim($body['location']      ?? '');
$type        = trim($body['type']          ?? 'face-to-face');

if (!$day_of_week || !$period) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'day_of_week, period は必須です。']);
    exit;
}

if (!in_array($type, ['face-to-face', 'online'])) {
    $type = 'face-to-face';
}

$stmt = $pdo->prepare(
    'INSERT INTO timetables (user_id, day_of_week, period, subject, is_free, location, type)
     VALUES (:user_id, :day_of_week, :period, :subject, :is_free, :location, :type)
     ON CONFLICT (user_id, day_of_week, period)
     DO UPDATE SET subject = EXCLUDED.subject, is_free = EXCLUDED.is_free, location = EXCLUDED.location, type = EXCLUDED.type'
);
$stmt->execute([
    ':user_id'     => $user_id,
    ':day_of_week' => $day_of_week,
    ':period'      => $period,
    ':subject'     => $subject,
    ':is_free'     => $is_free ? 1 : 0,
    ':location'    => $location,
    ':type'        => $type,
]);

echo json_encode(['success' => true, 'message' => '保存しました。']);
