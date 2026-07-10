import { useState } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Input, NativeSelect, Textarea } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiPost } from '../lib/api';

const CAMPUS_OPTIONS = ['有明キャンパス', '武蔵野キャンパス'];

const PERIOD_LABELS: Record<number, string> = {
  1: '1限 (08:50-10:30)',
  2: '2限 (10:40-12:10)',
  3: '3限 (13:10-14:50)',
  4: '4限 (15:00-16:40)',
  5: '5限 (16:50-18:30)',
};

// 今日の日付を YYYY-MM-DD で返す
const todayStr = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function EventCreate({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(todayStr());
  const [period, setPeriod] = useState('3');
  const [location, setLocation] = useState('');
  const [campus, setCampus] = useState(user?.campus || '有明キャンパス');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const res = await apiPost<{ success: boolean; message?: string }>(API_ENDPOINTS.events, {
        creator_id: user.id,
        title,
        description,
        event_date: eventDate,
        period: Number(period),
        location,
        campus,
      });
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'イベントの作成に失敗しました。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サーバーとの通信に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" justify="space-between" mb="sm">
        <IconButton icon={<X />} variant="ghost" onClick={() => navigate(-1)} aria-label="閉じる" />
        <Heading as="h2" size="md">🎪 イベントを作る</Heading>
        <Box w="40px" />
      </Flex>

      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        p="lg"
        borderRadius="2xl"
        boxShadow="0 4px 20px rgba(99,102,241,0.10)"
      >
        <VStack gap="md" align="stretch">
          {error && (
            <Box bg="red.50" color="red.500" p="sm" borderRadius="md">
              <Text fontSize="sm">{error}</Text>
            </Box>
          )}

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">イベント名</Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ロハスカフェで100円朝食！"
              maxLength={100}
              required
            />
          </Box>

          <Flex gap="sm">
            <Box flex={1}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">開催日</Text>
              <Input
                type="date"
                value={eventDate}
                min={todayStr()}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </Box>
            <Box flex={1}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">時限</Text>
              <NativeSelect.Root value={period} onChange={(e) => setPeriod(e.target.value)}>
                {[1, 2, 3, 4, 5].map((p) => (
                  <NativeSelect.Option key={p} value={String(p)}>{PERIOD_LABELS[p]}</NativeSelect.Option>
                ))}
              </NativeSelect.Root>
            </Box>
          </Flex>

          <Flex gap="sm">
            <Box flex={1}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">場所</Text>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: ロハスカフェ"
              />
            </Box>
            <Box flex={1}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">キャンパス</Text>
              <NativeSelect.Root value={campus} onChange={(e) => setCampus(e.target.value)}>
                {CAMPUS_OPTIONS.map((c) => (
                  <NativeSelect.Option key={c} value={c}>{c}</NativeSelect.Option>
                ))}
              </NativeSelect.Root>
            </Box>
          </Flex>

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">ひとこと説明（任意）</Text>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: ロハスカフェが朝食がないあなたへ100円で提供するよ！🍚"
              rows={3}
            />
          </Box>

          <Button type="submit" colorScheme="violet" w="full" mt="sm" borderRadius="full" loading={saving}>
            🎉 イベントを公開する
          </Button>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            公開したイベントは登録している全員に表示されます（開催日を過ぎると自動で消えます）
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}
