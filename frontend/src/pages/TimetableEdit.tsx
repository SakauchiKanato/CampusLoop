import { useState } from 'react';
import { Box, Flex, VStack, Heading, Text, Button, IconButton, Input } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LoggedInUser } from '../App';

export default function TimetableEdit({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();
  console.log(user);
  const [selectedDay, setSelectedDay] = useState('月');

  const [timetable, setTimetable] = useState([
    { period: 1, time: '09:00-10:30', isFree: true, subject: '' },
    { period: 2, time: '10:40-12:10', isFree: false, subject: '経済学入門' },
    { period: 3, time: '13:00-14:30', isFree: true, subject: '' },
    { period: 4, time: '14:40-16:10', isFree: true, subject: '' },
    { period: 5, time: '16:20-17:50', isFree: true, subject: '' },
  ]);

  const handleStatusChange = (index: number, val: string) => {
    const newTimetable = [...timetable];
    newTimetable[index].isFree = val === 'free';
    setTimetable(newTimetable);
  };

  const handleSubjectChange = (index: number, val: string) => {
    const newTimetable = [...timetable];
    newTimetable[index].subject = val;
    setTimetable(newTimetable);
  };

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" justify="space-between" mb="sm">
        <IconButton icon={<X />} variant="ghost" onClick={() => navigate(-1)} aria-label="閉じる" />
        <Heading as="h2" size="md">時間割の編集</Heading>
        <Button size="sm" colorScheme="blue">保存する</Button>
      </Flex>

      <Box>
        <Text fontSize="sm" fontWeight="bold" mb="xs">曜日を選択</Text>
        <Flex gap="sm">
          {['月', '火', '水', '木', '金'].map(day => (
            <Button key={day} size="sm" variant={selectedDay === day ? 'solid' : 'outline'} colorScheme={selectedDay === day ? 'blue' : 'gray'} onClick={() => setSelectedDay(day)} flex="1">
              {day}
            </Button>
          ))}
        </Flex>
      </Box>

      <Box w="full" h="1px" bg="gray.200" />

      <VStack gap="md" align="stretch">
        {timetable.map((item, index) => (
          <Box key={item.period} p="sm" border="1px solid" borderColor="gray.200" borderRadius="md">
            <Flex justify="space-between" align="center" mb="sm">
              <Text fontWeight="bold">{item.period}限 <Text as="span" fontSize="xs" color="gray.500" fontWeight="normal">({item.time})</Text></Text>
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

      <Box w="full" h="1px" bg="gray.200" />

      <Flex align="center" justify="space-between" mt="sm">
        <Flex align="center" gap="xs">
          <Text>🔒 この時間割を見せる相手</Text>
        </Flex>
        <Box as="select" p="xs" border="1px solid" borderColor="gray.200" borderRadius="md">
          <option value="friends">友達のみ</option>
          <option value="all">全員</option>
          <option value="none">非公開</option>
        </Box>
      </Flex>
    </VStack>
  );
}
