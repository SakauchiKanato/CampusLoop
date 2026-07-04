<?php
/**
 * 時間割取得 API
 * GET /api/get_timetable.php?user_id=1
 *
 * クエリパラメータ:
 * - user_id (必須): ユーザーID
 *
 * レスポンス (JSON):
 * {
 *   "success": true,
 *   "timetable": [
 *     { "id": 1, "day_of_week": 1, "period": 2, "title": "英語", "location": "A201", "type": "face-to-face" },
 *     ...
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

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id は必須です。']);
    exit;
}

$pdo  = get_db();
$stmt = $pdo->prepare(
    'SELECT id, day_of_week, period, title, location, type
     FROM timetables
     WHERE user_id = :user_id
     ORDER BY day_of_week, period'
);
$stmt->execute([':user_id' => $user_id]);
$timetable = $stmt->fetchAll();

// 数値フィールドをキャスト
foreach ($timetable as &$row) {
    $row['id']          = (int)$row['id'];
    $row['day_of_week'] = (int)$row['day_of_week'];
    $row['period']      = (int)$row['period'];
}

echo json_encode([
    'success'   => true,
    'timetable' => $timetable
]);
