/**
 * バックエンドAPI の接続先URL管理
 *
 * ローカル開発時: PHPサーバーのURLを指定
 * 大学サーバーへのデプロイ後: 本番URLに書き換えてください
 *
 * 例（ローカル開発）:
 *   const API_BASE = 'http://localhost:8080/CampusLoop/backend/api';
 * 例（大学サーバー）:
 *   const API_BASE = 'https://your-university-server.ac.jp/campusloop/backend/api';
 */
// 本番環境（大学サーバー）とローカル開発環境で接続先を自動で切り替えます
const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export const API_BASE = isProd
  ? '/~knt416/CampusLoop/backend/api' // 大学サーバー上のパス
  : 'http://localhost:8080/CampusLoop/backend/api'; // ローカル開発用のPHPサーバー


// ============================
// 各エンドポイントの定義
// ============================
export const API_ENDPOINTS = {
  register:     `${API_BASE}/register.php`,
  login:        `${API_BASE}/login.php`,
  getStories:   `${API_BASE}/get_stories.php`,
  uploadStory:  `${API_BASE}/upload_story.php`,
  getTimetable: `${API_BASE}/get_timetable.php`,
  saveTimetable:`${API_BASE}/save_timetable.php`,
  getEvents:    `${API_BASE}/get_events.php`,
} as const;

// ============================
// 共通フェッチヘルパー (JSON)
// ============================
export async function apiPost<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: T = await res.json();
  return data;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data: T = await res.json();
  return data;
}
