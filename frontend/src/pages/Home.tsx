import { Box, Flex, VStack, Heading, Text, Grid, GridItem, Avatar, Button } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import type { LoggedInUser } from '../App';

export default function Home({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();
  console.log(user);

  const timetable = [
    { period: 1, subject: '英語', isFree: false },
    { period: 2, subject: '経済', isFree: false },
    { period: 3, subject: '', isFree: true },
    { period: 4, subject: 'ゼミ', isFree: false },
    { period: 5, subject: '', isFree: true },
  ];

  const matchCandidates = [
    { id: 1, name: 'タクヤ', status: 'free', statusLabel: '暇', avatar: '' },
    { id: 2, name: 'ユイ', status: 'chat', statusLabel: 'ゆる募', avatar: '' },
    { id: 3, name: '服飾サークル・3人', status: 'free', statusLabel: '暇', avatar: '' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'green.500';
      case 'chat': return 'orange.500';
      case 'busy': return 'red.500';
      default: return 'gray.500';
    }
  };

  return (
    <VStack gap="lg" align="stretch">
      <Box bg="white" p="md" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb="md">
          <Heading as="h2" size="md" display="flex" alignItems="center" gap="xs">
            📅 今日の時間割 (月曜日)
          </Heading>
        </Flex>

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
                bg={item.isFree ? 'blue.50' : 'gray.100'}
                border="1px solid"
                borderColor={item.isFree ? 'blue.200' : 'gray.200'}
                borderRadius="md"
                p="xs"
              >
                {item.isFree ? (
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

        <Button w="full" variant="outline" colorScheme="gray" onClick={() => navigate('/timetable/edit')}>
          タップして時間割を編集
        </Button>
      </Box>

      <Box>
        <Heading as="h2" size="md" display="flex" alignItems="center" gap="xs" mb="md">
          🔥 3限のマッチ候補 (4人が空きコマ中)
        </Heading>

        <Grid templateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap="md">
          {matchCandidates.map((candidate) => (
            <Box key={candidate.id} border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="sm" p="md" display="flex" flexDirection="column" alignItems="center" gap="sm">
              <Avatar name={candidate.name} src={candidate.avatar} size="md" />
              <Box textAlign="center">
                <Text fontSize="sm" fontWeight="bold" lineClamp={1}>{candidate.name}</Text>
                <Flex align="center" justify="center" gap="xs" mt="xs">
                  <Box w="8px" h="8px" borderRadius="full" bg={getStatusColor(candidate.status)} />
                  <Text fontSize="xs" color="gray.600">{candidate.statusLabel}</Text>
                </Flex>
              </Box>
              <Button size="sm" colorScheme="blue" w="full" mt="auto">
                誘う
              </Button>
            </Box>
          ))}
        </Grid>
      </Box>
    </VStack>
  );
}
