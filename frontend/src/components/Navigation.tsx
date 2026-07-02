import React from 'react';

interface NavigationProps {
  activeTab: 'home' | 'calendar' | 'profile';
  onChangeTab: (tab: 'home' | 'calendar' | 'profile') => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onChangeTab, onLogout }) => {
  const tabs = [
    { id: 'home', label: 'ホーム', icon: '🏠' },
    { id: 'calendar', label: 'カレンダー', icon: '📅' },
    { id: 'profile', label: 'マイページ', icon: '👤' },
  ] as const;

  const handleLogoutClick = () => {
    if (window.confirm('ログアウトしますか？')) {
      onLogout();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 20px 0',
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
      zIndex: 10000,
      fontFamily: 'sans-serif'
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: isActive ? '#3B82F6' : '#94A3B8',
              transition: 'color 0.2s',
              flex: 1
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: isActive ? 'bold' : 'normal' }}>{tab.label}</span>
          </button>
        );
      })}
      
      <button
        onClick={handleLogoutClick}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          color: '#94A3B8',
          flex: 1
        }}
      >
        <span style={{ fontSize: '20px' }}>🚪</span>
        <span style={{ fontSize: '11px' }}>ログアウト</span>
      </button>
    </div>
  );
};
