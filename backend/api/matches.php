<?php
/**
 * マッチング API
 * GET    /api/matches.php?user_id=1&day_of_week=1&period=3
 * POST   /api/matches.php (新規誘い出し作成)
 * PUT    /api/matches.php (ステータス変更: 承諾/拒否)
 * DELETE /api/matches.php (自分が送った誘いの取り消し。pending中のみ)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GET, POST, PUT または DELETE メソッドのみ使用できます。']);
    exit;
}

// マッチ関連はすべてログイン必須。「自分」は常にセッションのユーザーIDを使う。
$session_user_id = require_login();

$pdo = get_db();

// location 列がなければ追加する（status.php 側と同じ移行ガード。呼び出し順に依存しないように）
$pdo->exec('ALTER TABLE statuses ADD COLUMN IF NOT EXISTS location VARCHAR(50) DEFAULT NULL');

// 誘い（とそのチャット）は「その日限り」のもの。
// 前日以前のマッチを削除する（messages は ON DELETE CASCADE で一緒に消える）
$pdo->exec('DELETE FROM matches WHERE created_at < CURRENT_DATE');

// ==============================
// GET (pending=1): 自分宛の未応答の誘い一覧（通知バッジ用）
// ==============================
if ($method === 'GET' && isset($_GET['pending'])) {
    $stmt = $pdo->prepare(
        'SELECT m.id AS match_id, m.period, m.from_user, u.username AS from_username, u.avatar_url AS from_avatar_url
         FROM matches m
         JOIN users u ON m.from_user = u.id
         WHERE m.to_user = :uid AND m.status = \'pending\' AND m.created_at >= CURRENT_DATE
         ORDER BY m.period ASC'
    );
    $stmt->execute([':uid' => $session_user_id]);
    $invites = $stmt->fetchAll();

    foreach ($invites as &$inv) {
        $inv['match_id']  = (int)$inv['match_id'];
        $inv['period']    = (int)$inv['period'];
        $inv['from_user'] = (int)$inv['from_user'];
    }

    echo json_encode(['success' => true, 'invites' => $invites, 'count' => count($invites)]);
    exit;
}

// ==============================
// GET: 特定時限の空きコママッチ候補一覧
// ==============================
if ($method === 'GET') {
    $day_of_week = isset($_GET['day_of_week']) ? (int)$_GET['day_of_week'] : null;
    $period      = isset($_GET['period'])      ? (int)$_GET['period']      : null;

    if (!$day_of_week || !$period) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'day_of_week, period は必須です。']);
        exit;
    }

    $user_id = $session_user_id;

    // 1. 自分と友達であり、かつ指定コマが空きコマ（is_free = true）になっているユーザーを取得
    // 2. さらに、有効期限内のステータスを結合
    // 3. 自分とそのユーザーの間の「最新の誘い出し（matches）」の状態も取得
    $stmt = $pdo->prepare(
        'SELECT 
            u.id as friend_id,
            u.username,
            u.avatar_url,
            u.faculty,
            u.circle,
            COALESCE(s.level, \'busy\') as status_level, -- デフォルトは busy
            s.location as status_location,
            s.comment as status_comment,
            s.expires_at as status_expires_at,
            m.id as match_id,
            m.from_user as match_from_user,
            m.status as match_status
         FROM friendships f
         JOIN users u ON f.friend_id = u.id
         JOIN timetables t ON u.id = t.user_id AND t.day_of_week = :day_of_week AND t.period = :period AND t.is_free = true
         LEFT JOIN statuses s ON u.id = s.user_id AND s.expires_at > CURRENT_TIMESTAMP
         LEFT JOIN matches m ON 
            ((m.from_user = :user_id AND m.to_user = u.id) OR (m.from_user = u.id AND m.to_user = :user_id))
            AND m.period = :period
            AND m.created_at >= CURRENT_DATE -- 今日のマッチのみ対象
         WHERE f.user_id = :user_id
         ORDER BY 
            CASE 
                WHEN s.level = \'free\' THEN 1
                WHEN s.level = \'chat\' THEN 2
                ELSE 3
            END,
            u.username'
    );
    
    $stmt->execute([
        ':user_id'     => $user_id,
        ':day_of_week' => $day_of_week,
        ':period'      => $period
    ]);
    
    $candidates = $stmt->fetchAll();
    
    // 数値や論理値のキャスト
    foreach ($candidates as &$c) {
        $c['friend_id']       = (int)$c['friend_id'];
        $c['match_id']        = $c['match_id'] ? (int)$c['match_id'] : null;
        $c['match_from_user'] = $c['match_from_user'] ? (int)$c['match_from_user'] : null;
        $c['is_free']         = true; // 時間割クエリで絞り込んでいるため確定
    }

    echo json_encode([
        'success'    => true,
        'candidates' => $candidates
    ]);
    exit;
}

// ==============================
// POST: 新規誘い出し（マッチ申請）作成
// ==============================
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    // 誘う側（from_user）は常にログイン中の本人
    $from_user = $session_user_id;
    $to_user   = isset($body['to_user'])   ? (int)$body['to_user']   : null;
    $period    = isset($body['period'])    ? (int)$body['period']    : null;

    if (!$to_user || !$period) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'to_user, period は必須です。']);
        exit;
    }
    if ($from_user === $to_user) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '自分自身を誘うことはできません。']);
        exit;
    }
    
    // すでに今日同じ組み合わせでマッチが作成されていないかチェック
    $stmt = $pdo->prepare(
        'SELECT id, status FROM matches 
         WHERE ((from_user = :from AND to_user = :to) OR (from_user = :to AND to_user = :from))
         AND period = :period AND created_at >= CURRENT_DATE'
    );
    $stmt->execute([':from' => $from_user, ':to' => $to_user, ':period' => $period]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        echo json_encode([
            'success' => true,
            'message' => 'すでに誘い出しが作成されています。',
            'match_id' => (int)$existing['id'],
            'status'   => $existing['status']
        ]);
        exit;
    }
    
    // 新規作成
    $stmt = $pdo->prepare(
        'INSERT INTO matches (from_user, to_user, period, status) 
         VALUES (:from_user, :to_user, :period, \'pending\') 
         RETURNING id'
    );
    $stmt->execute([
        ':from_user' => $from_user,
        ':to_user'   => $to_user,
        ':period'    => $period
    ]);
    $new_match = $stmt->fetch();
    $match_id  = (int)$new_match['id'];

    echo json_encode([
        'success'  => true,
        'message'  => '誘い出しを送信しました。',
        'match_id' => $match_id,
        'status'   => 'pending'
    ]);
    exit;
}

// ==============================
// PUT: マッチのステータス変更（承認/拒否）
// ==============================
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);

    $match_id = isset($body['match_id']) ? (int)$body['match_id'] : null;
    $status   = trim($body['status']     ?? ''); // 'accepted' または 'rejected'

    if (!$match_id || !in_array($status, ['accepted', 'rejected'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'match_id と有効な status (accepted/rejected) は必須です。']);
        exit;
    }

    // 誘いに応答できるのは、誘われた本人（to_user）だけ
    $stmt = $pdo->prepare('SELECT to_user FROM matches WHERE id = :match_id');
    $stmt->execute([':match_id' => $match_id]);
    $match = $stmt->fetch();

    if (!$match) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'マッチが見つかりません。']);
        exit;
    }
    if ((int)$match['to_user'] !== $session_user_id) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'この誘いに応答できるのは相手本人だけです。']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE matches SET status = :status WHERE id = :match_id');
    $stmt->execute([':status' => $status, ':match_id' => $match_id]);

    echo json_encode([
        'success' => true,
        'message' => 'ステータスを更新しました。'
    ]);
    exit;
}

// ==============================
// DELETE: 自分が送った誘いの取り消し
// ==============================
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);

    $match_id = isset($body['match_id']) ? (int)$body['match_id'] : null;

    if (!$match_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'match_id は必須です。']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT from_user, status FROM matches WHERE id = :match_id');
    $stmt->execute([':match_id' => $match_id]);
    $match = $stmt->fetch();

    if (!$match) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'マッチが見つかりません。']);
        exit;
    }
    // 取り消せるのは、自分が送った誘いだけ
    if ((int)$match['from_user'] !== $session_user_id) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => '自分が送った誘いだけ取り消せます。']);
        exit;
    }
    // すでに相手が応答済みの誘いは取り消せない（承諾済みならチャットが始まっている）
    if ($match['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'すでに応答された誘いは取り消せません。']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM matches WHERE id = :match_id');
    $stmt->execute([':match_id' => $match_id]);

    echo json_encode(['success' => true, 'message' => '誘いを取り消しました。']);
    exit;
}
