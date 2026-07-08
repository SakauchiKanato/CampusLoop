/**
 * バックエンドAPI の接続先URL管理
 */
const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export const API_BASE = isProd
  ? '/~knt416/CampusLoop/backend/api' // 大学サーバー上のパス
  : 'http://localhost:8080/CampusLoop/backend/api'; // ローカル開発用のPHPサーバー

// ============================
// 各エンドポイントの定義
// ============================
export const API_ENDPOINTS = {
  register:  `${API_BASE}/register.php`,
  login:     `${API_BASE}/login.php`,
  timetable: `${API_BASE}/timetable.php`,
  status:    `${API_BASE}/status.php`,
  matches:   `${API_BASE}/matches.php`,
  chat:      `${API_BASE}/chat.php`,
  friends:   `${API_BASE}/friends.php`,
  profile:   `${API_BASE}/profile.php`,
} as const;

// ============================
// 共通フェッチヘルパー
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

export async function apiPut<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: T = await res.json();
  return data;
}
