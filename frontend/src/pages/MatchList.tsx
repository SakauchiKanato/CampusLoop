import { useState, useEffect } from 'react';
import { Box, Flex, VStack, Heading, Text, Avatar, Button, IconButton } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiGet, apiPost } from '../lib/api';

const PERIOD_TIMES: Record<number, string> = {
  1: '09:00〜10:30',
  2: '10:40〜12:10',
  3: '13:00〜14:30',
  4: '14:40〜16:10',
  5: '16:20〜17:50',
};

interface MatchCandidate {
  friend_id: number;
  username: string;
  faculty: string;
  circle: string;
  status_level: string;
  status_comment: string | null;
  match_id: number | null;
  match_status: string | null;
}

const GROUP_DEFS = [
  { level: 'free', title: '誰でもおいで！（暇）', color: 'green.500', showInvite: true },
  { level: 'chat', title: '作業中だけど喋れる（ゆる募）', color: 'orange.500', showInvite: true },
  { level: 'busy', title: 'ガチ勉強中（そっとしておいて）', color: 'red.500', showInvite: false },
] as const;

export default function MatchList({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();

  // 今日の曜日（JS: 0=日, 1=月...6=土 / DB: 1=月〜5=金）
  const todayDb = new Date().getDay();
  const isWeekend = todayDb === 0 || todayDb === 6;

  const [period, setPeriod] = useState(3);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || isWeekend) {
      setLoading(false);
      return;
    }
    fetchCandidates(period);
  }, [user, period]);

  const fetchCandidates = async (p: number) => {
    setLoading(true);
    try {
      const res = await apiGet<{ success: boolean; candidates?: MatchCandidate[] }>(
        `${API_ENDPOINTS.matches}?user_id=${user!.id}&day_of_week=${todayDb}&period=${p}`
      );
      setCandidates(res.success && res.candidates ? res.candidates : []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (toUserId: number) => {
    setInvitingId(toUserId);
    try {
      const res = await apiPost<{ success: boolean; message?: string }>(API_ENDPOINTS.matches, {
        from_user: user!.id,
        to_user: toUserId,
        period,
      });
      alert(res.success ? '誘いを送りました！' : (res.message || '誘いの送信に失敗しました。'));
      fetchCandidates(period);
    } catch {
      alert('誘いの送信に失敗しました。');
    } finally {
      setInvitingId(null);
    }
  };

  if (isWeekend) {
    return (
      <VStack gap="lg" align="stretch">
        <Flex align="center" gap="sm" mb="sm">
          <IconButton icon={<ChevronLeft />} variant="ghost" onClick={() => navigate(-1)} aria-label="戻る" />
          <Heading as="h2" size="md">マッチ候補</Heading>
        </Flex>
        <Box textAlign="center" py="lg" color="gray.400">
          <Text fontSize="sm">今日は週末です。授業はお休みです 🎉</Text>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" gap="sm" mb="sm">
        <IconButton icon={<ChevronLeft />} variant="ghost" onClick={() => navigate(-1)} aria-label="戻る" />
        <Heading as="h2" size="md">{period}限のマッチ候補 ({PERIOD_TIMES[period]})</Heading>
      </Flex>

      {/* 時限セレクタ */}
      <Flex gap="sm">
        {[1, 2, 3, 4, 5].map((p) => (
          <Button
            key={p}
            size="sm"
            flex="1"
            variant={period === p ? 'solid' : 'outline'}
            colorScheme={period === p ? 'blue' : 'gray'}
            onClick={() => setPeriod(p)}
          >
            {p}限
          </Button>
        ))}
      </Flex>

      {loading ? (
        <Flex justify="center" py="lg"><Text fontSize="sm" color="gray.400">読み込み中…</Text></Flex>
      ) : candidates.length === 0 ? (
        <Box
          bg="white"
          p="lg"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
          textAlign="center"
          color="gray.400"
        >
          <Text fontSize="sm">{period}限が空きコマのフレンドがいません</Text>
          <Text fontSize="xs" mt="xs">マイページからフレンドを追加してみよう！</Text>
        </Box>
      ) : (
        <VStack gap="xl" align="stretch">
          {GROUP_DEFS.map((group) => {
            const members = candidates.filter((c) => c.status_level === group.level);
            return (
              <Box key={group.level}>
                <Flex align="center" justify="space-between" mb="sm">
                  <Flex align="center" gap="xs">
                    <Box w="12px" h="12px" borderRadius="full" bg={group.color} />
                    <Text fontWeight="bold">{group.title}</Text>
                  </Flex>
                  <Text color="gray.500" fontSize="sm">[{members.length}人]</Text>
                </Flex>

                <Box w="full" h="1px" bg="gray.200" mb="md" />

                {members.length > 0 ? (
                  <VStack gap="md" align="stretch">
                    {members.map((candidate) => (
                      <Flex key={candidate.friend_id} justify="space-between" align="flex-start" gap="md">
                        <Flex gap="md" flex="1">
                          <Avatar name={candidate.username} size="md" />
                          <Box>
                            <Flex align="baseline" gap="sm" mb="xs">
                              <Text fontWeight="bold">{candidate.username}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {candidate.faculty || '学部未設定'}{candidate.circle ? ` / ${candidate.circle}` : ''}
                              </Text>
                            </Flex>
                            {candidate.status_comment && (
                              <Text fontSize="sm" color="gray.700">「{candidate.status_comment}」</Text>
                            )}
                          </Box>
                        </Flex>
                        {group.showInvite && (
                          candidate.match_id ? (
                            candidate.match_status === 'accepted' ? (
                              <Button size="sm" colorScheme="green" variant="outline" onClick={() => navigate(`/chat/${candidate.match_id}`)}>
                                チャットへ
                              </Button>
                            ) : (
                              <Button size="sm" colorScheme="gray" variant="outline" disabled>
                                誘い済み
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              loading={invitingId === candidate.friend_id}
                              onClick={() => handleInvite(candidate.friend_id)}
                            >
                              誘う
                            </Button>
                          )
                        )}
                      </Flex>
                    ))}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color="gray.500" textAlign="center" py="sm">
                    該当するフレンドはいません
                  </Text>
                )}
              </Box>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
