<?php
/**
 * データベース初期化＆デモデータ挿入スクリプト
 * 
 * 実行方法:
 * - ブラウザからアクセス: http://<サーバーURL>/CampusLoop/backend/db/init_db.php
 * - CLIから実行: php init_db.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = get_db();

    // 1. schema.sql の読み込みと実行
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("schema.sql が見つかりません。");
    }
    
    $sql = file_get_contents($schemaFile);
    $pdo->exec($sql);
    echo "【成功】データベーステーブルを再構築しました。\n<br>";

    // 2. デモデータの挿入
    // パスワードハッシュの作成
    $pwHash = password_hash('password123', PASSWORD_BCRYPT);
    $kntPwHash = password_hash('nFb55bRP', PASSWORD_BCRYPT); // knt416用

    // ユーザー挿入
    $users = [
        ['username' => 'knt416', 'password_hash' => $kntPwHash, 'campus' => '有明キャンパス', 'faculty' => '経営学部3年', 'circle' => '軽音サークル', 'avatar_url' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'],
        ['username' => 'takuya', 'password_hash' => $pwHash, 'campus' => '有明キャンパス', 'faculty' => '経済学部3年', 'circle' => '軽音サークル', 'avatar_url' => 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100'],
        ['username' => 'yui', 'password_hash' => $pwHash, 'campus' => '有明キャンパス', 'faculty' => '文学部3年', 'circle' => '服飾サークル', 'avatar_url' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'],
        ['username' => 'kenta', 'password_hash' => $pwHash, 'campus' => '有明キャンパス', 'faculty' => '理工学部2年', 'circle' => 'テニスサークル', 'avatar_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100']
    ];

    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, campus, faculty, circle, avatar_url) VALUES (:username, :password_hash, :campus, :faculty, :circle, :avatar_url) RETURNING id');
    
    $userIds = [];
    foreach ($users as $u) {
        $stmt->execute([
            ':username' => $u['username'],
            ':password_hash' => $u['password_hash'],
            ':campus' => $u['campus'],
            ':faculty' => $u['faculty'],
            ':circle' => $u['circle'],
            ':avatar_url' => $u['avatar_url']
        ]);
        $res = $stmt->fetch();
        $userIds[$u['username']] = (int)$res['id'];
    }
    echo "【成功】デモユーザーを挿入しました。\n<br>";

    // フレンド関係挿入 (knt416と他3人、およびtakuya-yui)
    $friends = [
        [$userIds['knt416'], $userIds['takuya']],
        [$userIds['takuya'], $userIds['knt416']],
        
        [$userIds['knt416'], $userIds['yui']],
        [$userIds['yui'], $userIds['knt416']],
        
        [$userIds['knt416'], $userIds['kenta']],
        [$userIds['kenta'], $userIds['knt416']],
        
        [$userIds['takuya'], $userIds['yui']],
        [$userIds['yui'], $userIds['takuya']]
    ];

    $stmt = $pdo->prepare('INSERT INTO friendships (user_id, friend_id) VALUES (:user_id, :friend_id)');
    foreach ($friends as $f) {
        $stmt->execute([':user_id' => $f[0], ':friend_id' => $f[1]]);
    }
    echo "【成功】フレンド関係を挿入しました。\n<br>";

    // 時間割挿入 (1〜5限、月曜日のダミーデータ)
    // is_free = true の場合は subject を空にするか '空きコマ' にする
    $timetables = [
        // knt416 (月曜日の時間割)
        ['user_id' => $userIds['knt416'], 'day_of_week' => 1, 'period' => 1, 'subject' => '英語', 'is_free' => false, 'location' => 'A201', 'type' => 'face-to-face'],
        ['user_id' => $userIds['knt416'], 'day_of_week' => 1, 'period' => 2, 'subject' => '経済学入門', 'is_free' => false, 'location' => 'B302', 'type' => 'face-to-face'],
        ['user_id' => $userIds['knt416'], 'day_of_week' => 1, 'period' => 3, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],
        ['user_id' => $userIds['knt416'], 'day_of_week' => 1, 'period' => 4, 'subject' => 'ゼミ', 'is_free' => false, 'location' => '演習室4', 'type' => 'face-to-face'],
        ['user_id' => $userIds['knt416'], 'day_of_week' => 1, 'period' => 5, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],

        // takuya (月曜日の時間割。3限・5限が空き)
        ['user_id' => $userIds['takuya'], 'day_of_week' => 1, 'period' => 1, 'subject' => '英語', 'is_free' => false, 'location' => 'A201', 'type' => 'face-to-face'],
        ['user_id' => $userIds['takuya'], 'day_of_week' => 1, 'period' => 2, 'subject' => '経済学入門', 'is_free' => false, 'location' => 'B302', 'type' => 'face-to-face'],
        ['user_id' => $userIds['takuya'], 'day_of_week' => 1, 'period' => 3, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],
        ['user_id' => $userIds['takuya'], 'day_of_week' => 1, 'period' => 4, 'subject' => 'マーケティング', 'is_free' => false, 'location' => 'C401', 'type' => 'face-to-face'],
        ['user_id' => $userIds['takuya'], 'day_of_week' => 1, 'period' => 5, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],

        // yui (月曜日の時間割。2限・3限・5限が空き)
        ['user_id' => $userIds['yui'], 'day_of_week' => 1, 'period' => 1, 'subject' => '日本文学史', 'is_free' => false, 'location' => 'D102', 'type' => 'face-to-face'],
        ['user_id' => $userIds['yui'], 'day_of_week' => 1, 'period' => 2, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],
        ['user_id' => $userIds['yui'], 'day_of_week' => 1, 'period' => 3, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],
        ['user_id' => $userIds['yui'], 'day_of_week' => 1, 'period' => 4, 'subject' => 'ゼミ', 'is_free' => false, 'location' => '演習室2', 'type' => 'face-to-face'],
        ['user_id' => $userIds['yui'], 'day_of_week' => 1, 'period' => 5, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],

        // kenta (月曜日の時間割。3限・5限が空き)
        ['user_id' => $userIds['kenta'], 'day_of_week' => 1, 'period' => 1, 'subject' => '線形代数学', 'is_free' => false, 'location' => 'S101', 'type' => 'face-to-face'],
        ['user_id' => $userIds['kenta'], 'day_of_week' => 1, 'period' => 2, 'subject' => '力学基礎', 'is_free' => false, 'location' => 'S102', 'type' => 'face-to-face'],
        ['user_id' => $userIds['kenta'], 'day_of_week' => 1, 'period' => 3, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face'],
        ['user_id' => $userIds['kenta'], 'day_of_week' => 1, 'period' => 4, 'subject' => 'プログラミング演習', 'is_free' => false, 'location' => 'PC演習室1', 'type' => 'face-to-face'],
        ['user_id' => $userIds['kenta'], 'day_of_week' => 1, 'period' => 5, 'subject' => '', 'is_free' => true, 'location' => '', 'type' => 'face-to-face']
    ];

    // 火〜金の時間割（空き）も空で初期挿入しておく
    for ($day = 2; $day <= 5; $day++) {
        foreach ($userIds as $name => $uid) {
            for ($period = 1; $period <= 5; $period++) {
                $timetables[] = [
                    'user_id' => $uid,
                    'day_of_week' => $day,
                    'period' => $period,
                    'subject' => '',
                    'is_free' => true,
                    'location' => '',
                    'type' => 'face-to-face'
                ];
            }
        }
    }

    $stmt = $pdo->prepare('INSERT INTO timetables (user_id, day_of_week, period, subject, is_free, location, type) VALUES (:user_id, :day_of_week, :period, :subject, :is_free, :location, :type)');
    foreach ($timetables as $t) {
        $stmt->execute([
            ':user_id' => $t['user_id'],
            ':day_of_week' => $t['day_of_week'],
            ':period' => $t['period'],
            ':subject' => $t['subject'],
            ':is_free' => $t['is_free'] ? 1 : 0,
            ':location' => $t['location'],
            ':type' => $t['type']
        ]);
    }
    echo "【成功】時間割デモデータを挿入しました。\n<br>";

    // ステータス挿入 (takuya, yui, kenta の「今」のヒマ度)
    $now = date('Y-m-d H:i:s');
    $expireTakuya = date('Y-m-d H:i:s', strtotime('+2 hours'));
    $expireYui    = date('Y-m-d H:i:s', strtotime('+1 hours'));
    $expireKenta  = date('Y-m-d H:i:s', strtotime('+3 hours'));

    $statuses = [
        ['user_id' => $userIds['takuya'], 'level' => 'free', 'comment' => '学食でだべってる、誰か来て〜', 'expires_at' => $expireTakuya],
        ['user_id' => $userIds['yui'], 'level' => 'chat', 'comment' => '図書館2階で課題中', 'expires_at' => $expireYui],
        ['user_id' => $userIds['kenta'], 'level' => 'busy', 'comment' => 'テスト勉強中なのでそっとしておいて', 'expires_at' => $expireKenta]
    ];

    $stmt = $pdo->prepare('INSERT INTO statuses (user_id, level, comment, expires_at) VALUES (:user_id, :level, :comment, :expires_at)');
    foreach ($statuses as $s) {
        $stmt->execute([
            ':user_id' => $s['user_id'],
            ':level' => $s['level'],
            ':comment' => $s['comment'],
            ':expires_at' => $s['expires_at']
        ]);
    }
    echo "【成功】ヒマ度デモデータを挿入しました。\n<br>";

    echo "【完了】すべてのセットアップが完了しました。";

} catch (Exception $e) {
    http_response_code(500);
    echo "【エラー】接続または実行に失敗しました: " . htmlspecialchars($e->getMessage());
}
