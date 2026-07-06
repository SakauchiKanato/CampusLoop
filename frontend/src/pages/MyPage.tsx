import { Box, Flex, VStack, Heading, Text, Button, Avatar, Badge, Wrap } from '@yamada-ui/react';
import type { LoggedInUser } from '../App';

export default function MyPage({ user, onLogout }: { user: LoggedInUser | null, onLogout: () => void }) {
  const friends = [
    { id: 1, name: 'タクヤ' },
    { id: 2, name: 'ユイ' },
    { id: 3, name: 'ケンタ' },
    { id: 4, name: '服飾サークル' },
  ];

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" justify="space-between" mb="sm">
        <Heading as="h2" size="md">マイページ</Heading>
        <Button size="sm" variant="outline" colorScheme="gray" onClick={onLogout}>ログアウト</Button>
      </Flex>

      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p="md" boxShadow="sm">
        <Flex gap="md" align="center">
          <Avatar size="lg" name={user?.username || '山田 太郎'} />
          <Box>
            <Heading as="h3" size="sm" mb="xs">
              {user?.username || '山田 太郎'} <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal">（{user?.faculty || '経済学部3年'}）</Text>
            </Heading>
            <Text fontSize="sm" color="gray.600">所属サークル： {user?.circle || '軽音サークル'}</Text>
          </Box>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="sm" display="flex" alignItems="center" gap="xs" mb="sm">
          📊 今月のマッチ実績
        </Heading>
        <Box bg="blue.50" borderRadius="md" p="md">
          <Flex justify="space-around" textAlign="center">
            <Box>
              <Text fontSize="xs" color="gray.600">マッチ回数</Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">12<Text as="span" fontSize="sm">回</Text></Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.600">誘った回数</Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">7<Text as="span" fontSize="sm">回</Text></Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.600">誘われた回数</Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">5<Text as="span" fontSize="sm">回</Text></Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      <Box>
        <Heading as="h3" size="sm" display="flex" alignItems="center" gap="xs" mb="sm">
          🕒 最近のマッチ履歴
        </Heading>
        <VStack gap="sm" align="stretch">
          <Flex justify="space-between" align="center" py="sm" borderBottom="1px solid" borderColor="gray.100">
            <Box>
              <Badge colorScheme="blue" mb="xs">7/3(金) 3限</Badge>
              <Text fontSize="sm">タクヤさんと学食で合流</Text>
            </Box>
          </Flex>
          <Flex justify="space-between" align="center" py="sm" borderBottom="1px solid" borderColor="gray.100">
            <Box>
              <Badge colorScheme="blue" mb="xs">7/1(水) 5限</Badge>
              <Text fontSize="sm">ユイさんと図書館で勉強</Text>
            </Box>
          </Flex>
        </VStack>
      </Box>

      <Box>
        <Flex justify="space-between" align="center" mb="sm">
          <Heading as="h3" size="sm" display="flex" alignItems="center" gap="xs">
            👥 フレンド一覧（32人）
          </Heading>
          <Button size="xs" colorScheme="blue" variant="outline">
            + 友達を追加
          </Button>
        </Flex>
        
        <Wrap gap="md" mt="sm">
          {friends.map(friend => (
            <VStack key={friend.id} gap="xs" align="center">
              <Avatar name={friend.name} size="md" />
              <Text fontSize="xs" lineClamp={1} w="50px" textAlign="center">{friend.name}</Text>
            </VStack>
          ))}
          <VStack gap="xs" align="center">
            <Avatar icon={<Text fontSize="xl">...</Text>} bg="gray.100" color="gray.500" size="md" />
            <Text fontSize="xs">もっと見る</Text>
          </VStack>
        </Wrap>
      </Box>
    </VStack>
  );
}
