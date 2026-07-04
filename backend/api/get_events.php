<?php
/**
 * 学内イベント一覧取得 API
 * GET /api/get_events.php?period=3
 *
 * クエリパラメータ:
 * - period (任意): 対象の空きコマ番号（指定すると自動フィルタリング）
 *
 * レスポンス (JSON):
 * {
 *   "success": true,
 *   "events": [
 *     {
 *       "id": 1, "title": "アコギ新歓ライブ", "organizer": "アコギサークル",
 *       "location": "芝生広場", "time_slot": "13:10~14:00",
 *       "target_period": 3, "category": "music", "description": "..."
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

$pdo    = get_db();
$period = isset($_GET['period']) ? (int)$_GET['period'] : null;

if ($period && $period >= 1 && $period <= 5) {
    $stmt = $pdo->prepare(
        'SELECT id, title, organizer, location, time_slot, target_period, category, description
         FROM events
         WHERE target_period = :period
         ORDER BY created_at DESC'
    );
    $stmt->execute([':period' => $period]);
} else {
    $stmt = $pdo->prepare(
        'SELECT id, title, organizer, location, time_slot, target_period, category, description
         FROM events
         ORDER BY target_period, created_at DESC'
    );
    $stmt->execute();
}

$events = $stmt->fetchAll();

// 数値フィールドをキャスト
foreach ($events as &$row) {
    $row['id']            = (int)$row['id'];
    $row['target_period'] = (int)$row['target_period'];
}

echo json_encode([
    'success' => true,
    'events'  => $events
]);
