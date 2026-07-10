/**
 * 時限（コマ）まわりの共通定義
 *
 * 1限 08:50-10:30 / 2限 10:40-12:10 / 3限 13:10-14:50
 * 4限 15:00-16:40 / 5限 16:50-18:30
 */

// 各時限の終了時刻（分換算）
export const PERIOD_END_MINUTES: Record<number, number> = {
  1: 10 * 60 + 30,
  2: 12 * 60 + 20,
  3: 14 * 60 + 50,
  4: 16 * 60 + 40,
  5: 18 * 60 + 30,
};

/**
 * 現在時刻から「いま進行中 or 次に来る時限」を返す。
 * 例: 15:30 → 4限（15:00-16:40 の最中）。18:30 以降は null（今日の授業は終了）。
 */
export const getCurrentPeriod = (): number | null => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const p of [1, 2, 3, 4, 5]) {
    if (mins < PERIOD_END_MINUTES[p]) return p;
  }
  return null;
};
