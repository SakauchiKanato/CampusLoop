import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('ユーザー名とパスワードを入力してください。');
      return;
    }
    
    // デモ用のため任意の入力値でログイン可能にする
    onLogin(username);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: 'sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '40px 30px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#3B82F6', margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>CampusLoop</h1>
        <p style={{ color: '#64748B', margin: '0 0 32px 0', fontSize: '14px' }}>空きコマを、いちばん楽しい時間に。</p>
        
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            color: '#EF4444',
            padding: '10px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left',
            border: '1px solid #FEE2E2'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例: campus_taro"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力してください"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '15px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
            }}
          >
            ログイン
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
            ※ デモ画面のため、任意のユーザー名・パスワードでログインできます。
          </p>
        </div>
      </div>
    </div>
  );
};
