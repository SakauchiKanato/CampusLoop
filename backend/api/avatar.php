<?php
/**
 * プロフィール画像（アバター）アップロード API
 *
 * POST   /api/avatar.php  (multipart/form-data, フィールド名 "avatar")
 *   → 画像をアップロードして users.avatar_url を更新する
 * DELETE /api/avatar.php
 *   → 設定済みのプロフィール画像を削除する
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "avatar_url": "uploads/avatars/u1_1234567890.jpg" }
 * 失敗: { "success": false, "message": "エラーメッセージ" }
 *
 * avatar_url は backend/ からの相対パスで保存する（本番/ローカルでホストが
 * 変わっても frontend 側で組み立てられるようにするため。lib/api.ts 参照）。
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// アップロード可能な画像形式と拡張子の対応
const ALLOWED_IMAGE_TYPES = [
    IMAGETYPE_JPEG => 'jpg',
    IMAGETYPE_PNG  => 'png',
    IMAGETYPE_WEBP => 'webp',
];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const AVATAR_DIR    = __DIR__ . '/../uploads/avatars';
const AVATAR_URL_PREFIX = 'uploads/avatars/'; // DBに保存する相対パスの接頭辞

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST または DELETE メソッドのみ使用できます。']);
    exit;
}

// アップロード/削除できるのは常にログイン中の本人のプロフィール画像のみ
$user_id = require_login();

$pdo = get_db();

/**
 * 相対パス（uploads/avatars/xxx）から実ファイルを安全に削除する。
 * パストラバーサル対策として、必ず AVATAR_DIR 配下のファイル名部分だけを使う。
 */
function delete_avatar_file(?string $relative_path): void {
    // str_starts_with() は PHP 8.0+ のため、PHP 7 でも動く substr 比較を使う（register.php と同様）
    if (!$relative_path || substr($relative_path, 0, strlen(AVATAR_URL_PREFIX)) !== AVATAR_URL_PREFIX) {
        return;
    }
    $filename = basename($relative_path); // ディレクトリ部分を無視し、ファイル名だけ取り出す
    $full_path = AVATAR_DIR . '/' . $filename;
    if (is_file($full_path)) {
        @unlink($full_path);
    }
}

// ==============================
// DELETE: プロフィール画像を削除
// ==============================
if ($method === 'DELETE') {
    $stmt = $pdo->prepare('SELECT avatar_url FROM users WHERE id = :id');
    $stmt->execute([':id' => $user_id]);
    $current = $stmt->fetch();

    delete_avatar_file($current['avatar_url'] ?? null);

    $stmt = $pdo->prepare('UPDATE users SET avatar_url = NULL WHERE id = :id');
    $stmt->execute([':id' => $user_id]);

    echo json_encode(['success' => true, 'avatar_url' => null]);
    exit;
}

// ==============================
// POST: プロフィール画像をアップロード
// ==============================
if (!isset($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '画像ファイル(avatar)が送信されていません。']);
    exit;
}

$file = $_FILES['avatar'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $message = $file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE
        ? 'ファイルサイズが大きすぎます。'
        : 'ファイルのアップロードに失敗しました。';
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

if ($file['size'] <= 0 || $file['size'] > MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '画像は3MB以内にしてください。']);
    exit;
}

// クライアントが送ってくる拡張子・Content-Typeは信用せず、
// 実際のファイル内容を検査して本当に画像かどうか・種類は何かを判定する
$image_info = @getimagesize($file['tmp_name']);
if ($image_info === false || !isset(ALLOWED_IMAGE_TYPES[$image_info[2]])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '対応していない画像形式です（JPEG / PNG / WEBP のみ）。']);
    exit;
}
$ext = ALLOWED_IMAGE_TYPES[$image_info[2]];

// 保存先ディレクトリがなければ作成
if (!is_dir(AVATAR_DIR)) {
    mkdir(AVATAR_DIR, 0755, true);
}

// ファイル名はサーバー側で生成する（クライアント指定のファイル名は使わない）
$filename   = 'u' . $user_id . '_' . time() . '.' . $ext;
$dest_path  = AVATAR_DIR . '/' . $filename;
$avatar_url = AVATAR_URL_PREFIX . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest_path)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '画像の保存に失敗しました。']);
    exit;
}

// 古い画像が残っていれば削除してからDBを更新
$stmt = $pdo->prepare('SELECT avatar_url FROM users WHERE id = :id');
$stmt->execute([':id' => $user_id]);
$current = $stmt->fetch();
delete_avatar_file($current['avatar_url'] ?? null);

$stmt = $pdo->prepare('UPDATE users SET avatar_url = :avatar_url WHERE id = :id');
$stmt->execute([':avatar_url' => $avatar_url, ':id' => $user_id]);

echo json_encode(['success' => true, 'avatar_url' => $avatar_url]);
