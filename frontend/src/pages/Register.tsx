import { useState } from 'react';
import { Box, Flex, VStack, Heading, Input, Button, Text } from '@yamada-ui/react';
import { API_ENDPOINTS, apiPost } from '../lib/api';

const FACULTY_OPTIONS = [
  '文学部',
  '法学部',
  '経済学部',
  '経営学部',
  'データサイエンス学部',
  '情報通信工学部',
  '工学部',
  '教育学部',
  '社会学部',
  'グローバル学部',
  'アントレプレナーシップ学部',
  'ウェルネス学部',
  '薬学部',
  '看護学部',
  '人間科学部',
];

const YEAR_OPTIONS = ['1年', '2年', '3年', '4年'];

const CAMPUS_OPTIONS = ['有明キャンパス', '武蔵野キャンパス'];

export default function Register({ onRegister, onGoLogin }: { onRegister: (user: any) => void; onGoLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [faculty, setFaculty] = useState('');
  const [year, setYear] = useState('');
  const [campus, setCampus] = useState('有明キャンパス');
  const [circle, setCircle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // フロントでもドメイン簡易チェック
    if (!email.toLowerCase().endsWith('@stu.musashino-u.ac.jp')) {
      setError('武蔵野大学の学生メール（@stu.musashino-u.ac.jp）のみ登録できます。');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiPost<{ success: boolean; user?: any; message?: string }>(API_ENDPOINTS.register, {
        username,
        email,
        password,
        faculty: faculty + (year ? year : ''),
        campus,
        circle,
      });

      if (res.success && res.user) {
        onRegister(res.user);
      } else {
        setError(res.message || '登録に失敗しました。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サーバーとの通信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p="md">
      <Box bg="white" p="xl" borderRadius="xl" boxShadow="md" w="full" maxW="420px">
        <VStack as="form" onSubmit={handleSubmit} gap="md">
          <Box textAlign="center" mb="sm">
            <Heading as="h1" size="lg" color="blue.500" mb="xs">CampusLoop</Heading>
            <Text color="gray.500" fontSize="sm">新規アカウント登録</Text>
          </Box>

          {error && (
            <Box bg="red.50" color="red.500" p="sm" borderRadius="md" w="full">
              <Text fontSize="sm">{error}</Text>
            </Box>
          )}

          <Box w="full">
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">ユーザー名</Text>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例: campus_taro"
              required
            />
          </Box>

          <Box w="full">
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">
              大学メールアドレス
              <Text as="span" fontSize="xs" color="blue.400" fontWeight="normal" ml="xs">
                (@stu.musashino-u.ac.jp のみ)
              </Text>
            </Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例: m2312345@stu.musashino-u.ac.jp"
              required
            />
          </Box>

          <Box w="full">
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">パスワード（6文字以上）</Text>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </Box>

          <Flex gap="sm" w="full">
            <Box flex={2}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">学部</Text>
              <Box
                as="select"
                value={faculty}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFaculty(e.target.value)}
                w="full"
                p="sm"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                fontSize="sm"
              >
                <option value="">学部を選択</option>
                {FACULTY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Box>
            </Box>
            <Box flex={1}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">学年</Text>
              <Box
                as="select"
                value={year}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setYear(e.target.value)}
                w="full"
                p="sm"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                fontSize="sm"
              >
                <option value="">学年</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Box>
            </Box>
          </Flex>

          <Box w="full">
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">キャンパス</Text>
            <Box
              as="select"
              value={campus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCampus(e.target.value)}
              w="full"
              p="sm"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
              fontSize="sm"
            >
              {CAMPUS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Box>
          </Box>

          <Box w="full">
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">サークル（任意）</Text>
            <Input
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
              placeholder="例: 軽音サークル"
            />
          </Box>

          <Button type="submit" colorScheme="blue" w="full" mt="md" loading={isLoading}>
            アカウントを作成
          </Button>

          <Flex align="center" gap="xs" mt="sm">
            <Text fontSize="sm" color="gray.500">すでにアカウントをお持ちの方は</Text>
            <Text
              as="button"
              type="button"
              fontSize="sm"
              color="blue.500"
              fontWeight="bold"
              onClick={onGoLogin}
              cursor="pointer"
              bg="none"
              border="none"
              p="0"
            >
              ログイン
            </Text>
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
}
