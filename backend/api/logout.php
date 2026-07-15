<?php
/**
 * ログアウト API
 * POST /api/logout.php
 *
 * サーバー側のセッションを破棄する。
 * レスポンス: { "success": true }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POSTメソッドのみ使用できます。']);
    exit;
}

$_SESSION = [];

// セッションCookie自体も破棄する
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

session_destroy();

echo json_encode(['success' => true, 'message' => 'ログアウトしました。']);
