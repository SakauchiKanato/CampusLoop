import { useState, useEffect } from 'react';
import { Box, Flex, VStack, Heading, Text, Grid, GridItem, Avatar, Button, Spinner } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiGet, apiPost } from '../lib/api';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAY_MAP: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

interface TimetableSlot {
  period: number;
  subject: string | null;
  is_free: boolean;
}

interface MatchCandidate {
  user_id: number;
  username: string;
  faculty: string;
  status_level: string;
  status_comment: string;
  free_periods: number[];
}

export default function Home({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();

  // 今日の曜日（JS: 0=日, 1=月...6=土）
  const todayJs = new Date().getDay();
  const todayName = DAY_NAMES[todayJs];

  // バックエンドの day_of_week は 1=月〜5=金
  const todayDb = WEEKDAY_MAP[todayJs]; // 0=日曜, 6=土曜 の場合はデータなし

  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'green.500';
      case 'chat': return 'orange.500';
      case 'busy': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'free': return '暇';
      case 'chat': return 'ゆる募';
      case 'busy': return '勉強中';
      default: return '不明';
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchTimetable();
    fetchMatches();
  }, [user]);

  const fetchTimetable = async () => {
    setLoadingTimetable(true);
    try {
      // 土日はDB上にデータがないので空配列を表示
      if (todayDb === 0 || todayDb === 6) {
        setTimetable([]);
        return;
      }
      const res = await apiGet<{ success: boolean; timetable?: TimetableSlot[] }>(
        `${API_ENDPOINTS.timetable}?user_id=${user!.id}&day_of_week=${todayDb}`
      );
      if (res.success && res.timetable) {
        // 1〜5限のスロットを全て埋める（データがない時限は空きとして扱う）
        const filled: TimetableSlot[] = [1, 2, 3, 4, 5].map((p) => {
          const found = res.timetable!.find((t) => t.period === p);
          return found ?? { period: p, subject: null, is_free: true };
        });
        setTimetable(filled);
      } else {
        // データがない場合は全コマ空き
        setTimetable([1, 2, 3, 4, 5].map((p) => ({ period: p, subject: null, is_free: true })));
      }
    } catch {
      setTimetable([]);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await apiGet<{ success: boolean; matches?: MatchCandidate[] }>(
        `${API_ENDPOINTS.matches}?user_id=${user!.id}`
      );
      if (res.success && res.matches) {
        setMatchCandidates(res.matches);
      } else {
        setMatchCandidates([]);
      }
    } catch {
      setMatchCandidates([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleInvite = async (toUserId: number) => {
    // 現在の空きコマの最初のものを取得
    const freePeriod = timetable.find((t) => t.is_free)?.period ?? 3;
    try {
      await apiPost<{ success: boolean }>(`${API_ENDPOINTS.matches}`, {
        from_user: user!.id,
        to_user: toUserId,
        period: freePeriod,
      });
      alert('誘いを送りました！');
    } catch {
      alert('誘いの送信に失敗しました。');
    }
  };

  return (
    <VStack gap="lg" align="stretch">
      {/* 時間割セクション */}
      <Box bg="white" p="md" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb="md">
          <Heading as="h2" size="md" display="flex" alignItems="center" gap="xs">
            📅 今日の時間割 ({todayName}曜日)
          </Heading>
        </Flex>

        {todayDb === 0 || todayDb === 6 ? (
          <Box textAlign="center" py="lg" color="gray.400">
            <Text fontSize="sm">今日は{todayName}曜日です。授業はお休みです 🎉</Text>
          </Box>
        ) : loadingTimetable ? (
          <Flex justify="center" py="lg"><Spinner size="sm" /></Flex>
        ) : (
          <Grid templateColumns="repeat(5, 1fr)" gap="sm" mb="md">
            {timetable.map((item) => (
              <GridItem key={item.period}>
                <Box textAlign="center" fontSize="xs" color="gray.500" mb="xs">
                  {item.period}限
                </Box>
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  h="60px"
                  bg={item.is_free ? 'blue.50' : 'gray.100'}
                  border="1px solid"
                  borderColor={item.is_free ? 'blue.200' : 'gray.200'}
                  borderRadius="md"
                  p="xs"
                >
                  {item.is_free ? (
                    <Text fontSize="sm" fontWeight="bold" color="blue.500">【空】</Text>
                  ) : (
                    <Text fontSize="xs" fontWeight="bold" color="gray.700" lineClamp={2}>
                      {item.subject}
                    </Text>
                  )}
                </Flex>
              </GridItem>
            ))}
          </Grid>
        )}

        <Button w="full" variant="outline" colorScheme="gray" onClick={() => navigate('/timetable/edit')}>
          タップして時間割を編集
        </Button>
      </Box>

      {/* マッチ候補セクション */}
      <Box>
        <Heading as="h2" size="md" display="flex" alignItems="center" gap="xs" mb="md">
          🔥 空きコマのマッチ候補
        </Heading>

        {loadingMatches ? (
          <Flex justify="center" py="lg"><Spinner size="sm" /></Flex>
        ) : matchCandidates.length === 0 ? (
          <Box
            bg="white"
            p="lg"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.200"
            textAlign="center"
            color="gray.400"
          >
            <Text fontSize="sm">今は空きコマが一致するフレンドがいません</Text>
            <Text fontSize="xs" mt="xs">マイページからフレンドを追加してみよう！</Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap="md">
            {matchCandidates.map((candidate) => (
              <Box
                key={candidate.user_id}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                boxShadow="sm"
                p="md"
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap="sm"
              >
                <Avatar name={candidate.username} size="md" />
                <Box textAlign="center">
                  <Text fontSize="sm" fontWeight="bold" lineClamp={1}>{candidate.username}</Text>
                  <Flex align="center" justify="center" gap="xs" mt="xs">
                    <Box w="8px" h="8px" borderRadius="full" bg={getStatusColor(candidate.status_level)} />
                    <Text fontSize="xs" color="gray.600">{getStatusLabel(candidate.status_level)}</Text>
                  </Flex>
                </Box>
                <Button size="sm" colorScheme="blue" w="full" mt="auto" onClick={() => handleInvite(candidate.user_id)}>
                  誘う
                </Button>
              </Box>
            ))}
          </Grid>
        )}
      </Box>
    </VStack>
  );
}
