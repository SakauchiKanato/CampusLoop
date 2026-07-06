import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, Text } from '@yamada-ui/react';
import { Settings, Home as HomeIcon, Users, User } from 'lucide-react';

import { API_ENDPOINTS, apiGet } from './lib/api';

export interface LoggedInUser {
  id: number;
  username: string;
  campus: string;
  faculty: string;
  circle: string;
}

export interface UserStatus {
  level: 'free' | 'chat' | 'busy';
  comment: string;
  expires_at: string;
  is_active: boolean;
}

import Login from './pages/Login';
import Home from './pages/Home';
import MatchList from './pages/MatchList';
import TimetableEdit from './pages/TimetableEdit';
import StatusSetting from './pages/StatusSetting';
import Chat from './pages/Chat';
import MyPage from './pages/MyPage';

function Layout({ user, userStatus, onLogout }: { user: LoggedInUser, userStatus: UserStatus, onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getStatusColor = (level: UserStatus['level']) => {
    switch (level) {
      case 'free': return 'green.500';
      case 'chat': return 'orange.500';
      case 'busy': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getStatusLabel = (level: UserStatus['level']) => {
    switch (level) {
      case 'free': return '誰でもおいで！';
      case 'chat': return '作業中（ゆる募）';
      case 'busy': return 'ガチ勉強中';
      default: return 'ステータス未設定';
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" pb="90px">
      {/* Header */}
      <Flex
        as="header"
        justify="space-between"
        align="center"
        p="md"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        position="sticky"
        top={0}
        zIndex={100}
        boxShadow="sm"
      >
        <Flex align="center" gap="sm">
          <Text fontSize="2xl">⚡</Text>
          <Text fontSize="xl" fontWeight="bold" color="blue.800" letterSpacing="-0.5px">スキマッチ</Text>
        </Flex>

        <Flex align="center" gap="sm">
          <Flex
            as="button"
            onClick={() => navigate('/status/edit')}
            align="center"
            gap="xs"
            py="xs"
            px="sm"
            borderRadius="full"
            border="1px solid"
            borderColor="gray.200"
            bg="white"
            cursor="pointer"
            fontSize="xs"
            fontWeight="bold"
            color="gray.600"
            transition="all 0.2s"
            boxShadow="sm"
            _hover={{ bg: "gray.100" }}
          >
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={userStatus.is_active ? getStatusColor(userStatus.level) : "gray.400"}
            />
            <Text>{userStatus.is_active ? getStatusLabel(userStatus.level) : 'ステータス未設定'}</Text>
            <Settings size={14} color="gray.400" />
          </Flex>
        </Flex>
      </Flex>

      {/* Main Content */}
      <Box as="main" maxW="600px" mx="auto" p="md">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/matches" element={<MatchList user={user} />} />
          <Route path="/timetable/edit" element={<TimetableEdit user={user} />} />
          <Route path="/status/edit" element={<StatusSetting user={user} />} />
          <Route path="/chat/:matchId" element={<Chat user={user} />} />
          <Route path="/mypage" element={<MyPage user={user} onLogout={onLogout} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>

      {/* Footer Navigation */}
      <Flex
        as="nav"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        justify="space-around"
        align="center"
        py="sm"
        zIndex={100}
        boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
      >
        <Flex direction="column" align="center" cursor="pointer" onClick={() => navigate('/')} color={location.pathname === '/' ? 'blue.500' : 'gray.400'}>
          <HomeIcon size={24} />
          <Text fontSize="xs" mt="1">ホーム</Text>
        </Flex>
        <Flex direction="column" align="center" cursor="pointer" onClick={() => navigate('/matches')} color={location.pathname === '/matches' ? 'blue.500' : 'gray.400'}>
          <Users size={24} />
          <Text fontSize="xs" mt="1">マッチ一覧</Text>
        </Flex>
        <Flex direction="column" align="center" cursor="pointer" onClick={() => navigate('/mypage')} color={location.pathname === '/mypage' ? 'blue.500' : 'gray.400'}>
          <User size={24} />
          <Text fontSize="xs" mt="1">マイページ</Text>
        </Flex>
      </Flex>
    </Box>
  );
}

function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    level: 'busy',
    comment: '',
    expires_at: '',
    is_active: false
  });

  useEffect(() => {
    if (user) {
      fetchUserStatus();
    }
  }, [user]);

  const fetchUserStatus = async () => {
    if (!user) return;
    try {
      const res = await apiGet<{ success: boolean; status: UserStatus }>(
        `${API_ENDPOINTS.status}?user_id=${user.id}`
      );
      if (res.success && res.status) {
        setUserStatus(res.status);
      }
    } catch (e) {
      console.error('ステータスの取得に失敗しました', e);
    }
  };

  const handleLogin = (loggedInUser: LoggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      setUser(null);
      setUserStatus({
        level: 'busy',
        comment: '',
        expires_at: '',
        is_active: false
      });
    }
  };

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <Layout user={user} userStatus={userStatus} onLogout={handleLogout} />
      )}
    </BrowserRouter>
  );
}

export default App;
