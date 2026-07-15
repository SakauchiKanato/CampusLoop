<?php
/**
 * フレンド API
 * GET  /api/friends.php?user_id=1           → フレンド一覧
 * POST /api/friends.php                     → フレンド追加
 * GET  /api/friends.php?search=1&q=keyword  → ユーザー検索
 *
 * POST リクエストボディ (JSON):
 * { "user_id": 1, "friend_id": 2 }
 * または
 * { "user_id": 1, "friend_username": "campus_taro" }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// フレンド関連はすべてログイン必須。「自分」は常にセッションのユーザーIDを使う。
$user_id = require_login();

// ─────────────── GET: フレンド一覧 or ユーザー検索 ───────────────
if ($method === 'GET') {

    // ユーザー検索モード
    if (isset($_GET['search']) && isset($_GET['q'])) {
        $q = trim($_GET['q']);
        $exclude_id = $user_id; // 自分自身は検索結果から除外する（他人のIDは指定させない）

        if (strlen($q) < 1) {
            echo json_encode(['success' => true, 'users' => []]);
            exit;
        }

        $pdo = get_db();
        $stmt = $pdo->prepare(
            'SELECT id, username, faculty, circle, campus, avatar_url
             FROM users
             WHERE (username ILIKE :q OR CAST(id AS TEXT) = :exact_id)
               AND id != :exclude_id
             LIMIT 10'
        );
        $stmt->execute([
            ':q'          => '%' . $q . '%',
            ':exact_id'   => $q,
            ':exclude_id' => $exclude_id,
        ]);
        $users = $stmt->fetchAll();

        foreach ($users as &$u) {
            $u['id'] = (int)$u['id'];
        }

        echo json_encode(['success' => true, 'users' => $users]);
        exit;
    }

    // フレンド一覧モード（常に自分のフレンド一覧のみ）
    $pdo = get_db();

    $stmt = $pdo->prepare(
        'SELECT 
            u.id as friend_id,
            u.username,
            u.avatar_url,
            u.faculty,
            u.circle
         FROM friendships f
         JOIN users u ON f.friend_id = u.id
         WHERE f.user_id = :user_id
         ORDER BY u.username ASC'
    );
    $stmt->execute([':user_id' => $user_id]);
    $friends = $stmt->fetchAll();

    foreach ($friends as &$f) {
        $f['friend_id'] = (int)$f['friend_id'];
    }

    echo json_encode([
        'success' => true,
        'friends' => $friends
    ]);
    exit;
}

// ─────────────── POST: フレンド追加 ───────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    // 追加する側（user_id）は常にログイン中の本人
    $friend_id       = isset($body['friend_id']) ? (int)$body['friend_id'] : null;
    $friend_username = trim($body['friend_username'] ?? '');

    $pdo = get_db();

    // ユーザー名からIDを解決
    if (!$friend_id && $friend_username !== '') {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE username = :username');
        $stmt->execute([':username' => $friend_username]);
        $found = $stmt->fetch();
        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => '指定されたユーザーが見つかりません。']);
            exit;
        }
        $friend_id = (int)$found['id'];
    }

    if (!$friend_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'friend_id または friend_username は必須です。']);
        exit;
    }

    if ($user_id === $friend_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '自分自身を友達追加することはできません。']);
        exit;
    }

    // 相手ユーザー存在確認
    $stmt = $pdo->prepare('SELECT id, username FROM users WHERE id = :id');
    $stmt->execute([':id' => $friend_id]);
    $friend_user = $stmt->fetch();
    if (!$friend_user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => '指定されたユーザーが見つかりません。']);
        exit;
    }

    // 既に友達か確認
    $stmt = $pdo->prepare('SELECT 1 FROM friendships WHERE user_id = :uid AND friend_id = :fid');
    $stmt->execute([':uid' => $user_id, ':fid' => $friend_id]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'すでに友達登録されています。']);
        exit;
    }

    // 双方向で friendships に追加
    $stmt = $pdo->prepare(
        'INSERT INTO friendships (user_id, friend_id) VALUES (:uid, :fid), (:fid2, :uid2)
         ON CONFLICT DO NOTHING'
    );
    $stmt->execute([
        ':uid'  => $user_id,
        ':fid'  => $friend_id,
        ':fid2' => $friend_id,
        ':uid2' => $user_id,
    ]);

    echo json_encode([
        'success' => true,
        'message' => $friend_user['username'] . 'さんを友達に追加しました。',
        'friend'  => [
            'friend_id' => $friend_id,
            'username'  => $friend_user['username'],
        ]
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'GET または POST メソッドのみ使用できます。']);
