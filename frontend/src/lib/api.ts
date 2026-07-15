/**
 * バックエンドAPI の接続先URL管理
 */
const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export const API_BASE = isProd
  ? '/~knt416/CampusLoop/backend/api' // 大学サーバー上のパス
  : 'http://localhost:8080/CampusLoop/backend/api'; // ローカル開発用のPHPサーバー

// backend/ 直下（api/ の1つ上）。avatar_url など静的ファイルの参照に使う。
export const BACKEND_ROOT = API_BASE.replace(/\/api$/, '');

// ============================
// 各エンドポイントの定義
// ============================
export const API_ENDPOINTS = {
  register:  `${API_BASE}/register.php`,
  login:     `${API_BASE}/login.php`,
  logout:    `${API_BASE}/logout.php`,
  me:        `${API_BASE}/me.php`,
  timetable: `${API_BASE}/timetable.php`,
  status:    `${API_BASE}/status.php`,
  matches:   `${API_BASE}/matches.php`,
  chat:      `${API_BASE}/chat.php`,
  friends:   `${API_BASE}/friends.php`,
  profile:   `${API_BASE}/profile.php`,
  events:    `${API_BASE}/events.php`,
  avatar:    `${API_BASE}/avatar.php`,
} as const;

/**
 * users.avatar_url（backend/ からの相対パス。例: "uploads/avatars/u1_123.jpg"）を
 * 実際に <img src> に渡せるURLに変換する。値がなければ undefined を返し、
 * Avatar コンポーネント側のイニシャル表示にフォールバックさせる。
 */
export function resolveAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined;
  return `${BACKEND_ROOT}/${avatarPath}`;
}

// ============================
// 共通フェッチヘルパー
// ============================

// バックエンドに接続できない（サーバー未起動など）ときのエラーメッセージ
const CONNECTION_ERROR_MESSAGE = isProd
  ? 'サーバーに接続できません。時間をおいて再度お試しください。'
  : 'バックエンドに接続できません。PHPサーバーが起動しているか確認してください（LOCAL_DEV.md 参照。例: mirai-pj ディレクトリで php -S localhost:8080）。';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    // ログインセッションのCookieを送受信するために必須
    res = await fetch(url, { credentials: 'include', ...init });
  } catch {
    // ネットワークエラー（接続拒否・オフラインなど）
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }
  try {
    const data: T = await res.json();
    return data;
  } catch {
    throw new Error('サーバーから不正な応答が返されました。');
  }
}

export async function apiPost<T>(url: string, body: object): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiGet<T>(url: string): Promise<T> {
  return request<T>(url);
}

export async function apiPut<T>(url: string, body: object): Promise<T> {
  return request<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(url: string, body: object): Promise<T> {
  return request<T>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// 画像アップロードなど multipart/form-data 用。
// Content-Type はブラウザが boundary 付きで自動設定するため、あえて指定しない。
export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: formData,
  });
}
