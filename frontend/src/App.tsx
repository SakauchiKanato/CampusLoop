import { useState, useEffect } from 'react';
// HashRouter を使用：大学サーバーのサブディレクトリ（/~knt416/CampusLoop/...）配下でも
// サーバー側のリライト設定なしでページ更新・直リンクが動作する
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, Text } from '@yamada-ui/react';
import { Settings, Home as HomeIcon, Users, User } from 'lucide-react';

import { API_ENDPOINTS, apiGet, apiPost } from './lib/api';

export interface LoggedInUser {
  id: number;
  username: string;
  campus: string;
  faculty: string;
  circle: string;
  avatar_url: string | null;
}

export interface UserStatus {
  level: 'free' | 'chat' | 'busy';
  location: string;
  comment: string;
  expires_at: string;
  is_active: boolean;
}

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MatchList from './pages/MatchList';
import TimetableEdit from './pages/TimetableEdit';
import StatusSetting from './pages/StatusSetting';
import Chat from './pages/Chat';
import MyPage from './pages/MyPage';
import ProfileEdit from './pages/ProfileEdit';
import EventCreate from './pages/EventCreate';

function Layout({ user, userStatus, onLogout, onProfileUpdate, onStatusUpdated }: { user: LoggedInUser, userStatus: UserStatus, onLogout: () => void, onProfileUpdate: (updatedUser: LoggedInUser) => void, onStatusUpdated: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 未応答の誘い数（通知バッジ用）。30秒ごと＋画面遷移時に更新
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiGet<{ success: boolean; count?: number }>(
          `${API_ENDPOINTS.matches}?pending=1&user_id=${user.id}`
        );
        if (!cancelled && res.success) setPendingCount(res.count ?? 0);
      } catch {
        // 通信エラー時はバッジを更新しない
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [user.id, location.pathname]);

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
    <Box minH="100vh" pb="90px">
      {/* Header（学生向けのグラデーションヘッダー） */}
      <Flex
        as="header"
        justify="space-between"
        align="center"
        py="sm"
        px="md"
        position="sticky"
        top={0}
        zIndex={100}
        boxShadow="0 2px 14px rgba(99,102,241,0.30)"
        style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)' }}
      >
        <Flex align="center" gap="sm">
          <Text fontSize="2xl">⚡</Text>
          <Box>
            <Text fontSize="xl" fontWeight="bold" color="white" letterSpacing="-0.5px" lineHeight="1.2">MULoop</Text>
            <Text fontSize="2xs" color="whiteAlpha.800">空きコマを、いちばん楽しい時間に。</Text>
          </Box>
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
          <Route path="/status/edit" element={<StatusSetting user={user} onStatusUpdated={onStatusUpdated} />} />
          <Route path="/chat/:matchId" element={<Chat user={user} />} />
          <Route path="/events/new" element={<EventCreate user={user} />} />
          <Route path="/mypage" element={<MyPage user={user} onLogout={onLogout} />} />
          <Route path="/profile/edit" element={<ProfileEdit user={user} onProfileUpdate={onProfileUpdate} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>

      {/* Footer Navigation（角丸フローティング風ナビ） */}
      <Flex
        as="nav"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        justify="space-around"
        align="center"
        py="xs"
        zIndex={100}
        borderTopRadius="2xl"
        boxShadow="0 -4px 20px rgba(99,102,241,0.15)"
      >
        {[
          { path: '/', icon: <HomeIcon size={22} />, label: 'ホーム' },
          { path: '/matches', icon: <Users size={22} />, label: 'マッチ一覧' },
          { path: '/mypage', icon: <User size={22} />, label: 'マイページ' },
        ].map((item) => {
          const active = location.pathname === item.path;
          return (
            <Flex
              key={item.path}
              direction="column"
              align="center"
              cursor="pointer"
              onClick={() => navigate(item.path)}
              color={active ? 'violet.600' : 'gray.400'}
              bg={active ? 'violet.50' : 'transparent'}
              px="lg"
              py="xs"
              borderRadius="xl"
              transition="all 0.2s"
            >
              <Box position="relative">
                {item.icon}
                {item.path === '/matches' && pendingCount > 0 && (
                  <Flex
                    position="absolute"
                    top="-6px"
                    right="-10px"
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    minW="17px"
                    h="17px"
                    fontSize="2xs"
                    fontWeight="bold"
                    align="center"
                    justify="center"
                    px="1"
                    boxShadow="0 1px 4px rgba(239,68,68,0.5)"
                  >
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Flex>
                )}
              </Box>
              <Text fontSize="2xs" mt="1" fontWeight={active ? 'bold' : 'normal'}>{item.label}</Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

// ログイン状態の保存キー（リロードしてもログアウトされないように localStorage に保持）
const STORAGE_KEY = 'muloop_user';

const loadSavedUser = (): LoggedInUser | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as LoggedInUser) : null;
  } catch {
    return null;
  }
};

function App() {
  const [user, setUser] = useState<LoggedInUser | null>(loadSavedUser);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    level: 'busy',
    location: '',
    comment: '',
    expires_at: '',
    is_active: false
  });

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

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 再取得時のローディング表示に必要
      fetchUserStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 起動時にサーバー側のセッションが本当に有効か確認する。
  // localStorage はあくまでUI表示用のキャッシュで、認証の実体はサーバーの
  // セッションCookie側にあるため、Cookieが切れている/無効な場合はログイン画面へ戻す。
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{ success: boolean; user?: LoggedInUser }>(API_ENDPOINTS.me);
        if (res.success && res.user) {
          setUser(res.user);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user)); } catch { /* 保存失敗時は無視 */ }
        } else {
          setUser(null);
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* 無視 */ }
        }
      } catch {
        // サーバーに接続できない場合は、いったんキャッシュのログイン状態のままにしておく
      }
    })();
  }, []);

  const handleLogin = (loggedInUser: LoggedInUser) => {
    setUser(loggedInUser);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser)); } catch { /* 保存失敗時は無視 */ }
  };

  const handleProfileUpdate = (updatedUser: LoggedInUser) => {
    setUser(updatedUser);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser)); } catch { /* 保存失敗時は無視 */ }
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      // サーバー側のセッションも破棄する（失敗しても画面上はログアウト扱いにする）
      apiPost(API_ENDPOINTS.logout, {}).catch(() => { /* 無視 */ });
      setUser(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* 無視 */ }
      setUserStatus({
        level: 'busy',
        location: '',
        comment: '',
        expires_at: '',
        is_active: false
      });
    }
  };

  const [showRegister, setShowRegister] = useState(false);

  return (
    <HashRouter>
      {!user ? (
        <Routes>
          <Route
            path="/login"
            element={
              showRegister
                ? <Register onRegister={handleLogin} onGoLogin={() => setShowRegister(false)} />
                : <Login onLogin={handleLogin} onGoRegister={() => setShowRegister(true)} />
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <Layout user={user} userStatus={userStatus} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} onStatusUpdated={fetchUserStatus} />
      )}
    </HashRouter>
  );
}

export default App;
