<?php
/**
 * 簡易チャット API
 * GET /api/chat.php?match_id=1
 * POST /api/chat.php
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
// GET: メッセージ履歴の取得
// ==============================
if ($method === 'GET') {
    $match_id = isset($_GET['match_id']) ? (int)$_GET['match_id'] : null;
    
    if (!$match_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'match_id は必須です。']);
        exit;
    }
    
    // マッチの基本情報（誰と誰のやり取りか）とメッセージ履歴を取得
    $stmt = $pdo->prepare(
        'SELECT 
            m.id as message_id,
            m.sender_id,
            u.username as sender_name,
            m.content,
            m.created_at
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.match_id = :match_id
         ORDER BY m.created_at ASC'
    );
    $stmt->execute([':match_id' => $match_id]);
    $messages = $stmt->fetchAll();
    
    foreach ($messages as &$msg) {
        $msg['message_id'] = (int)$msg['message_id'];
        $msg['sender_id']  = (int)$msg['sender_id'];
    }
    
    // 対話相手（自分ではないほう）の情報もついでに返す（ユーザー名付き）
    $stmtMatch = $pdo->prepare(
        'SELECT m.from_user, m.to_user, m.status, m.period,
                fu.username AS from_username, tu.username AS to_username
         FROM matches m
         JOIN users fu ON m.from_user = fu.id
         JOIN users tu ON m.to_user = tu.id
         WHERE m.id = :match_id'
    );
    $stmtMatch->execute([':match_id' => $match_id]);
    $match = $stmtMatch->fetch();

    echo json_encode([
        'success'  => true,
        'messages' => $messages,
        'match_info' => $match ? [
            'from_user'     => (int)$match['from_user'],
            'to_user'       => (int)$match['to_user'],
            'from_username' => $match['from_username'],
            'to_username'   => $match['to_username'],
            'status'        => $match['status'],
            'period'        => (int)$match['period']
        ] : null
    ]);
    exit;
}

// ==============================
// POST: メッセージの送信
// ==============================
$body = json_decode(file_get_contents('php://input'), true);

$match_id  = isset($body['match_id'])  ? (int)$body['match_id']  : null;
$sender_id = isset($body['sender_id']) ? (int)$body['sender_id'] : null;
$content   = trim($body['content']     ?? '');

if (!$match_id || !$sender_id || empty($content)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'match_id, sender_id, content は必須です。']);
    exit;
}

$stmt = $pdo->prepare(
    'INSERT INTO messages (match_id, sender_id, content) 
     VALUES (:match_id, :sender_id, :content) 
     RETURNING id, created_at'
);
$stmt->execute([
    ':match_id'  => $match_id,
    ':sender_id' => $sender_id,
    ':content'   => $content
]);
$res = $stmt->fetch();

echo json_encode([
    'success' => true,
    'message' => [
        'message_id' => (int)$res['id'],
        'sender_id'  => $sender_id,
        'content'    => $content,
        'created_at' => $res['created_at']
    ]
]);
