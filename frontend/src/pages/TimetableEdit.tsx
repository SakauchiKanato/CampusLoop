import { useState, useEffect } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Input } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiGet, apiPost } from '../lib/api';

const DAYS = ['月', '火', '水', '木', '金'];
const PERIOD_TIMES: Record<number, string> = {
  1: '09:00-10:30',
  2: '10:40-12:10',
  3: '13:00-14:30',
  4: '14:40-16:10',
  5: '16:20-17:50',
};

interface SlotRow {
  period: number;
  isFree: boolean;
  subject: string;
}

interface ApiTimetableRow {
  day_of_week: number;
  period: number;
  subject: string | null;
  is_free: boolean;
}

const emptyDay = (): SlotRow[] =>
  [1, 2, 3, 4, 5].map((p) => ({ period: p, isFree: true, subject: '' }));

export default function TimetableEdit({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();

  // デフォルトは今日の曜日（土日は月曜）
  const todayJs = new Date().getDay();
  const initialDay = todayJs >= 1 && todayJs <= 5 ? todayJs : 1;

  const [selectedDay, setSelectedDay] = useState(initialDay); // 1=月〜5=金
  const [allRows, setAllRows] = useState<ApiTimetableRow[]>([]);
  const [timetable, setTimetable] = useState<SlotRow[]>(emptyDay());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTimetable();
  }, [user]);

  // 曜日切り替え時に該当曜日のデータを反映
  useEffect(() => {
    applyDay(allRows, selectedDay);
  }, [selectedDay, allRows]);

  const applyDay = (rows: ApiTimetableRow[], day: number) => {
    const dayRows = rows.filter((r) => r.day_of_week === day);
    setTimetable(
      [1, 2, 3, 4, 5].map((p) => {
        const found = dayRows.find((r) => r.period === p);
        return found
          ? { period: p, isFree: found.is_free, subject: found.subject ?? '' }
          : { period: p, isFree: true, subject: '' };
      })
    );
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ success: boolean; timetable?: ApiTimetableRow[] }>(
        `${API_ENDPOINTS.timetable}?user_id=${user!.id}`
      );
      if (res.success && res.timetable) {
        setAllRows(res.timetable);
      }
    } catch {
      setMessage({ type: 'error', text: '時間割の読み込みに失敗しました。' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (index: number, val: string) => {
    const newTimetable = [...timetable];
    newTimetable[index] = { ...newTimetable[index], isFree: val === 'free' };
    setTimetable(newTimetable);
  };

  const handleSubjectChange = (index: number, val: string) => {
    const newTimetable = [...timetable];
    newTimetable[index] = { ...newTimetable[index], subject: val };
    setTimetable(newTimetable);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      // 選択中の曜日の5コマをまとめて保存（UPSERT）
      for (const slot of timetable) {
        await apiPost<{ success: boolean }>(API_ENDPOINTS.timetable, {
          user_id: user.id,
          day_of_week: selectedDay,
          period: slot.period,
          subject: slot.isFree ? '' : slot.subject,
          is_free: slot.isFree,
        });
      }
      // ローカルの全曜日データも更新
      const others = allRows.filter((r) => r.day_of_week !== selectedDay);
      const updated: ApiTimetableRow[] = timetable.map((s) => ({
        day_of_week: selectedDay,
        period: s.period,
        subject: s.isFree ? '' : s.subject,
        is_free: s.isFree,
      }));
      setAllRows([...others, ...updated]);
      setMessage({ type: 'success', text: `${DAYS[selectedDay - 1]}曜日の時間割を保存しました！` });
    } catch {
      setMessage({ type: 'error', text: '保存に失敗しました。' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" justify="space-between" mb="sm">
        <IconButton icon={<X />} variant="ghost" onClick={() => navigate(-1)} aria-label="閉じる" />
        <Heading as="h2" size="md">時間割の編集</Heading>
        <Button size="sm" colorScheme="blue" onClick={handleSave} loading={saving}>保存する</Button>
      </Flex>

      {message && (
        <Box
          bg={message.type === 'success' ? 'green.50' : 'red.50'}
          color={message.type === 'success' ? 'green.600' : 'red.500'}
          p="sm"
          borderRadius="md"
        >
          <Text fontSize="sm">{message.text}</Text>
        </Box>
      )}

      <Box>
        <Text fontSize="sm" fontWeight="bold" mb="xs">曜日を選択</Text>
        <Flex gap="sm">
          {DAYS.map((day, i) => (
            <Button
              key={day}
              size="sm"
              variant={selectedDay === i + 1 ? 'solid' : 'outline'}
              colorScheme={selectedDay === i + 1 ? 'blue' : 'gray'}
              onClick={() => setSelectedDay(i + 1)}
              flex="1"
            >
              {day}
            </Button>
          ))}
        </Flex>
      </Box>

      <Box w="full" h="1px" bg="gray.200" />

      {loading ? (
        <Flex justify="center" py="lg"><Text fontSize="sm" color="gray.400">読み込み中…</Text></Flex>
      ) : (
        <VStack gap="md" align="stretch">
          {timetable.map((item, index) => (
            <Box key={item.period} p="sm" border="1px solid" borderColor="gray.200" borderRadius="md">
              <Flex justify="space-between" align="center" mb="sm">
                <Text fontWeight="bold">{item.period}限 <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal">({PERIOD_TIMES[item.period]})</Text></Text>
              </Flex>

              <Flex gap="md" mb={!item.isFree ? 'sm' : '0'}>
                <Box as="label" display="flex" alignItems="center" gap="xs" cursor="pointer">
                  <input type="radio" name={`period-${index}`} value="class" checked={!item.isFree} onChange={() => handleStatusChange(index, 'class')} />
                  <Text fontSize="sm">授業あり</Text>
                </Box>
                <Box as="label" display="flex" alignItems="center" gap="xs" cursor="pointer">
                  <input type="radio" name={`period-${index}`} value="free" checked={item.isFree} onChange={() => handleStatusChange(index, 'free')} />
                  <Text fontSize="sm">空きコマ</Text>
                </Box>
              </Flex>

              {!item.isFree && (
                <Input size="sm" placeholder="科目名 (例: 経済学入門)" value={item.subject} onChange={(e) => handleSubjectChange(index, e.target.value)} />
              )}
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
