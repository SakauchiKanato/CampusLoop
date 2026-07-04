-- CampusLoop データベース定義 (PostgreSQL)
-- 実行方法: psql -U <ユーザー名> -d <DB名> -f schema.sql
--
-- ※ 再実行しても安全なように DROP TABLE IF EXISTS を追加しています。
--   外部キー制約があるため、依存関係の逆順で削除します。

-- ============================================================
-- 既存テーブルの削除（再実行時用）
-- ============================================================
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS stories    CASCADE;
DROP TABLE IF EXISTS events     CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

-- ============================================================
-- 1. users テーブル（ユーザー情報）
-- ============================================================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    campus        VARCHAR(100) DEFAULT '有明キャンパス',
    avatar_url    TEXT         DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. stories テーブル（「今ここ！」ストーリー投稿）
-- 24時間で自動的に期限切れとなる設計
-- ============================================================
CREATE TABLE stories (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path  TEXT          DEFAULT NULL,
    caption     TEXT          DEFAULT NULL,
    location    VARCHAR(100)  DEFAULT NULL,
    status      VARCHAR(20)   DEFAULT 'chat'
                    CHECK (status IN ('free', 'chat', 'busy')),
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    expires_at  TIMESTAMP     DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- ============================================================
-- 3. timetables テーブル（個人の時間割）
-- ============================================================
CREATE TABLE timetables (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week SMALLINT     NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
    period      SMALLINT     NOT NULL CHECK (period BETWEEN 1 AND 5),
    title       VARCHAR(200) NOT NULL,
    location    VARCHAR(100) DEFAULT NULL,
    type        VARCHAR(20)  DEFAULT 'face-to-face'
                    CHECK (type IN ('face-to-face', 'online')),
    UNIQUE (user_id, day_of_week, period)
);

-- ============================================================
-- 4. events テーブル（学内イベント・サークル行事）
-- ============================================================
CREATE TABLE events (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    organizer     VARCHAR(100) NOT NULL,
    location      VARCHAR(100) NOT NULL,
    time_slot     VARCHAR(50)  NOT NULL,
    target_period SMALLINT     NOT NULL CHECK (target_period BETWEEN 1 AND 5),
    category      VARCHAR(20)  DEFAULT 'other'
                    CHECK (category IN ('music', 'study', 'circle', 'other')),
    description   TEXT         DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- サンプルデータ（開発確認用）
-- ============================================================
INSERT INTO events (title, organizer, location, time_slot, target_period, category, description) VALUES
    ('芝生広場アコギ新歓ライブ！', 'アコギサークル', '芝生広場', '13:10~14:00', 3, 'music', '「3限空きコマの人、芝生に集まれー！」新入生じゃなくても大歓迎！'),
    ('経済学Ⅰ テスト対策勉強会', '有志勉強会', '3号館ラウンジ', '13:15~14:45', 3, 'study', '過去問持ち寄ってガチ勉します。横にいるだけでもOK！'),
    ('服飾サークル 歓談・作業会', '服飾サークル', '部室棟2F', '15:10~16:30', 4, 'circle', '4限暇な人おしゃべりしませんか？ミシン使いたい人もどうぞ！');
