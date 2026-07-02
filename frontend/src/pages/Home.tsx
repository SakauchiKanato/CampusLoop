import React from 'react';
import { Timetable } from '../components/Timetable';
import { StoryList } from '../components/StoryList';
import { EventList } from '../components/EventList';

interface HomeProps {
  userStories: any[];
  onPostStory: (postData: any) => void;
}

export const Home: React.FC<HomeProps> = ({ userStories, onPostStory }) => {
  return (
    <div style={{ padding: '20px 20px 100px 20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#3182ce', margin: '0 0 10px 0' }}>CampusLoop</h1>
      
      <div style={{ marginTop: '10px' }}>
        <StoryList userStories={userStories} onPostStory={onPostStory} />
        <Timetable />
        <EventList currentEmptyPeriod={3} />
      </div>
    </div>
  );
};
