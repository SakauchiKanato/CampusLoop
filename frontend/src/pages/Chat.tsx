import { useState, useEffect, useRef } from 'react';
import { Box, Flex, VStack, Heading, Text, IconButton, Input, Button, Avatar, Wrap } from '@yamada-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import type { LoggedInUser } from '../App';
import { API_ENDPOINTS, apiGet, apiPost } from '../lib/api';

interface ApiMessage {
  message_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

interface MatchInfo {
  from_user: number;
  to_user: number;
  from_username: string;
  to_username: string;
  status: string;
  period: number;
}

// "2026-07-09 13:05:12" → "13:05"
const formatTime = (createdAt: string) => {
  const m = createdAt.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};

export default function Chat({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const partnerName = matchInfo
    ? (matchInfo.from_user === user?.id ? matchInfo.to_username : matchInfo.from_username)
    : '';

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      const res = await apiGet<{ success: boolean; messages?: ApiMessage[]; match_info?: MatchInfo }>(
        `${API_ENDPOINTS.chat}?match_id=${matchId}`
      );
      if (res.success) {
        setMessages(res.messages ?? []);
        if (res.match_info) setMatchInfo(res.match_info);
      }
    } catch {
      // ポーリング中の一時的なエラーは無視
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み＋5秒ごとにポーリングして相手のメッセージを受信
  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 5000);
    return () => clearInterval(timer);
  }, [matchId]);

  // 新着メッセージで一番下までスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !matchId || !user || sending) return;
    setSending(true);
    try {
      const res = await apiPost<{ success: boolean; message?: ApiMessage }>(API_ENDPOINTS.chat, {
        match_id: Number(matchId),
        sender_id: user.id,
        content: text.trim(),
      });
      if (res.success) {
        setInputText('');
        fetchMessages();
      }
    } catch {
      alert('メッセージの送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  const quickReplies = ['今行く！', '5分待って', 'ここにいるから来て！', 'ごめん、また今度'];

  return (
    <VStack gap="0" h="calc(100vh - 150px)" align="stretch">
      <Flex align="center" gap="sm" mb="md">
        <IconButton icon={<ChevronLeft />} variant="ghost" onClick={() => navigate(-1)} aria-label="戻る" />
        <Heading as="h2" size="md">
          {partnerName ? `${partnerName}さんとのやりとり` : 'やりとり'}
          {matchInfo && (
            <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal" ml="sm">
              {matchInfo.period}限の約束
            </Text>
          )}
        </Heading>
      </Flex>

      <Text fontSize="xs" color="gray.400" textAlign="center" mb="sm">
        ⏳ このチャットは当日限りです（翌日に自動で消えます）
      </Text>

      <Box w="full" h="1px" bg="gray.200" mb="md" />

      <VStack flex="1" overflowY="auto" gap="md" px="xs" pb="md">
        {loading ? (
          <Text fontSize="sm" color="gray.400" textAlign="center" py="lg">読み込み中…</Text>
        ) : messages.length === 0 ? (
          <Text fontSize="sm" color="gray.400" textAlign="center" py="lg">まだメッセージがありません</Text>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <Flex key={msg.message_id} w="full" justify={isMe ? 'flex-end' : 'flex-start'} gap="sm" align="flex-end">
                {!isMe && <Avatar name={msg.sender_name} size="sm" />}
                <Flex direction="column" align={isMe ? 'flex-end' : 'flex-start'} maxW="70%">
                  <Box
                    bg={isMe ? 'blue.500' : 'gray.100'}
                    color={isMe ? 'white' : 'black'}
                    px="md"
                    py="sm"
                    borderRadius="xl"
                    borderBottomRightRadius={isMe ? 'sm' : 'xl'}
                    borderBottomLeftRadius={!isMe ? 'sm' : 'xl'}
                  >
                    <Text fontSize="sm">{msg.content}</Text>
                  </Box>
                  <Text fontSize="2xs" color="gray.400" mt="xs">{formatTime(msg.created_at)}</Text>
                </Flex>
              </Flex>
            );
          })
        )}
        <Box ref={bottomRef} />
      </VStack>

      <Box pt="sm" borderTop="1px solid" borderColor="gray.200">
        <Box mb="sm">
          <Text fontSize="xs" color="gray.500" mb="xs">💬 定型メッセージ</Text>
          <Wrap gap="xs">
            {quickReplies.map((reply, i) => (
              <Button key={i} size="xs" variant="outline" onClick={() => handleSend(reply)}>
                {reply}
              </Button>
            ))}
          </Wrap>
        </Box>

        <Flex gap="sm">
          <Input
            placeholder="メッセージを入力..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          />
          <IconButton
            icon={<Send size={18} />}
            colorScheme="blue"
            onClick={() => handleSend(inputText)}
            aria-label="送信"
            disabled={sending || !inputText.trim()}
          />
        </Flex>
      </Box>
    </VStack>
  );
}
