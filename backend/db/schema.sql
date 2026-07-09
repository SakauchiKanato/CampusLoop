-- スキマッチ (SukimaMatch) データベース定義 (PostgreSQL)
--

DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS events      CASCADE;
DROP TABLE IF EXISTS messages    CASCADE;
DROP TABLE IF EXISTS matches     CASCADE;
DROP TABLE IF EXISTS friendships  CASCADE;
DROP TABLE IF EXISTS statuses    CASCADE;
DROP TABLE IF EXISTS timetables  CASCADE;
DROP TABLE IF EXISTS users       CASCADE;

-- 1. users テーブル（ユーザー情報）
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(200) NOT NULL UNIQUE,              -- 大学メールアドレス (@stu.musashino-u.ac.jp)
    password_hash TEXT         NOT NULL,
    campus        VARCHAR(100) DEFAULT '有明キャンパス',
    faculty       VARCHAR(100) DEFAULT NULL, -- 学部名
    circle        VARCHAR(100) DEFAULT NULL, -- サークル名
    avatar_url    TEXT         DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 2. timetables テーブル（個人の時間割・空きコマ）
CREATE TABLE timetables (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week SMALLINT     NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=月〜5=金
    period      SMALLINT     NOT NULL CHECK (period BETWEEN 1 AND 5),      -- 1〜5限
    subject     VARCHAR(200) DEFAULT NULL,                                 -- 科目名
    is_free     BOOLEAN      DEFAULT FALSE,                                -- 空きコマフラグ
    location    VARCHAR(100) DEFAULT NULL,                                 -- 教室など
    type        VARCHAR(20)  DEFAULT 'face-to-face' CHECK (type IN ('face-to-face', 'online')),
    UNIQUE (user_id, day_of_week, period)
);

-- 3. statuses テーブル（「今のヒマ度」ステータス）
CREATE TABLE statuses (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    level       VARCHAR(20)  NOT NULL CHECK (level IN ('free', 'chat', 'busy')), -- 'free'=誰でもおいで, 'chat'=ゆる募, 'busy'=ガチ勉強中
    comment     TEXT         DEFAULT NULL,                                      -- 一言コメント
    expires_at  TIMESTAMP    NOT NULL                                           -- ステータス有効期限
);

-- 4. friendships テーブル（フレンド）
CREATE TABLE friendships (
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,                         -- 簡略化のため即時承認
    PRIMARY KEY (user_id, friend_id)
);

-- 5. matches テーブル（誘い出しの記録）
CREATE TABLE matches (
    id          SERIAL PRIMARY KEY,
    from_user   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period      SMALLINT     NOT NULL CHECK (period BETWEEN 1 AND 5),
    status      VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 6. messages テーブル（チャットメッセージ）
CREATE TABLE messages (
    id          SERIAL PRIMARY KEY,
    match_id    INTEGER      NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 7. events テーブル（学生発信の学内イベント。全ユーザーに公開）
CREATE TABLE events (
    id          SERIAL PRIMARY KEY,
    creator_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(100) NOT NULL,
    description TEXT         DEFAULT NULL,
    event_date  DATE         NOT NULL,                                      -- 開催日
    period      SMALLINT     NOT NULL CHECK (period BETWEEN 1 AND 5),       -- 開催時限
    location    VARCHAR(100) DEFAULT NULL,                                  -- 場所（芝生広場など）
    campus      VARCHAR(100) DEFAULT '有明キャンパス',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 8. event_participants テーブル（イベント参加者）
CREATE TABLE event_participants (
    event_id  INTEGER   NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id   INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);
