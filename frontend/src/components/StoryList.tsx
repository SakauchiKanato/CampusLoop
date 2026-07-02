import React, { useState } from 'react';
import { StoryPost } from './StoryUploadModal';
import { StoryViewModal } from './StoryViewModal';

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
  hasUnread: boolean;
  stories: StoryItem[];
}

interface StoryListProps {
  userStories: UserStory[];
  onPostStory: (postData: any) => void;
}

export function StoryList({ userStories, onPostStory }: StoryListProps) {
  const [selectedUserStory, setSelectedUserStory] = useState<UserStory | null>(null);
  const [isPostOpen, setIsPostOpen] = useState(false);

  const handleUserClick = (user: UserStory) => {
    if (user.userId === '1') {
      if (user.stories.length > 0) {
        setSelectedUserStory(user);
      } else {
        setIsPostOpen(true);
      }
    } else {
      if (user.stories.length > 0) {
        setSelectedUserStory(user);
      }
    }
  };

  return (
    <div style={{ padding: '16px 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid #EFEFEF' }}>
      
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '0 16px',
        scrollbarWidth: 'none',
      }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {userStories.map((user) => {
          const isMe = user.userId === '1';
          const hasStories = user.stories.length > 0;
          const hasBorder = isMe ? hasStories : user.hasUnread;

          return (
            <div 
              key={user.userId} 
              onClick={() => handleUserClick(user)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0, position: 'relative' }}
            >
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: hasBorder 
                  ? 'linear-gradient(45deg, #fbc116, #fa1e4e, #b937b2)'
                  : '#EAEAEA',
                padding: '2px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username} 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
              </div>

              {isMe && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPostOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '20px', 
                    right: '2px',
                    backgroundColor: '#4A90E2',
                    color: '#FFFFFF',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: '2px solid #FFFFFF', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    zIndex: 10
                  }}
                >
                  +
                </div>
              )}

              <span style={{ fontSize: '11px', color: '#262626', maxWidth: '68px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </span>
            </div>
          );
        })}
      </div>

      {selectedUserStory !== null && (
        <StoryViewModal 
          userStory={selectedUserStory} 
          onClose={() => setSelectedUserStory(null)} 
        />
      )}

      {isPostOpen && (
        <StoryPost 
          onClose={() => setIsPostOpen(false)} 
          onPost={onPostStory}
        />
      )}

    </div>
  );
}