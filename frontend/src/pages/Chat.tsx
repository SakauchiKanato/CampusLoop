import { useState } from 'react';
import { Box, Flex, VStack, Heading, Text, IconButton, Input, Button, Avatar, Wrap } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import type { LoggedInUser } from '../App';

export default function Chat({ user }: { user: LoggedInUser | null }) {
  const navigate = useNavigate();
  console.log(user);
  
  const [messages, setMessages] = useState([
    { id: 1, sender: 'other', text: '一緒にお昼行かない？', time: '13:05' },
    { id: 2, sender: 'me', text: 'いいよ！今どこ？', time: '13:06' },
    { id: 3, sender: 'other', text: '学食2階、奥の窓側席にいるよ', time: '13:06' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const quickReplies = ['今行く！', '5分待って', 'ごめん、また今度'];

  return (
    <VStack gap="0" h="calc(100vh - 150px)" align="stretch">
      <Flex align="center" gap="sm" mb="md">
        <IconButton icon={<ChevronLeft />} variant="ghost" onClick={() => navigate(-1)} aria-label="戻る" />
        <Heading as="h2" size="md">タクヤさんとのやりとり</Heading>
      </Flex>

      <Box w="full" h="1px" bg="gray.200" mb="md" />

      <VStack flex="1" overflowY="auto" gap="md" px="xs" pb="md">
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <Flex key={msg.id} justify={isMe ? 'flex-end' : 'flex-start'} gap="sm" align="flex-end">
              {!isMe && <Avatar name="タクヤ" size="sm" />}
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
                  <Text fontSize="sm">{msg.text}</Text>
                </Box>
                <Text fontSize="2xs" color="gray.400" mt="xs">{msg.time}</Text>
              </Flex>
            </Flex>
          );
        })}
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
            onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText)}
          />
          <IconButton icon={<Send size={18} />} colorScheme="blue" onClick={() => handleSend(inputText)} aria-label="送信" />
        </Flex>
      </Box>
    </VStack>
  );
}
