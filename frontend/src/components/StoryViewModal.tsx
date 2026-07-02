import React from 'react';

interface StoryItem {
  id: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption?: string;
  location?: string;
  status?: 'free' | 'chat' | 'busy';
  timestamp?: Date | string;
}

interface UserStory {
  userId: string;
  username: string;
  avatarUrl: string;
  stories: StoryItem[];
}

interface StoryViewModalProps {
  userStory: UserStory;
  onClose: () => void;
}

export const StoryViewModal: React.FC<StoryViewModalProps> = ({ userStory, onClose }) => {
  const activeStory = userStory.stories[userStory.stories.length - 1];

  if (!activeStory) return null;

  const getStatusInfo = (status?: 'free' | 'chat' | 'busy') => {
    switch (status) {
      case 'free': return { emoji: '🟢', text: '誰でもおいで！(暇)' };
      case 'busy': return { emoji: '🔴', text: 'ガチ勉強中' };
      case 'chat':
      default: return { emoji: '🟡', text: '作業中だけど喋れる(ゆる募)' };
    }
  };

  const statusInfo = getStatusInfo(activeStory.status);

  const getFormattedTime = (date?: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30000,
        fontFamily: 'sans-serif',
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          maxHeight: '750px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000000',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <img 
          src={activeStory.mediaUrl} 
          alt="Story content" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '140px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '240px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }} />

        <div style={{ position: 'relative', zIndex: 3, padding: '16px 16px 0 16px' }}>
          <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#FFFFFF' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={userStory.avatarUrl} 
                alt={userStory.username} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #FFFFFF', objectFit: 'cover' }}
              />
              <div>
                <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px' }}>{userStory.username}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{getFormattedTime(activeStory.timestamp)} 投稿</div>
              </div>
            </div>

            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '100%', 
          zIndex: 3, 
          padding: '24px', 
          boxSizing: 'border-box',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeStory.location && (
              <span style={{
                backgroundColor: 'rgba(59, 130, 246, 0.9)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                📍 {activeStory.location}
              </span>
            )}
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              {statusInfo.emoji} {statusInfo.text}
            </span>
          </div>

          {activeStory.caption && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '15px',
              lineHeight: '1.5',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              fontWeight: '500'
            }}>
              {activeStory.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
