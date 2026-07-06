import { useState } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Input } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LoggedInUser } from '../App';

export default function StatusSetting({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();
  console.log(user);
  const [status, setStatus] = useState('free');
  const [comment, setComment] = useState('学食の奥の席にいます〜');
  const [duration, setDuration] = useState('1');

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" gap="sm" mb="sm">
        <IconButton icon={<X />} variant="ghost" onClick={() => navigate(-1)} aria-label="閉じる" />
        <Heading as="h2" size="md">今の「ヒマ度」を設定</Heading>
      </Flex>

      <VStack gap="md" align="stretch">
        <Box p="md" border="1px solid" borderColor={status === 'free' ? 'green.500' : 'gray.200'} borderRadius="md" bg={status === 'free' ? 'green.50' : 'white'} cursor="pointer" onClick={() => setStatus('free')}>
          <Flex align="center" gap="sm">
            <input type="radio" checked={status === 'free'} readOnly />
            <Box>
              <Text fontWeight="bold">🟢 誰でもおいで！（暇）</Text>
              <Text fontSize="xs" color="gray.500" mt="xs">└ マッチ一覧の一番上に表示され、誰でも誘える</Text>
            </Box>
          </Flex>
        </Box>

        <Box p="md" border="1px solid" borderColor={status === 'chat' ? 'orange.500' : 'gray.200'} borderRadius="md" bg={status === 'chat' ? 'orange.50' : 'white'} cursor="pointer" onClick={() => setStatus('chat')}>
          <Flex align="center" gap="sm">
            <input type="radio" checked={status === 'chat'} readOnly />
            <Box>
              <Text fontWeight="bold">🟡 作業中だけど喋れる（ゆる募）</Text>
              <Text fontSize="xs" color="gray.500" mt="xs">└ 気軽に話しかけてOKな緩募集ステータス</Text>
            </Box>
          </Flex>
        </Box>

        <Box p="md" border="1px solid" borderColor={status === 'busy' ? 'red.500' : 'gray.200'} borderRadius="md" bg={status === 'busy' ? 'red.50' : 'white'} cursor="pointer" onClick={() => setStatus('busy')}>
          <Flex align="center" gap="sm">
            <input type="radio" checked={status === 'busy'} readOnly />
            <Box>
              <Text fontWeight="bold">🔴 ガチ勉強中（そっとしておいて）</Text>
              <Text fontSize="xs" color="gray.500" mt="xs">└ 一覧には載るが「誘う」ボタンは非表示</Text>
            </Box>
          </Flex>
        </Box>
      </VStack>

      <Box w="full" h="1px" bg="gray.200" />

      <Box>
        <Text fontSize="sm" fontWeight="bold" mb="sm">✍ 一言コメント（任意）</Text>
        <Input placeholder="例: 学食の奥の席にいます〜" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Box>

      <Box>
        <Text fontSize="sm" fontWeight="bold" mb="sm">⏱ このステータスの有効時間</Text>
        <Flex align="center" gap="sm">
          <Box as="select" p="xs" border="1px solid" borderColor="gray.200" borderRadius="md" value={duration} onChange={(e: any) => setDuration(e.target.value)} w="120px">
            <option value="1">1 時間</option>
            <option value="2">2 時間</option>
            <option value="3">3 時間</option>
          </Box>
          <Text fontSize="sm" color="gray.500">（自動でOFFに）</Text>
        </Flex>
      </Box>

      <Button colorScheme="blue" size="lg" mt="md" onClick={() => navigate(-1)}>
        このステータスで公開する
      </Button>
    </VStack>
  );
}
