import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

interface Lesson {
  id: string;
  title: string;
  location: string;
  type: 'face-to-face' | 'online';
  dayOfWeek: number;
  period: number;
}

export function Timetable() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  // ポップアップの開閉と選択コマの管理
  const [selectedSlot, setSelectedSlot] = useState<{ dayOfWeek: number; period: number; lessonId?: string } | null>(null);

  // フォームの状態
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<Lesson['type']>('face-to-face');

  const periodMap: Record<number, { start: string; end: string; label: string }> = {
    1: { start: '09:00:00', end: '10:00:00', label: '1限\n08:50\n|\n10:30' },
    2: { start: '10:00:00', end: '11:00:00', label: '2限\n10:40\n|\n12:20' },
    3: { start: '11:00:00', end: '12:00:00', label: '3限\n13:10\n|\n14:50' },
    4: { start: '12:00:00', end: '13:00:00', label: '4限\n15:00\n|\n16:40' },
    5: { start: '13:00:00', end: '14:00:00', label: '5限\n16:50\n|\n18:30' },
  };

  const backgroundEvents = [];
  for (let day = 1; day <= 5; day++) {
    for (let p = 1; p <= 5; p++) {
      backgroundEvents.push({
        display: 'background',
        daysOfWeek: [day],
        startTime: periodMap[p].start,
        endTime: periodMap[p].end,
        classNames: ['empty-slot-bg']
      });
    }
  }

  const events = [
    ...backgroundEvents,
    ...lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      daysOfWeek: [lesson.dayOfWeek],
      startTime: periodMap[lesson.period].start,
      endTime: periodMap[lesson.period].end,
      extendedProps: {
        location: lesson.location,
        type: lesson.type,
        period: lesson.period
      }
    }))
  ];

  const handleDateClick = (info: any) => {
    const date = info.date;
    const dayOfWeek = date.getDay();
    const hours = date.getHours();

    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const period = hours - 9 + 1; 
    if (period < 1 || period > 5) return;

    const existing = lessons.find(l => l.dayOfWeek === dayOfWeek && l.period === period);
    
    setSelectedSlot({ dayOfWeek, period, lessonId: existing?.id });
    if (existing) {
      setFormName(existing.title);
      setFormLocation(existing.location);
      setFormType(existing.type);
    } else {
      setFormName('');
      setFormLocation('');
      setFormType('face-to-face');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!formName.trim()) {
      handleDelete();
      return;
    }

    if (selectedSlot.lessonId) {
      setLessons(lessons.map(l => l.id === selectedSlot.lessonId 
        ? { ...l, title: formName, location: formLocation, type: formType } 
        : l
      ));
    } else {
      const newLesson: Lesson = {
        id: String(Date.now()),
        title: formName,
        location: formLocation,
        type: formType,
        dayOfWeek: selectedSlot.dayOfWeek,
        period: selectedSlot.period
      };
      setLessons([...lessons, newLesson]);
    }
    setSelectedSlot(null);
  };

  const handleDelete = () => {
    if (!selectedSlot?.lessonId) return;
    setLessons(lessons.filter(l => l.id !== selectedSlot.lessonId));
    setSelectedSlot(null);
  };

  const getTypeColors = (type: Lesson['type']) => {
    switch (type) {
      case 'online': return { bg: '#FFF0F5', text: '#D11A5B' };
      case 'face-to-face': default: return { bg: '#D0E1FD', text: '#2C3E50' };
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', position: 'relative' }}>
      
      <style>{`
        .fc { background-color: #F8FAFC; border-radius: 16px; padding: 12px; border: none !important; }
        .fc-theme-standard td, .fc-theme-standard th { border: none !important; }
        .fc-col-header-cell-cushion { color: #555 !important; font-size: 16px; font-weight: bold; text-decoration: none !important; }
        .fc-day-mon .fc-col-header-cell-cushion { 
          background-color: #4A90E2; color: #fff !important; border-radius: 50%; 
          width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; 
        }
        .empty-slot-bg {
          background-color: #FFFFFF !important;
          border: 1px solid #EAEAEA !important;
          border-radius: 16px !important;
          opacity: 1 !important;
          margin: 6px !important;
        }
        .fc-timegrid-event-harness { padding: 6px !important; }
        .custom-lesson-card {
          border: none !important;
          border-radius: 16px !important;
          padding: 12px 8px !important;
          box-shadow: none !important;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          box-sizing: border-box;
        }
        .fc-timegrid-slots td { height: 130px !important; }
        .fc-timegrid-slot-label-cushion { white-space: pre-line; text-align: center; font-size: 12px; color: #777; }
      `}</style>

      {/* 1. FullCalendar 本体 */}
      <FullCalendar
        locale={jaLocale}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        weekends={false}
        allDaySlot={false}
        slotMinTime="09:00:00"
        slotMaxTime="14:00:00"
        slotDuration="01:00:00"
        headerToolbar={false}
        dayHeaderFormat={{ weekday: 'short' }}
        height="auto"
        events={events}
        dateClick={handleDateClick}
        eventClick={(info) => {
          const props = info.event.extendedProps;
          setSelectedSlot({
            dayOfWeek: info.event.start!.getDay(),
            period: props.period,
            lessonId: info.event.id
          });
          setFormName(info.event.title);
          setFormLocation(props.location);
          setFormType(props.type);
        }}
        slotLabelContent={(arg) => {
          const periodNum = arg.date.getHours() - 9 + 1;
          const labelText = periodMap[periodNum]?.label || '';
          return (
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#555' }}>{periodNum}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', lineHeight: '1.2' }}>
                {labelText.split('\n').slice(1).join('\n')}
              </div>
            </div>
          );
        }}
        eventContent={(eventInfo) => {
          if (eventInfo.event.display === 'background') return null;
          const type = eventInfo.event.extendedProps.type as Lesson['type'];
          const location = eventInfo.event.extendedProps.location;
          const colors = getTypeColors(type);
          return (
            <div className="custom-lesson-card" style={{ backgroundColor: colors.bg, width: '100%' }}>
              <div style={{ color: colors.text, fontSize: '13px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'pre-line', width: '100%', lineHeight: '1.4' }}>
                {eventInfo.event.title}
              </div>
              <div style={{ backgroundColor: '#FFFFFF', color: '#8A8A8A', fontSize: '11px', fontWeight: '500', padding: '3px 0', borderRadius: '12px', width: '90%', textAlign: 'center', border: '1px solid #EAEAEA' }}>
                {location}
              </div>
            </div>
          );
        }}
      />

      {/* 2. ポップアップ（モーダル）部分 */}
      {selectedSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', // 背面を少し暗くする
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999, // 一番手前に表示
        }}
        onClick={() => setSelectedSlot(null)} // 背景クリックで閉じる
        >
          {/* ポップアップの白いウィンドウ本体 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()} // ウィンドウ内をクリックした時は閉じないようにする
          >
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              {['日','月','火','水','木','金','土'][selectedSlot.dayOfWeek]}曜 {selectedSlot.period}限の授業設定
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>授業名（改行を入れて配置可能）</label>
                <textarea value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="例: 時空間データ&#13;ベース" rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>場所・教室</label>
                <input type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="例: 有明5-501" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>授業スタイル</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as Lesson['type'])} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#fff' }}>
                  <option value="face-to-face">対面講義（青色）</option>
                  <option value="online">オンライン（ピンク色）</option>
                  <option value="lab">研究室・その他（水色）</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#4A90E2', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>保存する</button>
                {selectedSlot.lessonId && (
                  <button type="button" onClick={handleDelete} style={{ backgroundColor: '#EF4444', color: 'white', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>削除</button>
                )}
                <button type="button" onClick={() => setSelectedSlot(null)} style={{ backgroundColor: '#94A3B8', color: 'white', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>戻る</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}