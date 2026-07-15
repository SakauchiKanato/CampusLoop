<?php
/**
 * CORS および共通レスポンスヘッダーの設定
 *
 * 全APIファイルの冒頭で require_once して使用してください。
 * 例: require_once __DIR__ . '/../config/cors.php';
 *
 * セッションCookieを使う認証（config/auth.php）と組み合わせるため、
 * Access-Control-Allow-Origin は「*」やリクエストの Origin をそのまま
 * 反射させず、許可したオリジンのみに限定しています。
 * （Allow-Credentials: true と Allow-Origin の無条件反射を組み合わせると、
 * 　どのWebサイトからでもログイン済みユーザーのCookie付きリクエストが
 * 　通ってしまうため。）
 *
 * 大学サーバーへのデプロイ後、フロントエンドを別オリジンで配信する場合は
 * 下の $allowed_origins にそのURLを追加してください。
 * フロントとバックエンドが同一オリジン（同じサーバーの同じホスト）の場合、
 * ブラウザはそもそもCORSチェックを行わないため追加不要です。
 */

$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

header('Content-Type: application/json; charset=UTF-8');
if (in_array($origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// プリフライトリクエスト（OPTIONSメソッド）はここで終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
