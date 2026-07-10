import { useState, useEffect } from 'react';
import { Box, Flex, VStack, Heading, Text, Avatar, Button, IconButton } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiGet, apiPost, apiPut } from '../lib/api';
import { getCurrentPeriod } from './Home';

const PERIOD_TIMES: Record<number, string> = {
  1: '08:50〜10:30',
  2: '10:40〜12:10',
  3: '13:10〜14:50',
  4: '15:00〜16:40',
  5: '16:50〜18:30',
};

interface MatchCandidate {
  friend_id: number;
  username: string;
  faculty: string;
  circle: string;
  status_level: string;
  status_comment: string | null;
  match_id: number | null;
  match_from_user: number | null;
  match_status: string | null;
}

interface PendingInvite {
  match_id: number;
  period: number;
  from_user: number;
  from_username: string;
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

  // 現在時刻に合わせた時限を初期表示（例: 15時なら4限）。授業終了後は5限を表示
  const currentPeriod = getCurrentPeriod();
  const [period, setPeriod] = useState(currentPeriod ?? 5);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || isWeekend) {
      setLoading(false);
      return;
    }
    fetchCandidates(period);
  }, [user, period]);

  useEffect(() => {
    if (!user || isWeekend) return;
    fetchInvites();
  }, [user]);

  // 自分宛の未応答の誘いを取得
  const fetchInvites = async () => {
    try {
      const res = await apiGet<{ success: boolean; invites?: PendingInvite[] }>(
        `${API_ENDPOINTS.matches}?pending=1&user_id=${user!.id}`
      );
      setInvites(res.success && res.invites ? res.invites : []);
    } catch {
      setInvites([]);
    }
  };

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

  // 誘いへの返事（承諾 or 拒否）
  const handleRespond = async (matchId: number, status: 'accepted' | 'rejected') => {
    try {
      const res = await apiPut<{ success: boolean; message?: string }>(API_ENDPOINTS.matches, {
        match_id: matchId,
        status,
      });
      if (res.success && status === 'accepted') {
        navigate(`/chat/${matchId}`);
      } else {
        fetchCandidates(period);
        fetchInvites();
      }
    } catch {
      alert('返答の送信に失敗しました。');
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

      {/* 届いている誘い */}
      {invites.length > 0 && (
        <Box bg="white" p="md" borderRadius="2xl" boxShadow="0 4px 16px rgba(239,68,68,0.12)" border="1px solid" borderColor="red.100">
          <Text fontWeight="bold" mb="sm">📥 届いている誘い（{invites.length}件）</Text>
          <VStack gap="sm" align="stretch">
            {invites.map((inv) => (
              <Flex key={inv.match_id} align="center" justify="space-between" gap="sm">
                <Flex align="center" gap="sm" flex="1">
                  <Avatar name={inv.from_username} size="sm" />
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="bold">{inv.from_username}</Text>
                    さんから <Text as="span" fontWeight="bold" color="violet.600">{inv.period}限</Text> に誘われています
                  </Text>
                </Flex>
                <Flex gap="xs" flexShrink={0}>
                  <Button size="sm" colorScheme="green" borderRadius="full" onClick={() => handleRespond(inv.match_id, 'accepted')}>
                    承諾
                  </Button>
                  <Button size="sm" colorScheme="red" variant="outline" borderRadius="full" onClick={() => handleRespond(inv.match_id, 'rejected')}>
                    断る
                  </Button>
                </Flex>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      {/* 時限セレクタ（終了済みの時限は選択不可） */}
      <Flex gap="sm">
        {[1, 2, 3, 4, 5].map((p) => {
          const isPast = currentPeriod !== null && p < currentPeriod;
          return (
            <Button
              key={p}
              size="sm"
              flex="1"
              borderRadius="full"
              variant={period === p ? 'solid' : 'outline'}
              colorScheme={period === p ? 'blue' : 'gray'}
              disabled={isPast}
              opacity={isPast ? 0.4 : 1}
              onClick={() => setPeriod(p)}
            >
              {p}限{p === currentPeriod ? ' 🔥' : ''}
            </Button>
          );
        })}
      </Flex>
      {currentPeriod !== null && (
        <Text fontSize="xs" color="gray.500" textAlign="center">
          🕐 いまは{currentPeriod}限の時間帯です（終了した時限は選べません）
        </Text>
      )}

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
              <Box key={group.level} bg="white" p="md" borderRadius="2xl" boxShadow="0 4px 16px rgba(99,102,241,0.08)">
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
                            ) : candidate.match_status === 'pending' && candidate.match_from_user !== user!.id ? (
                              <Flex gap="xs">
                                <Button size="sm" colorScheme="green" onClick={() => handleRespond(candidate.match_id!, 'accepted')}>
                                  承諾
                                </Button>
                                <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleRespond(candidate.match_id!, 'rejected')}>
                                  断る
                                </Button>
                              </Flex>
                            ) : candidate.match_status === 'rejected' ? (
                              <Button size="sm" colorScheme="gray" variant="outline" disabled>
                                不成立
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
