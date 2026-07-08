import { useState, useEffect } from 'react';
import {
  Box, Flex, VStack, Heading, Text, Button, Avatar, Badge, Wrap,
  Input,
} from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiGet, apiPost } from '../lib/api';
import type { LoggedInUser } from '../App';

interface Friend {
  friend_id: number;
  username: string;
  faculty: string;
  circle: string;
}

interface SearchedUser {
  id: number;
  username: string;
  faculty: string;
  circle: string;
}

export default function MyPage({ user, onLogout }: { user: LoggedInUser | null; onLogout: () => void }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // 友達追加モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await apiGet<{ success: boolean; friends?: Friend[] }>(
        `${API_ENDPOINTS.friends}?user_id=${user!.id}`
      );
      if (res.success && res.friends) {
        setFriends(res.friends);
      }
    } catch {
      // エラー時は空のまま
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAddMessage(null);
    try {
      const res = await apiGet<{ success: boolean; users?: SearchedUser[] }>(
        `${API_ENDPOINTS.friends}?search=1&q=${encodeURIComponent(searchQuery)}&exclude_id=${user!.id}`
      );
      if (res.success && res.users) {
        setSearchResults(res.users);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetId: number) => {
    setAddingId(targetId);
    setAddMessage(null);
    try {
      const res = await apiPost<{ success: boolean; message?: string }>(API_ENDPOINTS.friends, {
        user_id: user!.id,
        friend_id: targetId,
      });
      if (res.success) {
        setAddMessage({ type: 'success', text: res.message || '友達に追加しました！' });
        fetchFriends();
      } else {
        setAddMessage({ type: 'error', text: res.message || '友達の追加に失敗しました。' });
      }
    } catch {
      setAddMessage({ type: 'error', text: 'サーバーとの通信に失敗しました。' });
    } finally {
      setAddingId(null);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setAddMessage(null);
  };

  const closeModal = () => setIsModalOpen(false);

  const isAlreadyFriend = (id: number) => friends.some((f) => f.friend_id === id);

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" justify="space-between" mb="sm">
        <Heading as="h2" size="md">マイページ</Heading>
        <Button size="sm" variant="outline" colorScheme="gray" onClick={onLogout}>ログアウト</Button>
      </Flex>

      {/* プロフィールカード */}
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p="md" boxShadow="sm">
        <Flex gap="md" align="center" justify="space-between">
          <Flex gap="md" align="center">
            <Avatar size="lg" name={user?.username || ''} />
            <Box>
              <Heading as="h3" size="sm" mb="xs">
                {user?.username || ''}{' '}
                <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal">
                  （{user?.faculty || '未設定'}）
                </Text>
              </Heading>
              <Text fontSize="sm" color="gray.600">所属サークル： {user?.circle || '未設定'}</Text>
              <Text fontSize="xs" color="gray.400" mt="xs">{user?.campus || ''}</Text>
            </Box>
          </Flex>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => navigate('/profile/edit')}
            flexShrink={0}
          >
            編集
          </Button>
        </Flex>
      </Box>

      {/* フレンド一覧 */}
      <Box>
        <Flex justify="space-between" align="center" mb="sm">
          <Heading as="h3" size="sm" display="flex" alignItems="center" gap="xs">
            👥 フレンド一覧（{loadingFriends ? '...' : friends.length}人）
          </Heading>
          <Button size="xs" colorScheme="blue" variant="outline" onClick={openModal}>
            + 友達を追加
          </Button>
        </Flex>

        {loadingFriends ? (
          <Flex justify="center" py="md"><Text fontSize="sm" color="gray.400">読み込み中…</Text></Flex>
        ) : friends.length === 0 ? (
          <Box
            bg="gray.50"
            p="md"
            borderRadius="md"
            textAlign="center"
            color="gray.400"
            fontSize="sm"
          >
            まだフレンドがいません。「+ 友達を追加」から追加しよう！
          </Box>
        ) : (
          <Wrap gap="md" mt="sm">
            {friends.map((friend) => (
              <VStack key={friend.friend_id} gap="xs" align="center">
                <Avatar name={friend.username} size="md" />
                <Text fontSize="xs" lineClamp={1} w="50px" textAlign="center">{friend.username}</Text>
              </VStack>
            ))}
          </Wrap>
        )}
      </Box>

      {/* 友達追加モーダル */}
      {isModalOpen && (
      <Box position="fixed" inset={0} zIndex={200}>
        {/* オーバーレイ */}
        <Box position="absolute" inset={0} bg="blackAlpha.500" onClick={closeModal} />
        {/* モーダル本体 */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          borderRadius="xl"
          boxShadow="lg"
          w="calc(100% - 32px)"
          maxW="420px"
          maxH="80vh"
          overflowY="auto"
          p="lg"
        >
          <Flex justify="space-between" align="center" mb="md">
            <Heading as="h3" size="sm">友達を追加</Heading>
            <Button size="xs" variant="ghost" colorScheme="gray" onClick={closeModal}>✕</Button>
          </Flex>
          <VStack gap="md" align="stretch">
            <Text fontSize="sm" color="gray.500">
              ユーザー名またはユーザーIDで検索してください
            </Text>

            <Flex gap="sm">
              <Input
                placeholder="ユーザー名 / ID を入力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                flex={1}
              />
              <Button colorScheme="blue" onClick={handleSearch} loading={isSearching}>
                検索
              </Button>
            </Flex>

            {addMessage && (
              <Box
                bg={addMessage.type === 'success' ? 'green.50' : 'red.50'}
                color={addMessage.type === 'success' ? 'green.600' : 'red.500'}
                p="sm"
                borderRadius="md"
              >
                <Text fontSize="sm">{addMessage.text}</Text>
              </Box>
            )}

            {searchResults.length > 0 && (
              <VStack gap="sm" align="stretch">
                {searchResults.map((u) => (
                  <Flex
                    key={u.id}
                    align="center"
                    justify="space-between"
                    p="sm"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Flex align="center" gap="sm">
                      <Avatar name={u.username} size="sm" />
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">{u.username}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {u.faculty || '学部未設定'}{u.circle ? ` / ${u.circle}` : ''}
                        </Text>
                        <Badge colorScheme="gray" fontSize="xs">ID: {u.id}</Badge>
                      </Box>
                    </Flex>
                    <Button
                      size="sm"
                      colorScheme={isAlreadyFriend(u.id) ? 'gray' : 'blue'}
                      disabled={isAlreadyFriend(u.id)}
                      loading={addingId === u.id}
                      onClick={() => handleAddFriend(u.id)}
                    >
                      {isAlreadyFriend(u.id) ? '追加済み' : '追加'}
                    </Button>
                  </Flex>
                ))}
              </VStack>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <Text fontSize="sm" color="gray.400" textAlign="center">
                ユーザーが見つかりませんでした
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
      )}
    </VStack>
  );
}
