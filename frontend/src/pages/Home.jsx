import React from 'react';
import { Timetable } from '../components/Timetable';
import { StoryList } from '../components/StoryList';
import { EventList } from '../components/EventList';

export const Home = () => {
  return (
    <div>
      {/* メイン画面（時間割 × ストーリー × マッチングイベント） */}
      <Timetable />
      <StoryList />
      <EventList />
    </div>
  );
};
