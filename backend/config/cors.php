<?php
/**
 * CORS および共通レスポンスヘッダーの設定
 *
 * 全APIファイルの冒頭で require_once して使用してください。
 * 例: require_once __DIR__ . '/../config/cors.php';
 *
 * フロントエンドの開発サーバーURL（例: http://localhost:5173）を
 * ALLOWED_ORIGIN に設定してください。
 * 大学サーバーへのデプロイ後は、実際のフロントエンドURLに変更してください。
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// プリフライトリクエスト（OPTIONSメソッド）はここで終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
