import { Box, Flex, VStack, Heading, Text, Avatar, Button, IconButton } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { LoggedInUser } from '../App';

export default function MatchList({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();
  console.log(user);

  const groups = [
    {
      title: '誰でもおいで！（暇）',
      count: 3,
      color: 'green.500',
      candidates: [
        { id: 1, name: 'タクヤ', dept: '経済学部', club: '軽音サークル', comment: '学食でだべってる、誰か来て〜' },
        { id: 3, name: '服飾サークル', dept: '3年生', club: '5人が空きコマ中', comment: '新歓準備してます、見学歓迎！' },
      ],
      showInvite: true,
    },
    {
      title: '作業中だけど喋れる（ゆる募）',
      count: 1,
      color: 'orange.500',
      candidates: [
        { id: 2, name: 'ユイ', dept: '文学部', club: '', comment: '図書館2階で課題中' },
      ],
      showInvite: true,
    },
    {
      title: 'ガチ勉強中（そっとしておいて）',
      count: 2,
      color: 'red.500',
      candidates: [],
      showInvite: false,
    }
  ];

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" gap="sm" mb="sm">
        <IconButton icon={<ChevronLeft />} variant="ghost" onClick={() => navigate(-1)} aria-label="戻る" />
        <Heading as="h2" size="md">3限のマッチ候補 (13:00〜14:30)</Heading>
      </Flex>

      <VStack gap="xl" align="stretch">
        {groups.map((group, index) => (
          <Box key={index}>
            <Flex align="center" justify="space-between" mb="sm">
              <Flex align="center" gap="xs">
                <Box w="12px" h="12px" borderRadius="full" bg={group.color} />
                <Text fontWeight="bold">{group.title}</Text>
              </Flex>
              <Text color="gray.500" fontSize="sm">[{group.count}人]</Text>
            </Flex>

            <Box w="full" h="1px" bg="gray.200" mb="md" />

            {group.candidates.length > 0 ? (
              <VStack gap="md" align="stretch">
                {group.candidates.map((candidate) => (
                  <Flex key={candidate.id} justify="space-between" align="flex-start" gap="md">
                    <Flex gap="md" flex="1">
                      <Avatar name={candidate.name} size="md" />
                      <Box>
                        <Flex align="baseline" gap="sm" mb="xs">
                          <Text fontWeight="bold">{candidate.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {candidate.dept} {candidate.club ? `/ ${candidate.club}` : ''}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" color="gray.700">「{candidate.comment}」</Text>
                      </Box>
                    </Flex>
                    {group.showInvite && (
                      <Button size="sm" colorScheme="blue" variant="outline">
                        誘う
                      </Button>
                    )}
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500" textAlign="center" py="sm">
                タップして折りたたみを展開
              </Text>
            )}
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}
