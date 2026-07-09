<?php
/**
 * 学内イベント API（学生発信・全ユーザーに公開）
 *
 * GET    /api/events.php?user_id=1        → 今日以降のイベント一覧（参加人数・自分の参加状況付き）
 * POST   /api/events.php                  → イベント作成
 * PUT    /api/events.php                  → 参加/参加取り消しのトグル
 * DELETE /api/events.php                  → イベント削除（作成者のみ）
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GET, POST, PUT, DELETE メソッドのみ使用できます。']);
    exit;
}

$pdo = get_db();

// テーブルがなければ作成する（既存DBを壊さずに導入できるように init_db 再実行は不要）
$pdo->exec(
    'CREATE TABLE IF NOT EXISTS events (
        id          SERIAL PRIMARY KEY,
        creator_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(100) NOT NULL,
        description TEXT         DEFAULT NULL,
        event_date  DATE         NOT NULL,
        period      SMALLINT     NOT NULL CHECK (period BETWEEN 1 AND 5),
        location    VARCHAR(100) DEFAULT NULL,
        campus      VARCHAR(100) DEFAULT \'有明キャンパス\',
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS event_participants (
        event_id  INTEGER   NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id   INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (event_id, user_id)
    );'
);

// 開催日を過ぎたイベントは自動削除（参加情報も CASCADE で消える）
$pdo->exec('DELETE FROM events WHERE event_date < CURRENT_DATE');

// ==============================
// GET: イベント一覧（今日以降）
// ==============================
if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    $stmt = $pdo->prepare(
        'SELECT
            e.id, e.title, e.description, e.event_date, e.period,
            e.location, e.campus, e.creator_id,
            u.username AS creator_name,
            (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) AS participant_count,
            EXISTS(SELECT 1 FROM event_participants ep2 WHERE ep2.event_id = e.id AND ep2.user_id = :uid) AS is_joined
         FROM events e
         JOIN users u ON e.creator_id = u.id
         ORDER BY e.event_date ASC, e.period ASC, e.id ASC
         LIMIT 100'
    );
    $stmt->execute([':uid' => $user_id]);
    $events = $stmt->fetchAll();

    foreach ($events as &$e) {
        $e['id']                = (int)$e['id'];
        $e['creator_id']        = (int)$e['creator_id'];
        $e['period']            = (int)$e['period'];
        $e['participant_count'] = (int)$e['participant_count'];
        $e['is_joined']         = (bool)$e['is_joined'];
    }

    echo json_encode(['success' => true, 'events' => $events]);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

// ==============================
// POST: イベント作成
// ==============================
if ($method === 'POST') {
    $creator_id  = isset($body['creator_id']) ? (int)$body['creator_id'] : null;
    $title       = trim($body['title']        ?? '');
    $description = trim($body['description']  ?? '');
    $event_date  = trim($body['event_date']   ?? '');
    $period      = isset($body['period'])     ? (int)$body['period']     : null;
    $location    = trim($body['location']     ?? '');
    $campus      = trim($body['campus']       ?? '有明キャンパス');

    if (!$creator_id || $title === '' || $event_date === '' || !$period) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'creator_id・タイトル・開催日・時限は必須です。']);
        exit;
    }
    if (mb_strlen($title) > 100) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'タイトルは100文字以内にしてください。']);
        exit;
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $event_date) || $event_date < date('Y-m-d')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '開催日は今日以降の日付（YYYY-MM-DD）で指定してください。']);
        exit;
    }
    if ($period < 1 || $period > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '時限は1〜5で指定してください。']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO events (creator_id, title, description, event_date, period, location, campus)
         VALUES (:creator_id, :title, :description, :event_date, :period, :location, :campus)
         RETURNING id'
    );
    $stmt->execute([
        ':creator_id'  => $creator_id,
        ':title'       => $title,
        ':description' => $description,
        ':event_date'  => $event_date,
        ':period'      => $period,
        ':location'    => $location,
        ':campus'      => $campus,
    ]);
    $new = $stmt->fetch();

    // 作成者は自動で参加者に入れる
    $stmt = $pdo->prepare('INSERT INTO event_participants (event_id, user_id) VALUES (:eid, :uid) ON CONFLICT DO NOTHING');
    $stmt->execute([':eid' => (int)$new['id'], ':uid' => $creator_id]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'イベントを作成しました！', 'event_id' => (int)$new['id']]);
    exit;
}

// ==============================
// PUT: 参加 / 参加取り消し のトグル
// ==============================
if ($method === 'PUT') {
    $event_id = isset($body['event_id']) ? (int)$body['event_id'] : null;
    $user_id  = isset($body['user_id'])  ? (int)$body['user_id']  : null;

    if (!$event_id || !$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'event_id と user_id は必須です。']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT 1 FROM event_participants WHERE event_id = :eid AND user_id = :uid');
    $stmt->execute([':eid' => $event_id, ':uid' => $user_id]);

    if ($stmt->fetch()) {
        // すでに参加中 → 取り消し
        $stmt = $pdo->prepare('DELETE FROM event_participants WHERE event_id = :eid AND user_id = :uid');
        $stmt->execute([':eid' => $event_id, ':uid' => $user_id]);
        $joined = false;
    } else {
        $stmt = $pdo->prepare('INSERT INTO event_participants (event_id, user_id) VALUES (:eid, :uid)');
        $stmt->execute([':eid' => $event_id, ':uid' => $user_id]);
        $joined = true;
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM event_participants WHERE event_id = :eid');
    $stmt->execute([':eid' => $event_id]);
    $cnt = $stmt->fetch();

    echo json_encode([
        'success'           => true,
        'joined'            => $joined,
        'participant_count' => (int)$cnt['cnt'],
    ]);
    exit;
}

// ==============================
// DELETE: イベント削除（作成者のみ）
// ==============================
if ($method === 'DELETE') {
    $event_id = isset($body['event_id']) ? (int)$body['event_id'] : null;
    $user_id  = isset($body['user_id'])  ? (int)$body['user_id']  : null;

    if (!$event_id || !$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'event_id と user_id は必須です。']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT creator_id FROM events WHERE id = :eid');
    $stmt->execute([':eid' => $event_id]);
    $event = $stmt->fetch();

    if (!$event) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'イベントが見つかりません。']);
        exit;
    }
    if ((int)$event['creator_id'] !== $user_id) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'イベントを削除できるのは作成者だけです。']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM events WHERE id = :eid');
    $stmt->execute([':eid' => $event_id]);

    echo json_encode(['success' => true, 'message' => 'イベントを削除しました。']);
    exit;
}
