import React, { useState, useRef } from 'react';


interface StoryPostProps {
  onClose: () => void;
  onPost: (data: any) => void;
}

export function StoryPost({ onClose, onPost }: StoryPostProps) {
  // 状態管理
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [status, setStatus] = useState<'free' | 'chat' | 'busy'>('chat');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 場所タグの定義
  const locations = ['学食', '図書館', '3号館ラウンジ', '芝生広場'];

  // 画像選択時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !caption) {
      alert("写真またはコメントを入力してください");
      return;
    }
    // 投稿データを作成
    onPost({
      image: imagePreview,
      caption,
      location: selectedLocation,
      status,
      timestamp: new Date()
    });
    alert("投稿しました！");
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#FFFFFF',
      zIndex: 20000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. ヘッダー: キャンセルと投稿ボタン */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #F1F5F9'
      }}>
        <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#64748B', fontSize: '16px', cursor: 'pointer' }}>
          キャンセル
        </button>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>今ココ！を投稿</h3>
        <button 
          onClick={handleSubmit}
          style={{
            backgroundColor: '#4A90E2',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          投稿する
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        
        {/* 2. 画像アップロードエリア */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            aspectRatio: '3/4',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '2px dashed #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            marginBottom: '20px',
            position: 'relative'
          }}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#94A3B8' }}>
              <span style={{ fontSize: '40px' }}>📸</span>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>タップして撮影 または ライブラリから選択</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>

        {/* 3. キャプション入力 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#475569' }}>一言コメント</label>
          <textarea 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="例: 3限空いたから、学食の奥の席でパソコンいじってる〜"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              fontSize: '15px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              resize: 'none'
            }}
            rows={3}
          />
        </div>

        {/* 4. 場所の選択 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#475569' }}>今どこにいる？</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedLocation === loc ? 'none' : '1px solid #E2E8F0',
                  backgroundColor: selectedLocation === loc ? '#4A90E2' : '#FFFFFF',
                  color: selectedLocation === loc ? '#FFFFFF' : '#64748B',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* 5. ステータス（話しかけやすさ） */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>現在のステータス</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* ステータス：暇 */}
            <div 
              onClick={() => setStatus('free')}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                border: status === 'free' ? '2px solid #10B981' : '1px solid #E2E8F0',
                backgroundColor: status === 'free' ? '#F0FDF4' : '#FFFFFF'
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '12px' }}>🟢</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>誰でもおいで！ (暇)</div>
              </div>
              <input type="radio" checked={status === 'free'} readOnly />
            </div>

            {/* ステータス：ゆる募 */}
            <div 
              onClick={() => setStatus('chat')}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                border: status === 'chat' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                backgroundColor: status === 'chat' ? '#FFFBEB' : '#FFFFFF'
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '12px' }}>🟡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>作業中だけど喋れる (ゆる募)</div>
              </div>
              <input type="radio" checked={status === 'chat'} readOnly />
            </div>

            {/* ステータス：ガチ勉強中 */}
            <div 
              onClick={() => setStatus('busy')}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                border: status === 'busy' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                backgroundColor: status === 'busy' ? '#FEF2F2' : '#FFFFFF'
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '12px' }}>🔴</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>ガチ勉強中 (横にいるだけでOK)</div>
              </div>
              <input type="radio" checked={status === 'busy'} readOnly />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}