import { useState } from 'react';
import { Box, Flex, VStack, Heading, Input, Button, Text, Select } from '@yamada-ui/react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiPut } from '../lib/api';
import type { LoggedInUser } from '../App';

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

const CAMPUS_OPTIONS = [
  '有明キャンパス',
  '武蔵野キャンパス',
];

interface ProfileEditProps {
  user: LoggedInUser;
  onProfileUpdate: (updatedUser: LoggedInUser) => void;
}

export default function ProfileEdit({ user, onProfileUpdate }: ProfileEditProps) {
  const navigate = useNavigate();

  // 学部と学年を分離する（例: "経営学部3年" → faculty="経営学部", year="3年"）
  const parseFaculty = (rawFaculty: string) => {
    const yearMatch = rawFaculty.match(/(\d年)$/);
    if (yearMatch) {
      return {
        faculty: rawFaculty.replace(yearMatch[0], '').trim(),
        year: yearMatch[0],
      };
    }
    return { faculty: rawFaculty, year: '' };
  };

  const parsed = parseFaculty(user?.faculty || '');

  const [faculty, setFaculty] = useState(parsed.faculty);
  const [year, setYear] = useState(parsed.year);
  const [circle, setCircle] = useState(user?.circle || '');
  const [campus, setCampus] = useState(user?.campus || '有明キャンパス');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await apiPut<{ success: boolean; user?: LoggedInUser; message?: string }>(
        API_ENDPOINTS.profile,
        {
          user_id: user.id,
          faculty: faculty + (year ? year : ''),
          circle,
          campus,
        }
      );

      if (res.success && res.user) {
        onProfileUpdate(res.user);
        setSuccessMsg('プロフィールを更新しました！');
        setTimeout(() => navigate('/mypage'), 1200);
      } else {
        setError(res.message || 'プロフィールの更新に失敗しました。');
      }
    } catch (err) {
      setError('サーバーとの通信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack gap="lg" align="stretch">
      <Flex align="center" justify="space-between">
        <Heading as="h2" size="md">プロフィール編集</Heading>
        <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => navigate('/mypage')}>
          キャンセル
        </Button>
      </Flex>

      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        p="lg"
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack gap="md" align="stretch">
          {error && (
            <Box bg="red.50" color="red.500" p="sm" borderRadius="md">
              <Text fontSize="sm">{error}</Text>
            </Box>
          )}
          {successMsg && (
            <Box bg="green.50" color="green.600" p="sm" borderRadius="md">
              <Text fontSize="sm">{successMsg}</Text>
            </Box>
          )}

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">ユーザー名</Text>
            <Input value={user?.username || ''} isDisabled bg="gray.50" />
            <Text fontSize="xs" color="gray.400" mt="xs">ユーザー名は変更できません</Text>
          </Box>

          <Flex gap="sm">
            <Box flex={2}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">学部</Text>
              <Select value={faculty} onChange={(val) => setFaculty(val as string)} placeholder="学部を選択">
                {FACULTY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </Box>
            <Box flex={1}>
              <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">学年</Text>
              <Select value={year} onChange={(val) => setYear(val as string)} placeholder="学年">
                {['1年', '2年', '3年', '4年'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </Box>
          </Flex>

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">サークル</Text>
            <Input
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
              placeholder="例: 軽音サークル"
            />
          </Box>

          <Box>
            <Text as="label" fontSize="sm" fontWeight="bold" mb="xs" display="block">キャンパス</Text>
            <Select value={campus} onChange={(val) => setCampus(val as string)}>
              {CAMPUS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Box>

          <Button type="submit" colorScheme="blue" w="full" mt="sm" loading={isLoading}>
            変更を保存
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}
