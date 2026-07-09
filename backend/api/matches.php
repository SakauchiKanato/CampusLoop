<?php
/**
 * マッチング API
 * GET /api/matches.php?user_id=1&day_of_week=1&period=3
 * POST /api/matches.php (新規誘い出し作成)
 * PUT /api/matches.php (ステータス変更: 承諾/拒否)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST', 'PUT'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'GET, POST または PUT メソッドのみ使用できます。']);
    exit;
}

$pdo = get_db();

// 誘い（とそのチャット）は「その日限り」のもの。
// 前日以前のマッチを削除する（messages は ON DELETE CASCADE で一緒に消える）
$pdo->exec('DELETE FROM matches WHERE created_at < CURRENT_DATE');

// ==============================
// GET: 特定時限の空きコママッチ候補一覧
// ==============================
if ($method === 'GET') {
    $user_id     = isset($_GET['user_id'])     ? (int)$_GET['user_id']     : null;
    $day_of_week = isset($_GET['day_of_week']) ? (int)$_GET['day_of_week'] : null;
    $period      = isset($_GET['period'])      ? (int)$_GET['period']      : null;

    if (!$user_id || !$day_of_week || !$period) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'user_id, day_of_week, period は必須です。']);
        exit;
    }

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
    
    $from_user = isset($body['from_user']) ? (int)$body['from_user'] : null;
    $to_user   = isset($body['to_user'])   ? (int)$body['to_user']   : null;
    $period    = isset($body['period'])    ? (int)$body['period']    : null;
    
    if (!$from_user || !$to_user || !$period) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'from_user, to_user, period は必須です。']);
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

    // 初期メッセージ「一緒にお昼行かない？」を自動送信
    $stmtMsg = $pdo->prepare(
        'INSERT INTO messages (match_id, sender_id, content) VALUES (:match_id, :sender_id, :content)'
    );
    $stmtMsg->execute([
        ':match_id'  => $match_id,
        ':sender_id' => $from_user,
        ':content'   => '一緒にお昼行かない？'
    ]);
    
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
    
    $stmt = $pdo->prepare('UPDATE matches SET status = :status WHERE id = :match_id');
    $stmt->execute([':status' => $status, ':match_id' => $match_id]);
    
    // もし承認（accepted）されたら、自動でチャットの承諾メッセージを入れる
    if ($status === 'accepted') {
        // マッチの情報を取得
        $stmtMatch = $pdo->prepare('SELECT to_user FROM matches WHERE id = :match_id');
        $stmtMatch->execute([':match_id' => $match_id]);
        $matchInfo = $stmtMatch->fetch();
        
        if ($matchInfo) {
            $stmtMsg = $pdo->prepare(
                'INSERT INTO messages (match_id, sender_id, content) VALUES (:match_id, :sender_id, :content)'
            );
            $stmtMsg->execute([
                ':match_id'  => $match_id,
                ':sender_id' => (int)$matchInfo['to_user'],
                ':content'   => 'いいよ！今どこ？'
            ]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'ステータスを更新しました。'
    ]);
    exit;
}
