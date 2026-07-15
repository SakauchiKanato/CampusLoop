/**
 * 「今いる場所」タグの共通定義
 *
 * バックエンド（backend/api/status.php の LOCATION_OPTIONS）と
 * 一致させること。
 */
export const LOCATION_OPTIONS = ['学食', '図書館', '3号館ラウンジ', '芝生広場', 'その他'] as const;

export type LocationTag = (typeof LOCATION_OPTIONS)[number];
