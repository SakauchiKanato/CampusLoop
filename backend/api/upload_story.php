<?php
/**
 * ストーリー投稿 API
 * POST /api/upload_story.php
 *
 * リクエスト形式: multipart/form-data
 * - user_id  (必須): ユーザーID
 * - caption  (任意): 一言コメント
 * - location (任意): 場所タグ
 * - status   (任意): 'free' | 'chat' | 'busy'
 * - image    (任意): 画像ファイル
 *
 * レスポンス (JSON):
 * 成功: { "success": true, "story": { ... } }
 * 失敗: { "success": false, "message": "..." }
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POSTメソッドのみ使用できます。']);
    exit;
}

$user_id  = isset($_POST['user_id'])  ? (int)$_POST['user_id']         : null;
$caption  = isset($_POST['caption'])  ? trim($_POST['caption'])         : null;
$location = isset($_POST['location']) ? trim($_POST['location'])        : null;
$status   = isset($_POST['status'])   ? trim($_POST['status'])          : 'chat';

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id は必須です。']);
    exit;
}

// ステータスのバリデーション
if (!in_array($status, ['free', 'chat', 'busy'])) {
    $status = 'chat';
}

// ==============================
// 画像アップロード処理
// ==============================
$image_path = null;

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = __DIR__ . '/../../uploads/stories/';

    // アップロードディレクトリが存在しない場合は作成
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $allowed_mime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $file_mime    = mime_content_type($_FILES['image']['tmp_name']);

    if (!in_array($file_mime, $allowed_mime)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '許可されていないファイル形式です。']);
        exit;
    }

    // ファイル名をユニークに（衝突防止）
    $ext       = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename  = uniqid('story_', true) . '.' . $ext;
    $dest_path = $upload_dir . $filename;

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $dest_path)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '画像のアップロードに失敗しました。']);
        exit;
    }

    $image_path = 'uploads/stories/' . $filename;
}

// ==============================
// データベースへの保存
// ==============================
$pdo  = get_db();
$stmt = $pdo->prepare(
    'INSERT INTO stories (user_id, caption, location, status, image_path)
     VALUES (:user_id, :caption, :location, :status, :image_path)
     RETURNING id, created_at, expires_at'
);
$stmt->execute([
    ':user_id'    => $user_id,
    ':caption'    => $caption,
    ':location'   => $location,
    ':status'     => $status,
    ':image_path' => $image_path,
]);

$new_story = $stmt->fetch();

echo json_encode([
    'success' => true,
    'story'   => [
        'id'         => (int)$new_story['id'],
        'user_id'    => $user_id,
        'caption'    => $caption,
        'location'   => $location,
        'status'     => $status,
        'image_path' => $image_path,
        'created_at' => $new_story['created_at'],
        'expires_at' => $new_story['expires_at'],
    ]
]);
