/**
 * キャンパス内限定機能（誘う・チャット）のための位置情報チェック
 *
 * ボタンを押した瞬間だけ端末のGPSを1回取得し、自分のキャンパスから
 * 半径 CAMPUS_RADIUS_METERS 以内にいるかを確認する。常時監視はしない。
 */

// 各キャンパスの座標（Web検索で取得した実際の緯度経度）
export const CAMPUS_COORDS: Record<string, { lat: number; lng: number }> = {
  有明キャンパス: { lat: 35.630679, lng: 139.786832 },
  武蔵野キャンパス: { lat: 35.717821, lng: 139.548616 },
};

// 判定半径（仮）。GPSの誤差を考慮してやや広めに設定。
export const CAMPUS_RADIUS_METERS = 2500;

export type CampusCheckFailureReason = 'unsupported' | 'denied' | 'unavailable' | 'out_of_range' | 'unknown_campus';

export type CampusCheckResult =
  | { ok: true }
  | { ok: false; reason: CampusCheckFailureReason };

// 2地点間の距離（メートル）をHaversine公式で計算
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球の半径(m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  });
}

/**
 * 指定キャンパスの半径内に今いるかを1回だけ確認する。
 * 誘う／応答／チャット送信のボタンを押した瞬間にのみ呼び出すこと。
 */
export async function checkWithinCampusRadius(campus: string | null | undefined): Promise<CampusCheckResult> {
  const target = campus ? CAMPUS_COORDS[campus] : undefined;
  if (!target) {
    return { ok: false, reason: 'unknown_campus' };
  }
  if (!('geolocation' in navigator)) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const pos = await getCurrentPosition();
    const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, target.lat, target.lng);
    return dist <= CAMPUS_RADIUS_METERS ? { ok: true } : { ok: false, reason: 'out_of_range' };
  } catch (err) {
    if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
      return { ok: false, reason: 'denied' };
    }
    return { ok: false, reason: 'unavailable' };
  }
}

// 判定結果に対応するユーザー向けメッセージ
export function campusCheckMessage(reason: CampusCheckFailureReason): string {
  switch (reason) {
    case 'out_of_range':
      return 'キャンパス外にいるため、この操作はできません。';
    case 'denied':
      return '位置情報の利用が許可されていないため、この操作はできません。ブラウザの設定をご確認ください。';
    case 'unsupported':
    case 'unavailable':
      return '位置情報を取得できませんでした。この操作にはキャンパス内での位置情報が必要です。';
    case 'unknown_campus':
      return 'プロフィールにキャンパスが設定されていないため、この操作はできません。';
    default:
      return 'この操作はキャンパス内でのみ利用できます。';
  }
}
