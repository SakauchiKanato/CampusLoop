import { useState, useEffect } from 'react';
import { Box, Flex, VStack, Heading, Text, Grid, GridItem, Avatar, Button, Loading } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { getCurrentPeriod } from '../lib/periods';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAY_MAP: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

interface TimetableSlot {
  period: number;
  subject: string | null;
  is_free: boolean;
}

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

interface CampusEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  period: number;
  location: string | null;
  campus: string;
  creator_id: number;
  creator_name: string;
  participant_count: number;
  is_joined: boolean;
}

// YYYY-MM-DD → 「今日」「明日」「M月D日」
const formatEventDate = (dateStr: string) => {
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dateStr === toKey(today)) return '今日';
  if (dateStr === toKey(tomorrow)) return '明日';
  const m = dateStr.match(/^\d{4}-(\d{2})-(\d{2})/);
  return m ? `${Number(m[1])}月${Number(m[2])}日` : dateStr;
};

export default function Home({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();

  // 今日の曜日（JS: 0=日, 1=月...6=土）
  const todayJs = new Date().getDay();
  const todayName = DAY_NAMES[todayJs];
  // いま進行中（または次）の時限。授業時間終了後は null
  const currentPeriod = getCurrentPeriod();

  // バックエンドの day_of_week は 1=月〜5=金
  const todayDb = WEEKDAY_MAP[todayJs]; // 0=日曜, 6=土曜 の場合はデータなし

  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([]);
  const [matchPeriod, setMatchPeriod] = useState<number | null>(null);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

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

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await apiGet<{ success: boolean; events?: CampusEvent[] }>(
        `${API_ENDPOINTS.events}?user_id=${user!.id}`
      );
      setEvents(res.success && res.events ? res.events : []);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // イベント参加/取り消しトグル
  const handleToggleJoin = async (eventId: number) => {
    try {
      const res = await apiPut<{ success: boolean; joined?: boolean; participant_count?: number }>(
        API_ENDPOINTS.events,
        { event_id: eventId, user_id: user!.id }
      );
      if (res.success) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId
              ? { ...ev, is_joined: !!res.joined, participant_count: res.participant_count ?? ev.participant_count }
              : ev
          )
        );
      }
    } catch {
      alert('参加登録に失敗しました。');
    }
  };

  // 自分が作ったイベントの削除
  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('このイベントを削除しますか？')) return;
    try {
      const res = await apiDelete<{ success: boolean; message?: string }>(API_ENDPOINTS.events, {
        event_id: eventId,
        user_id: user!.id,
      });
      if (res.success) {
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      } else {
        alert(res.message || '削除に失敗しました。');
      }
    } catch {
      alert('削除に失敗しました。');
    }
  };

  // そのイベントが「自分の空きコマ」と一致するか（今日開催×該当時限が空き）
  const isMyFreeSlot = (ev: CampusEvent) => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (ev.event_date !== key) return false;
    const slot = timetable.find((t) => t.period === ev.period);
    return !!slot?.is_free;
  };

  const fetchTimetable = async () => {
    setLoadingTimetable(true);
    try {
      // 土日はDB上にデータがないので空配列を表示
      if (todayDb === 0 || todayDb === 6) {
        setTimetable([]);
        setLoadingMatches(false);
        return;
      }
      // timetable.php は全曜日分を返すので、今日の曜日で絞り込む
      const res = await apiGet<{ success: boolean; timetable?: (TimetableSlot & { day_of_week: number })[] }>(
        `${API_ENDPOINTS.timetable}?user_id=${user!.id}`
      );
      let filled: TimetableSlot[];
      if (res.success && res.timetable) {
        const todayRows = res.timetable.filter((t) => t.day_of_week === todayDb);
        // 1〜5限のスロットを全て埋める（データがない時限は空きとして扱う）
        filled = [1, 2, 3, 4, 5].map((p) => {
          const found = todayRows.find((t) => t.period === p);
          return found ?? { period: p, subject: null, is_free: true };
        });
      } else {
        // データがない場合は全コマ空き
        filled = [1, 2, 3, 4, 5].map((p) => ({ period: p, subject: null, is_free: true }));
      }
      setTimetable(filled);

      // 「現在時刻以降」の最初の空きコマを対象にマッチ候補を取得
      // 例: いま15時なら 4限・5限 のうち空いている最初のコマ
      const cur = getCurrentPeriod();
      const freePeriod = cur
        ? filled.find((t) => t.is_free && t.period >= cur)?.period ?? null
        : null;
      setMatchPeriod(freePeriod);
      if (freePeriod) {
        fetchMatches(freePeriod);
      } else {
        setMatchCandidates([]);
        setLoadingMatches(false);
      }
    } catch {
      setTimetable([]);
      setLoadingMatches(false);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchMatches = async (period: number) => {
    setLoadingMatches(true);
    try {
      const res = await apiGet<{ success: boolean; candidates?: MatchCandidate[] }>(
        `${API_ENDPOINTS.matches}?user_id=${user!.id}&day_of_week=${todayDb}&period=${period}`
      );
      if (res.success && res.candidates) {
        setMatchCandidates(res.candidates);
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
    if (!matchPeriod) return;
    try {
      const res = await apiPost<{ success: boolean; message?: string }>(`${API_ENDPOINTS.matches}`, {
        from_user: user!.id,
        to_user: toUserId,
        period: matchPeriod,
      });
      alert(res.success ? '誘いを送りました！' : (res.message || '誘いの送信に失敗しました。'));
      fetchMatches(matchPeriod);
    } catch {
      alert('誘いの送信に失敗しました。');
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
      } else if (matchPeriod) {
        fetchMatches(matchPeriod);
      }
    } catch {
      alert('返答の送信に失敗しました。');
    }
  };

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 再取得時のローディング表示に必要
    fetchTimetable();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <VStack gap="lg" align="stretch">
      {/* 時間割セクション */}
      <Box bg="white" p="md" borderRadius="2xl" boxShadow="0 4px 20px rgba(99,102,241,0.10)">
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
          <Flex justify="center" py="lg"><Loading.Dots fontSize="2xl" color="violet.500" /></Flex>
        ) : (
          <Grid templateColumns="repeat(5, 1fr)" gap="sm" mb="md">
            {timetable.map((item) => {
              const isNow = item.period === currentPeriod;
              return (
                <GridItem key={item.period}>
                  <Box textAlign="center" fontSize="xs" color={isNow ? 'violet.600' : 'gray.500'} fontWeight={isNow ? 'bold' : 'normal'} mb="xs">
                    {isNow ? `▶ ${item.period}限` : `${item.period}限`}
                  </Box>
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    h="64px"
                    bg={item.is_free ? 'blue.50' : 'gray.100'}
                    border={isNow ? '2px solid' : '1px solid'}
                    borderColor={isNow ? 'violet.400' : item.is_free ? 'blue.200' : 'gray.200'}
                    borderRadius="lg"
                    p="xs"
                    boxShadow={isNow ? '0 2px 8px rgba(139,92,246,0.25)' : 'none'}
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
              );
            })}
          </Grid>
        )}

        <Button w="full" variant="outline" colorScheme="blue" borderRadius="full" onClick={() => navigate('/timetable/edit')}>
          ✏️ タップして時間割を編集
        </Button>
      </Box>

      {/* マッチ候補セクション */}
      <Box>
        <Heading as="h2" size="md" display="flex" alignItems="center" gap="xs" mb="md">
          🔥 {matchPeriod ? `${matchPeriod}限（空きコマ）のマッチ候補` : '空きコマのマッチ候補'}
        </Heading>

        {loadingMatches ? (
          <Flex justify="center" py="lg"><Loading.Dots fontSize="2xl" color="violet.500" /></Flex>
        ) : matchCandidates.length === 0 ? (
          <Box
            bg="white"
            p="lg"
            borderRadius="2xl"
            boxShadow="0 4px 20px rgba(99,102,241,0.08)"
            textAlign="center"
            color="gray.400"
          >
            {currentPeriod === null ? (
              <>
                <Text fontSize="sm">今日の授業時間は終了しました 🌙</Text>
                <Text fontSize="xs" mt="xs">また明日、空きコマで会いましょう！</Text>
              </>
            ) : matchPeriod === null ? (
              <>
                <Text fontSize="sm">このあと（{currentPeriod}限以降）の空きコマがありません</Text>
                <Text fontSize="xs" mt="xs">時間割を編集して空きコマを登録してみよう！</Text>
              </>
            ) : (
              <>
                <Text fontSize="sm">いま{matchPeriod}限が空きコマのフレンドがいません</Text>
                <Text fontSize="xs" mt="xs">マイページからフレンドを追加してみよう！</Text>
              </>
            )}
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap="md">
            {matchCandidates.map((candidate) => (
              <Box
                key={candidate.friend_id}
                bg="white"
                borderRadius="2xl"
                boxShadow="0 4px 16px rgba(99,102,241,0.10)"
                p="md"
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap="sm"
                transition="transform 0.15s"
                _hover={{ transform: 'translateY(-2px)' }}
              >
                <Avatar name={candidate.username} size="md" />
                <Box textAlign="center">
                  <Text fontSize="sm" fontWeight="bold" lineClamp={1}>{candidate.username}</Text>
                  <Flex align="center" justify="center" gap="xs" mt="xs">
                    <Box w="8px" h="8px" borderRadius="full" bg={getStatusColor(candidate.status_level)} />
                    <Text fontSize="xs" color="gray.600">{getStatusLabel(candidate.status_level)}</Text>
                  </Flex>
                  {candidate.status_comment && (
                    <Text fontSize="xs" color="gray.500" mt="xs" lineClamp={1}>「{candidate.status_comment}」</Text>
                  )}
                </Box>
                {!candidate.match_id ? (
                  <Button size="sm" colorScheme="blue" w="full" mt="auto" onClick={() => handleInvite(candidate.friend_id)}>
                    誘う
                  </Button>
                ) : candidate.match_status === 'accepted' ? (
                  <Button size="sm" colorScheme="green" w="full" mt="auto" onClick={() => navigate(`/chat/${candidate.match_id}`)}>
                    チャットへ
                  </Button>
                ) : candidate.match_status === 'pending' && candidate.match_from_user !== user!.id ? (
                  <Flex gap="xs" w="full" mt="auto">
                    <Button size="sm" colorScheme="green" flex="1" onClick={() => handleRespond(candidate.match_id!, 'accepted')}>
                      承諾
                    </Button>
                    <Button size="sm" colorScheme="red" variant="outline" flex="1" onClick={() => handleRespond(candidate.match_id!, 'rejected')}>
                      断る
                    </Button>
                  </Flex>
                ) : candidate.match_status === 'rejected' ? (
                  <Button size="sm" colorScheme="gray" w="full" mt="auto" disabled>
                    不成立
                  </Button>
                ) : (
                  <Button size="sm" colorScheme="gray" w="full" mt="auto" disabled>
                    誘い済み
                  </Button>
                )}
              </Box>
            ))}
          </Grid>
        )}
      </Box>

      {/* 学内イベントセクション（全ユーザーに公開） */}
      <Box>
        <Flex justify="space-between" align="center" mb="md">
          <Heading as="h2" size="md" display="flex" alignItems="center" gap="xs">
            🎪 学内イベント
          </Heading>
          <Button size="sm" colorScheme="violet" borderRadius="full" onClick={() => navigate('/events/new')}>
            ＋ イベントを作る
          </Button>
        </Flex>

        {loadingEvents ? (
          <Flex justify="center" py="lg"><Loading.Dots fontSize="2xl" color="violet.500" /></Flex>
        ) : events.length === 0 ? (
          <Box
            bg="white"
            p="lg"
            borderRadius="2xl"
            boxShadow="0 4px 20px rgba(99,102,241,0.08)"
            textAlign="center"
            color="gray.400"
          >
            <Text fontSize="sm">まだイベントがありません</Text>
            <Text fontSize="xs" mt="xs">「＋ イベントを作る」から最初のイベントを立ててみよう！</Text>
          </Box>
        ) : (
          <VStack gap="md" align="stretch">
            {events.map((ev) => (
              <Box
                key={ev.id}
                bg="white"
                borderRadius="2xl"
                boxShadow="0 4px 16px rgba(99,102,241,0.10)"
                p="md"
                borderLeft={isMyFreeSlot(ev) ? '4px solid' : 'none'}
                borderLeftColor="violet.400"
              >
                <Flex justify="space-between" align="flex-start" gap="sm">
                  <Box flex="1">
                    <Flex align="center" gap="xs" wrap="wrap" mb="xs">
                      <Text fontWeight="bold" fontSize="md">{ev.title}</Text>
                      {isMyFreeSlot(ev) && (
                        <Box bg="violet.100" color="violet.700" fontSize="2xs" fontWeight="bold" px="sm" py="0.5" borderRadius="full">
                          あなたの空きコマ！
                        </Box>
                      )}
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                      🗓 {formatEventDate(ev.event_date)}・{ev.period}限
                      {ev.location ? '　📍 ' + ev.location : ''}{'　'}🏫 {ev.campus}
                    </Text>
                    {ev.description && (
                      <Text fontSize="sm" color="gray.700" mt="xs">「{ev.description}」</Text>
                    )}
                    <Text fontSize="2xs" color="gray.400" mt="xs">主催: {ev.creator_name}</Text>
                  </Box>
                  <Flex direction="column" align="flex-end" gap="xs" flexShrink={0}>
                    <Button
                      size="sm"
                      borderRadius="full"
                      colorScheme={ev.is_joined ? 'green' : 'violet'}
                      variant={ev.is_joined ? 'solid' : 'outline'}
                      onClick={() => handleToggleJoin(ev.id)}
                    >
                      {ev.is_joined ? '✅ 参加中' : '👍 参加する'}
                    </Button>
                    <Text fontSize="xs" color="gray.500">{ev.participant_count}人が参加</Text>
                    {ev.creator_id === user?.id && (
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDeleteEvent(ev.id)}>
                        削除
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
