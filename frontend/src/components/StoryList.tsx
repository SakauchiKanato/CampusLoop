import React, { useState } from 'react';
import { StoryPost } from './StoryUploadModal';

interface StoryItem {
  id: string;
  mediaUrl: string;
  type: 'image' | 'video';
}

interface UserStory {
  userId: string;
  username: string;
  avatarUrl: string;
  hasUnread: boolean;
  stories: StoryItem[];
}

const SAMPLE_STORIES: UserStory[] = [
  {
    userId: '1', // userId: '1' を自分（My Story）と定義します
    username: 'My Story',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    hasUnread: false,
    stories: [] // 初期状態はストーリー未投稿（空）とします
  },
  {
    userId: '2',
    username: 'tanaka_kun',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    hasUnread: true,
    stories: [{ id: 's2', mediaUrl: 'https://picsum.photos/400/701', type: 'image' }]
  },
  {
    userId: '3',
    username: 'yamada_lab',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    hasUnread: true,
    stories: [{ id: 's3', mediaUrl: 'https://picsum.photos/400/702', type: 'image' }]
  },
];

export function StoryList() {
  // 全画面ストーリー閲覧用の状態
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  
  // 【新設】ストーリー投稿画面（StoryPost）の開閉フラグ
  const [isPostOpen, setIsPostOpen] = useState(false);

  // リスト内のアイコンがクリックされた時の処理
  const handleUserClick = (index: number, userId: string) => {
    if (userId === '1') {
      // 自分のアイコン（My Story）がタップされたら投稿画面を開く
      setIsPostOpen(true);
    } else {
      // 他人のアイコンならストーリー閲覧画面を開く
      setActiveUserIndex(index);
    }
  };

  // 実際に投稿されたデータを受け取る処理（後のバックエンド連携用）
  const handleNewPost = (postData: any) => {
    console.log("新しいストーリー投稿データ:", postData);
    // ここで状態を更新したり、PHPのAPIを叩いてDBに保存します
  };

  return (
    <div style={{ padding: '16px 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid #EFEFEF' }}>
      
      {/* インスタ風横スクロールコンテナ */}
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '0 16px',
        scrollbarWidth: 'none',
      }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {SAMPLE_STORIES.map((user, index) => {
          const isMe = user.userId === '1'; // 自分かどうかを判定

          return (
            <div 
              key={user.userId} 
              onClick={() => handleUserClick(index, user.userId)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0, position: 'relative' }}
            >
              {/* アイコンのグラデーション枠 */}
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: user.hasUnread 
                  ? 'linear-gradient(45deg, #fbc116, #fa1e4e, #b937b2)'
                  : '#EAEAEA',
                padding: '2px'
              }}>
                {/* 白い隙間枠 */}
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

              {/* 【新設】自分のアイコンの右下に青い「＋」ボタンを配置 */}
              {isMe && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px', // 文字列との被りを防ぐ配置調整
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
                  border: '2px solid #FFFFFF', // インスタ同様、白いフチを付ける
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                }}>
                  +
                </div>
              )}

              {/* ユーザーネーム */}
              <span style={{ fontSize: '11px', color: '#262626', maxWidth: '68px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* A. ストーリー閲覧モーダル */}
      {activeUserIndex !== null && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', backgroundColor:'#1a1a1a', zIndex: 10000, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setActiveUserIndex(null)}>
          <p>{SAMPLE_STORIES[activeUserIndex].username}のストーリー（タップで閉じる）</p>
        </div>
      )}

      {/* B. 【新設】ストーリー投稿モーダル（isPostOpenがtrueのときに起動） */}
      {isPostOpen && (
        <StoryPost 
          onClose={() => setIsPostOpen(false)} 
          onPost={handleNewPost}
        />
      )}

    </div>
  );
}