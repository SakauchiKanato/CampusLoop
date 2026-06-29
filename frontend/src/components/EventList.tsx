import React from 'react';

// 1. イベントデータの型定義
interface CampusEvent {
  id: string;
  title: string;          // イベント名
  timeSlot: string;       // 開催時間（例: "13:10~14:00"）
  location: string;       // 開催場所（例: "芝生広場"）
  description: string;    // キャプション・一言コメント
  targetPeriod: number;   // 対象となる空きコマ（何限目か）
  organizer: string;      // 主催者（サークル名やゼミ名など）
  category: 'music' | 'study' | 'circle' | 'other'; // 色分け・アイコン用
}

interface EventListProps {
  // 現在ユーザーが選択している、または現在の空きコマ（例: 3限なら 3）
  currentEmptyPeriod: number;
}

// 仕様書に基づいたサンプルデータ（サークル行事、勉強会など）
const SAMPLE_EVENTS: CampusEvent[] = [
  {
    id: 'e1',
    title: '芝生広場アコギ新歓ライブ！',
    timeSlot: '13:10~14:00',
    location: '芝生広場',
    description: '「3限空きコマの人、芝生に集まれー！」新入生じゃなくても大歓迎です！',
    targetPeriod: 3,
    organizer: 'アコギサークル',
    category: 'music'
  },
  {
    id: 'e2',
    title: '経済学Ⅰ テスト対策勉強会',
    timeSlot: '13:15~14:45',
    location: '3号館ラウンジ',
    description: '過去問持ち寄ってガチ勉します。横にいるだけでもOK！',
    targetPeriod: 3,
    organizer: '有志勉強会',
    category: 'study'
  },
  {
    id: 'e3',
    title: '服飾サークル 歓談・作業会',
    timeSlot: '15:10~16:30',
    location: '部室棟2F',
    description: '4限暇な人おしゃべりしませんか〜？ミシン使いたい人もどうぞ！',
    targetPeriod: 4,
    organizer: '服飾サークル',
    category: 'circle'
  }
];

export function EventList({ currentEmptyPeriod }: EventListProps) {
  // 2. 自分の空きコマにマッチするイベントを自動フィルタリング
  const matchedEvents = SAMPLE_EVENTS.filter(
    (event) => event.targetPeriod === currentEmptyPeriod
  );

  // カテゴリに応じたアクセントカラーを返すヘルパー関数
  const getCategoryColor = (category: CampusEvent['category']) => {
    switch (category) {
      case 'music': return '#EF4444'; // 赤・ピンク系
      case 'study': return '#10B981'; // 緑系
      case 'circle': return '#4A90E2'; // 青系
      default: return '#64748B';
    }
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#FFFFFF', fontFamily: 'sans-serif' }}>
      
      {/* タイトルヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>🔔</span>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>
          あなたの空きコマ ({currentEmptyPeriod}限) にマッチする学内イベント
        </h3>
      </div>

      {/* 3. イベントがない場合の表示 */}
      {matchedEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: '12px', fontSize: '14px' }}>
          現在、{currentEmptyPeriod}限に開催されるイベントはありません。
        </div>
      ) : (
        // 4. イベントがある場合のカードリスト表示
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {matchedEvents.map((event) => {
            const badgeColor = getCategoryColor(event.category);
            
            return (
              <div
                key={event.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* 上段：主催者と時間・場所のバッジ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: badgeColor, backgroundColor: `${badgeColor}10`, padding: '2px 8px', borderRadius: '6px' }}>
                    {event.organizer}
                  </span>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                    📍 {event.location} ［{event.timeSlot}］
                  </div>
                </div>

                {/* 中段：メインタイトル */}
                <h4 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>
                  {event.title}
                </h4>

                {/* 下段：キャプション（一言コメント） */}
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                  「{event.description}」
                </p>

                {/* 参加・興味ありアクションボタン */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={() => alert(`${event.title} に参加登録しました！`)}
                    style={{
                      backgroundColor: '#4A90E2',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(74, 144, 226, 0.2)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#357ABD')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4A90E2')}
                  >
                    参加する 👍
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}