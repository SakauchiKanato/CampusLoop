import { useState } from 'react';
import { Box, Flex, VStack, Heading, Input, Button, Text } from '@yamada-ui/react';
import { API_ENDPOINTS, apiPost } from '../lib/api';

export default function Login({ onLogin, onGoRegister }: { onLogin: (user: any) => void; onGoRegister?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiPost<{ success: boolean; user?: any; message?: string }>(API_ENDPOINTS.login, {
        username,
        password,
      });

      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message || 'ユーザー名またはパスワードが正しくありません。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サーバーとの通信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p="md">
      <Box bg="white" p="xl" borderRadius="xl" boxShadow="md" w="full" maxW="400px">
        <VStack as="form" onSubmit={handleSubmit} gap="md">
          <Box textAlign="center" mb="md">
            <Heading as="h1" size="lg" color="blue.500" mb="xs">CampusLoop</Heading>
            <Text color="gray.500" fontSize="sm">空きコマを、いちばん楽しい時間に。</Text>
          </Box>

          {error && (
            <Box bg="red.50" color="red.500" p="sm" borderRadius="md">
              <Text fontSize="sm">{error}</Text>
            </Box>
          )}

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">ユーザー名</Text>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ユーザー名を入力" required />
          </Box>

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">パスワード</Text>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワードを入力" required />
          </Box>

          <Button type="submit" colorScheme="blue" w="full" mt="md" loading={isLoading}>
            ログイン
          </Button>

          {onGoRegister && (
            <Flex align="center" justify="center" gap="xs" mt="sm">
              <Text fontSize="sm" color="gray.500">アカウントをお持ちでない方は</Text>
              <Text
                as="button"
                type="button"
                fontSize="sm"
                color="blue.500"
                fontWeight="bold"
                onClick={onGoRegister}
                cursor="pointer"
                bg="none"
                border="none"
                p="0"
              >
                新規登録
              </Text>
            </Flex>
          )}

          <Text fontSize="xs" color="gray.400" textAlign="center" mt="sm">
            同じ大学のキャンパスに通う学生のためのアプリです
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}

