<?php
/**
 * セッション認証ヘルパー
 *
 * ログイン状態が必要なAPIファイルで、cors.php の後に require_once してください。
 * 例:
 *   require_once __DIR__ . '/../config/cors.php';
 *   require_once __DIR__ . '/../config/db.php';
 *   require_once __DIR__ . '/../config/auth.php';
 *
 * これまでは各APIがリクエストの user_id パラメータをそのまま信用していたため、
 * 他人の user_id を指定するだけでプロフィールや時間割を書き換えられてしまう
 * 問題があった（IDOR / なりすまし）。
 * このファイルを読み込むと PHP セッションが開始され、ログイン中のユーザーIDは
 * $_SESSION['user_id'] からのみ取得する。各APIは「誰が」操作しているかを
 * リクエストの user_id ではなく、必ずこのセッション情報から判断すること。
 */

// セッションCookieの設定（session_start() より前に呼ぶ必要がある）
$is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,        // ブラウザを閉じるまで
        'path'     => '/',
        'domain'   => '',
        'secure'   => $is_https,
        'httponly' => true,     // JSからCookieを読めないようにする
        'samesite' => 'Lax',
    ]);
    session_start();
}

/**
 * ログイン中のユーザーIDを返す。未ログインなら null。
 */
function current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

/**
 * ログインを必須にする。
 * 未ログインの場合は 401 を返してスクリプトを終了する。
 * ログイン済みの場合はそのユーザーIDを返す。
 */
function require_login(): int {
    $uid = current_user_id();
    if (!$uid) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'ログインが必要です。']);
        exit;
    }
    return $uid;
}
