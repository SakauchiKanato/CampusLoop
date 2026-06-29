import React from 'react';
import { Timetable } from '../components/Timetable';
import { StoryList } from '../components/StoryList';
import { EventList } from '../components/EventList';

export const Home: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#3182ce' }}>CampusLoop (開発中)</h1>
      <p>この表示が見えている場合、Reactの開発サーバーは正常に動作しています。</p>
      
      <div style={{ marginTop: '20px' }}>
        <Timetable />
        <StoryList />
        <EventList />
      </div>
    </div>
  );
};
