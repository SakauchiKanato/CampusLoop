import React, { useState } from 'react';
import { API_ENDPOINTS, apiPost } from '../lib/api';

interface LoginProps {
  onLogin: (user: { id: number; username: string; campus: string }) => void;
}

type Mode = 'login' | 'register';

interface ApiUserResponse {
  success: boolean;
  message?: string;
  user?: { id: number; username: string; campus: string };
}

// 共通のinputスタイル
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  fontSize: '15px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode]         = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [campus, setCampus]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPw('');
    setCampus('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: Mode) => {
    resetForm();
    setMode(newMode);
  };

  // ==============================
  // ログイン処理
  // ==============================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('ユーザー名とパスワードを入力してください。');
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<ApiUserResponse>(API_ENDPOINTS.login, {
        username: username.trim(),
        password,
      });

      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.message || 'ログインに失敗しました。');
      }
    } catch {
      setError('サーバーに接続できませんでした。PHPサーバーが起動しているか確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // 新規登録処理
  // ==============================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('ユーザー名とパスワードは必須です。');
      return;
    }
    if (username.trim().length < 3) {
      setError('ユーザー名は3文字以上で入力してください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    if (password !== confirmPw) {
      setError('パスワードが一致しません。');
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<ApiUserResponse>(API_ENDPOINTS.register, {
        username: username.trim(),
        password,
        campus: campus.trim() || '有明キャンパス',
      });

      if (data.success && data.user) {
        // 登録成功したらそのままログイン
        onLogin(data.user);
      } else {
        setError(data.message || '登録に失敗しました。');
      }
    } catch {
      setError('サーバーに接続できませんでした。PHPサーバーが起動しているか確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#F0F4FF',
      fontFamily: 'sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '40px 30px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.12)',
      }}>
        {/* ロゴ・キャッチコピー */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ color: '#3B82F6', margin: '0 0 6px 0', fontSize: '30px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            CampusLoop
          </h1>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
            空きコマを、いちばん楽しい時間に。
          </p>
        </div>

        {/* ログイン / 新規登録 タブ切り替え */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: mode === m ? '#3B82F6' : 'transparent',
                color: mode === m ? '#FFFFFF' : '#64748B',
                boxShadow: mode === m ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
              }}
            >
              {m === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '16px',
            border: '1px solid #FECACA',
            lineHeight: '1.5',
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: '#F0FDF4',
            color: '#16A34A',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '16px',
            border: '1px solid #BBF7D0',
          }}>
            ✅ {success}
          </div>
        )}

        {/* ==============================
            ログインフォーム
            ============================== */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例: campus_taro"
                autoComplete="username"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#93C5FD' : '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        )}

        {/* ==============================
            新規登録フォーム
            ============================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>
                ユーザー名 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="3文字以上で入力（例: campus_taro）"
                autoComplete="username"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>
                パスワード <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上で入力"
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>
                パスワード（確認） <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="もう一度パスワードを入力"
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>
                キャンパス名 <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(省略可)</span>
              </label>
              <input
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="例: 有明キャンパス"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#86EFAC' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? '登録中...' : 'アカウントを作成する'}
            </button>
          </form>
        )}

        {/* 注記 */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#CBD5E1', marginTop: '20px', marginBottom: 0 }}>
          同じ大学のキャンパスに通う学生のためのアプリです
        </p>
      </div>
    </div>
  );
};
