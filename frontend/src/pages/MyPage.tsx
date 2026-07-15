import { useState, useEffect } from 'react';
import {
  Box, Flex, VStack, Heading, Text, Button, Avatar, Badge, Wrap,
  Input, Modal, Loading,
} from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiGet, apiPost, apiDelete, resolveAvatarUrl } from '../lib/api';
import type { LoggedInUser } from '../App';

interface Friend {
  friend_id: number;
  username: string;
  faculty: string;
  circle: string;
  avatar_url: string | null;
}

interface SearchedUser {
  id: number;
  username: string;
  faculty: string;
  circle: string;
  avatar_url: string | null;
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
  const [removingId, setRemovingId] = useState<number | null>(null);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 再取得時のローディング表示に必要
    if (user) fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAddMessage(null);
    try {
      const res = await apiGet<{ success: boolean; users?: SearchedUser[]; message?: string }>(
        `${API_ENDPOINTS.friends}?search=1&q=${encodeURIComponent(searchQuery)}&exclude_id=${user!.id}`
      );
      if (res.success && res.users) {
        setSearchResults(res.users);
      } else {
        // 失敗理由（ログイン切れ等）を握りつぶさず、常に検出できるようにする
        setSearchResults([]);
        setAddMessage({ type: 'error', text: res.message || '検索に失敗しました。' });
      }
    } catch (err) {
      setSearchResults([]);
      setAddMessage({ type: 'error', text: err instanceof Error ? err.message : '検索に失敗しました。' });
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

  const handleUnfriend = async (friend: Friend) => {
    if (!window.confirm(`${friend.username}さんをフレンドから解除しますか？`)) return;
    setRemovingId(friend.friend_id);
    try {
      const res = await apiDelete<{ success: boolean; message?: string }>(API_ENDPOINTS.friends, {
        friend_id: friend.friend_id,
      });
      if (res.success) {
        fetchFriends();
      } else {
        alert(res.message || 'フレンドの解除に失敗しました。');
      }
    } catch {
      alert('サーバーとの通信に失敗しました。');
    } finally {
      setRemovingId(null);
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
      <Box bg="white" borderRadius="2xl" p="md" boxShadow="0 4px 16px rgba(99,102,241,0.10)">
        <Flex gap="md" align="center" justify="space-between">
          <Flex gap="md" align="center">
            <Avatar size="lg" name={user?.username || ''} src={resolveAvatarUrl(user?.avatar_url)} />
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
          <Flex justify="center" py="md"><Loading.Dots fontSize="2xl" color="violet.500" /></Flex>
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
              <VStack key={friend.friend_id} gap="2xs" align="center" w="60px">
                <Avatar name={friend.username} size="md" src={resolveAvatarUrl(friend.avatar_url)} />
                <Text fontSize="xs" lineClamp={1} w="60px" textAlign="center">{friend.username}</Text>
                <Text
                  as="button"
                  type="button"
                  fontSize="2xs"
                  color="red.400"
                  cursor="pointer"
                  bg="none"
                  border="none"
                  p="0"
                  opacity={removingId === friend.friend_id ? 0.5 : 1}
                  disabled={removingId === friend.friend_id}
                  onClick={() => handleUnfriend(friend)}
                >
                  解除
                </Text>
              </VStack>
            ))}
          </Wrap>
        )}
      </Box>

      {/* 友達追加モーダル */}
      <Modal.Root open={isModalOpen} onClose={closeModal} size="md">
        <Modal.Header>友達を追加</Modal.Header>
        <Modal.Body pb="lg">
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
                      <Avatar name={u.username} size="sm" src={resolveAvatarUrl(u.avatar_url)} />
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
        </Modal.Body>
      </Modal.Root>
    </VStack>
  );
}
