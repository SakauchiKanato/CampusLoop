import { useState } from 'react';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Timetable as CalendarPage } from './components/Timetable';
import { Profile } from './pages/Profile';
import { Navigation } from './components/Navigation';

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

const INITIAL_STORIES: UserStory[] = [
  {
    userId: '1',
    username: 'My Story',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    hasUnread: false,
    stories: []
  },
  {
    userId: '2',
    username: 'tanaka_kun',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    hasUnread: true,
    stories: [{ id: 's2', mediaUrl: 'https://picsum.photos/400/701', type: 'image', caption: '図書館の静かな席で勉強中', location: '図書館', status: 'busy', timestamp: new Date() }]
  },
  {
    userId: '3',
    username: 'yamada_lab',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    hasUnread: true,
    stories: [{ id: 's3', mediaUrl: 'https://picsum.photos/400/702', type: 'image', caption: '芝生広場でアコギ新歓ライブやるよ！', location: '芝生広場', status: 'free', timestamp: new Date() }]
  },
];

interface LoggedInUser {
  id: number;
  username: string;
  campus: string;
}

function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'profile'>('home');
  const [userStories, setUserStories] = useState<UserStory[]>(INITIAL_STORIES);

  const handleLogin = (loggedInUser: LoggedInUser) => {
    setUser(loggedInUser);
    // My Story のアバターをログインユーザー名に更新
    setUserStories(prev => prev.map(s =>
      s.userId === '1' ? { ...s, username: loggedInUser.username } : s
    ));
    setActiveTab('home');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handlePostStory = (postData: any) => {
    const newStoryItem: StoryItem = {
      id: String(Date.now()),
      mediaUrl: postData.image || 'https://picsum.photos/400/700',
      type: 'image',
      caption: postData.caption,
      location: postData.location,
      status: postData.status,
      timestamp: postData.timestamp
    };

    setUserStories(prevStories => 
      prevStories.map(story => {
        if (story.userId === '1') {
          return {
            ...story,
            stories: [...story.stories, newStoryItem]
          };
        }
        return story;
      })
    );
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const myStories = userStories.find(s => s.userId === '1')?.stories || [];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', position: 'relative' }}>
      
      {activeTab === 'home' && (
        <Home userStories={userStories} onPostStory={handlePostStory} />
      )}
      
      {activeTab === 'calendar' && (
        <div style={{ padding: '20px 20px 100px 20px' }}>
          <h1 style={{ color: '#3182ce', textAlign: 'center', fontFamily: 'sans-serif', margin: '0 0 20px 0', fontSize: '24px' }}>時間割カレンダー</h1>
          <CalendarPage />
        </div>
      )}
      
      {activeTab === 'profile' && (
        <Profile username={user?.username ?? ''} myStories={myStories} />
      )}

      <Navigation 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        onLogout={handleLogout} 
      />
    </div>
  );
}

export default App;
