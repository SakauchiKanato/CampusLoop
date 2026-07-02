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

interface ProfileProps {
  username: string;
  myStories: StoryItem[];
}

export const Profile: React.FC<ProfileProps> = ({ username, myStories }) => {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px 20px 100px 20px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        padding: '20px 0',
        borderBottom: '1px solid #E2E8F0',
        marginBottom: '24px'
      }}>
        <div style={{ position: 'relative' }}>
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            alt="My Profile"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #E2E8F0'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1E293B' }}>{username}</h2>
          <span style={{ fontSize: '13px', color: '#64748B' }}>🏫 有明キャンパス</span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>学籍番号: CL-202607</span>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '15px', color: '#475569', marginBottom: '16px', fontWeight: 'bold' }}>
          これまでの「今ココ！」投稿 ({myStories.length})
        </h3>

        {myStories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            border: '2px dashed #E2E8F0',
            borderRadius: '16px',
            color: '#94A3B8',
            fontSize: '14px'
          }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📸</span>
            まだストーリーを投稿していません。<br />ホームの「My Story」から投稿してみましょう！
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {myStories.map((story) => (
              <div
                key={story.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (story.caption) alert(`📍 ${story.location || '場所タグなし'}\n💬 「${story.caption}」`);
                }}
              >
                <img
                  src={story.mediaUrl}
                  alt={story.caption || 'My story'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {story.location && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    maxWidth: '80%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    📍 {story.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
