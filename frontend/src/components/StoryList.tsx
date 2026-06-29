import React, { useState } from 'react';

// 1. ストーリーのデータ構造を定義
interface StoryItem {
  id: string;
  mediaUrl: string; // 画像や動画のURL
  type: 'image' | 'video';
}

interface UserStory {
  userId: string;
  username: string;
  avatarUrl: string;
  hasUnread: boolean; // 未読があるか（ピンクのグラデーション枠用）
  stories: StoryItem[];
}

// サンプルデータ
const SAMPLE_STORIES: UserStory[] = [
  {
    userId: '1',
    username: 'My Story',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    hasUnread: false,
    stories: [{ id: 's1', mediaUrl: 'https://picsum.photos/400/700', type: 'image' }]
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
  // 現在アクティブ（全画面表示中）のユーザーのインデックス
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);

  return (
    <div style={{ padding: '16px 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid #EFEFEF' }}>
      
      {/* 2. インスタ風の横スクロールコンテナ */}
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '0 16px',
        scrollbarWidth: 'none', // Firefox用スクロールバー非表示
      }}>
        {/* Webkit系（Chrome/Safari）用スクロールバー非表示 */}
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {SAMPLE_STORIES.map((user, index) => (
          <div 
            key={user.userId} 
            onClick={() => setActiveUserIndex(index)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0 }}
          >
            {/* 3. アイコンのグラデーション枠（未読ならインスタ色、既読ならグレー） */}
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: user.hasUnread 
                ? 'linear-gradient(45deg, #fbc116, #fa1e4e, #b937b2)' // インスタ風グラデーション
                : '#EAEAEA',
              padding: '2px' // 枠線の太さ
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

            {/* ユーザーネーム */}
            <span style={{ fontSize: '11px', color: '#262626', maxWidth: '68px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
            </span>
          </div>
        ))}
      </div>

      {/* 4. ここに後ほど全画面表示用の「ストーリー閲覧モーダル」を組み込む */}
      {activeUserIndex !== null && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', backgroundColor:'#1a1a1a', zIndex: 10000, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setActiveUserIndex(null)}>
          <p>{SAMPLE_STORIES[activeUserIndex].username}のストーリー（タップで閉じる）</p>
        </div>
      )}

    </div>
  );
}