/**
 * 슬롯 타입 정규화 및 변형 관리 유틸리티
 */

/**
 * 슬롯 타입을 한글 버전으로 정규화
 * @param slotType - 원본 슬롯 타입 (영문 또는 한글)
 * @returns 정규화된 한글 슬롯 타입
 */
export function normalizeSlotType(slotType: string | null | undefined): string {
  if (!slotType) return '쿠팡'; // 기본값

  const slotTypeMap: Record<string, string> = {
    // 쿠팡
    coupang: '쿠팡',
    // 쿠팡VIP
    coupangVIP: '쿠팡VIP',
    coupangvip: '쿠팡VIP',
    CoupangVIP: '쿠팡VIP',
    // 쿠팡APP
    coupangAPP: '쿠팡APP',
    coupangapp: '쿠팡APP',
    CoupangAPP: '쿠팡APP',
    // 네이버쇼핑
    naverShopping: '네이버쇼핑',
    navershopping: '네이버쇼핑',
    NaverShopping: '네이버쇼핑',
    // 플레이스
    place: '플레이스',
    Place: '플레이스',
    // 오늘의집
    todayHome: '오늘의집',
    todayhome: '오늘의집',
    TodayHome: '오늘의집',
    // 알리
    aliExpress: '알리',
    aliexpress: '알리',
    AliExpress: '알리',
    // 쿠팡순위체크
    coupangRank: '쿠팡순위체크',
    coupangrank: '쿠팡순위체크',
    CoupangRank: '쿠팡순위체크',
    // N쇼핑순위체크
    naverRank: 'N쇼핑순위체크',
    naverrank: 'N쇼핑순위체크',
    NaverRank: 'N쇼핑순위체크',
    // N플레이스순위체크
    placeRank: 'N플레이스순위체크',
    placerank: 'N플레이스순위체크',
    PlaceRank: 'N플레이스순위체크',
  };

  // 이미 한글인 경우 그대로 반환
  if (slotTypeMap[slotType]) {
    return slotTypeMap[slotType];
  }

  // 매핑이 없으면 원본 반환 (이미 한글일 수 있음)
  return slotType;
}

/**
 * 슬롯 타입의 모든 변형을 반환 (조회 시 사용)
 * @param slotType - 정규화된 한글 슬롯 타입
 * @returns 가능한 모든 변형 배열 (한글 + 영문 변형들)
 */
export function getSlotTypeVariants(slotType: string): string[] {
  const variantMap: Record<string, string[]> = {
    쿠팡: ['쿠팡', 'coupang'],
    쿠팡VIP: ['쿠팡VIP', 'coupangVIP', 'coupangvip', 'CoupangVIP'],
    쿠팡APP: ['쿠팡APP', 'coupangAPP', 'coupangapp', 'CoupangAPP'],
    네이버쇼핑: [
      '네이버쇼핑',
      'naverShopping',
      'navershopping',
      'NaverShopping',
    ],
    플레이스: ['플레이스', 'place', 'Place'],
    오늘의집: ['오늘의집', 'todayHome', 'todayhome', 'TodayHome'],
    알리: ['알리', 'aliExpress', 'aliexpress', 'AliExpress'],
    쿠팡순위체크: ['쿠팡순위체크', 'coupangRank', 'coupangrank', 'CoupangRank'],
    N쇼핑순위체크: ['N쇼핑순위체크', 'naverRank', 'naverrank', 'NaverRank'],
    N플레이스순위체크: [
      'N플레이스순위체크',
      'placeRank',
      'placerank',
      'PlaceRank',
    ],
  };

  // 정규화된 타입으로 변형 찾기
  const normalized = normalizeSlotType(slotType);
  return variantMap[normalized] || [normalized];
}
