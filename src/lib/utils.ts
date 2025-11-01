import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRank(rank: number | null): string {
  if (rank === null) return '미확인';
  return `${rank}위`;
}

export function getRankChangeIcon(change: number | null): string {
  if (change === null) return '➖';
  if (change < 0) return '🔼'; // 순위 상승 (숫자 감소)
  if (change > 0) return '🔽'; // 순위 하락 (숫자 증가)
  return '➖'; // 변화 없음
}

export function getRankChangeColor(change: number | null): string {
  if (change === null) return 'text-gray-500';
  if (change < 0) return 'text-green-600'; // 순위 상승
  if (change > 0) return 'text-red-600'; // 순위 하락
  return 'text-gray-500'; // 변화 없음
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateRandomRank(min: number = 1, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 밀리초를 제거한 타임스탬프 생성 함수 (created_at과 동일한 형태)
export function getTimestampWithoutMs(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 한국 시간(KST) 기준으로 잔여기간 계산 (시간대 차이 해결)
export function calculateRemainingTimeKST(
  createdAt: string,
  usageDays: number
): {
  days: number;
  hours: number;
  minutes: number;
  string: string;
} {
  // 🔥 현재 시간을 명시적으로 한국 시간(KST)으로 계산
  // Vercel 서버는 UTC 시간대이므로 한국시간으로 변환 필요
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (9시간 = 9 * 60 * 60 * 1000 밀리초)
  const kstNow = new Date(now.getTime() + kstOffset);

  // 🔥 created_at을 Date 객체로 변환
  const createdDate = new Date(createdAt);

  // 🔥 created_at이 UTC로 저장되어 있다면 한국시간으로 변환
  // Supabase는 일반적으로 UTC로 저장하므로 한국시간으로 변환
  const createdDateKST = new Date(createdDate.getTime() + kstOffset);

  // 만료일 계산 (created_at + usage_days, 72시간 방식)
  // 예: 3일이면 등록일부터 72시간 후 만료
  const expiryDate = new Date(
    createdDateKST.getTime() + usageDays * 24 * 60 * 60 * 1000
  );

  // 잔여 시간 계산 (밀리초) - 한국시간 기준으로 계산
  const remainingMs = Math.max(0, expiryDate.getTime() - kstNow.getTime());

  // 잔여 시간을 일, 시간, 분으로 변환
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  // 잔여기간 문자열 생성 - 정확한 카운팅
  let remainingTimeString = '';
  if (remainingMs > 0) {
    if (days > 0) {
      remainingTimeString += `${days}일`;
    }
    if (hours > 0) {
      remainingTimeString += (remainingTimeString ? ' ' : '') + `${hours}시간`;
    }
    if (minutes > 0) {
      remainingTimeString += (remainingTimeString ? ' ' : '') + `${minutes}분`;
    }
  } else {
    remainingTimeString = '만료됨';
  }

  return {
    days,
    hours,
    minutes,
    string: remainingTimeString || '0분',
  };
}

export function calculateTrafficKST(createdAt: string | null): number {
  if (!createdAt) return 0;

  // KST 현재 시간
  const now = new Date();
  const kstOffset = 9 * 60; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);

  // 오늘 자정 KST
  const kstMidnight = new Date(kstNow);
  kstMidnight.setHours(0, 0, 0, 0);

  // 슬롯 생성 시간 KST 변환
  const slotCreated = new Date(createdAt);
  const kstCreated = new Date(slotCreated.getTime() + kstOffset * 60 * 1000);

  // 카운팅 시작 시간 결정
  let countStartTime: Date;

  if (kstCreated < kstMidnight) {
    // 어제 이전 생성 → 오늘 자정부터
    countStartTime = kstMidnight;
  } else {
    // 오늘 생성 → 생성 시간부터
    countStartTime = kstCreated;
  }

  // 경과 시간 계산 (분 단위)
  const elapsedMs = kstNow.getTime() - countStartTime.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);

  // 음수 값 방지 (생성 시간이 미래인 경우 0으로 처리)
  const safeElapsedMinutes = Math.max(0, elapsedMinutes);

  // 12분마다 1씩 증가, 최대 120
  const traffic = Math.min(Math.floor(safeElapsedMinutes / 12), 120);

  return traffic;
}

// 작업 시작 시간을 기준으로 트래픽 계산하는 새로운 함수
export function calculateTrafficFromWorkStart(
  workStartTime: string | null
): number {
  if (!workStartTime) return 0;

  // KST 현재 시간
  const now = new Date();
  const kstOffset = 9 * 60; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);

  // 오늘 자정 KST
  const kstMidnight = new Date(kstNow);
  kstMidnight.setHours(0, 0, 0, 0);

  // 작업 시작 시간 KST 변환
  const workStart = new Date(workStartTime);
  const kstWorkStart = new Date(workStart.getTime() + kstOffset * 60 * 1000);

  // 카운팅 시작 시간 결정
  let countStartTime: Date;

  if (kstWorkStart < kstMidnight) {
    // 어제 이전 시작 → 오늘 자정부터
    countStartTime = kstMidnight;
  } else {
    // 오늘 시작 → 작업 시작 시간부터
    countStartTime = kstWorkStart;
  }

  // 경과 시간 계산 (분 단위)
  const elapsedMs = kstNow.getTime() - countStartTime.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);

  // 음수 값 방지 (작업 시작 시간이 미래인 경우 0으로 처리)
  const safeElapsedMinutes = Math.max(0, elapsedMinutes);

  // 12분마다 1씩 증가, 최대 120
  const traffic = Math.min(Math.floor(safeElapsedMinutes / 12), 120);

  return traffic;
}

// 트래픽 카운터 관련 함수들
export function getKSTDate(): Date {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + kstOffset * 60000);
}

export function getKSTMidnight(): Date {
  const kstNow = getKSTDate();
  const midnight = new Date(kstNow);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
}

export function calculateTrafficCounter(): number {
  const kstNow = getKSTDate();
  const midnight = getKSTMidnight();

  // 자정부터 경과된 시간 (분 단위)
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - midnight.getTime()) / (60 * 1000)
  );

  // 12분마다 1씩 증가, 최대 120까지
  const traffic = Math.min(Math.floor(elapsedMinutes / 12), 120);

  return Math.max(0, traffic);
}

export function getNextTrafficUpdate(): number {
  const kstNow = getKSTDate();
  const currentMinute = kstNow.getMinutes();

  // 다음 12분 단위까지 남은 시간 계산
  const nextUpdate = ((Math.floor(currentMinute / 12) + 1) * 12) % 60;
  const remainingMinutes = nextUpdate - currentMinute;

  return remainingMinutes > 0 ? remainingMinutes : 12;
}

export function getTrafficResetTime(): string {
  const kstNow = getKSTDate();
  const tomorrow = new Date(kstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const remainingMs = tomorrow.getTime() - kstNow.getTime();
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return `${hours}시간 ${minutes}분`;
}

// 기준점부터 트래픽 카운터 계산 (슬롯 등록/삭제 기준)
export function calculateTrafficFromResetTime(
  resetTime: string | null
): number {
  if (!resetTime) {
    // 기준점이 없으면 자정 기준으로 계산
    return calculateTrafficCounter();
  }

  const kstNow = getKSTDate();
  const resetDate = new Date(resetTime);

  // 기준점부터 경과된 시간 (분 단위)
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - resetDate.getTime()) / (60 * 1000)
  );

  // 12분마다 1씩 증가, 최대 120까지
  const traffic = Math.min(Math.floor(elapsedMinutes / 12), 120);

  return Math.max(0, traffic);
}

// 다음 업데이트까지 남은 시간 계산 (기준점 기준)
export function getNextTrafficUpdateFromReset(
  resetTime: string | null
): number {
  if (!resetTime) {
    return getNextTrafficUpdate();
  }

  const kstNow = getKSTDate();
  const resetDate = new Date(resetTime);
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - resetDate.getTime()) / (60 * 1000)
  );

  // 다음 12분 단위까지 남은 시간
  const nextUpdate =
    (Math.floor(elapsedMinutes / 12) + 1) * 12 - elapsedMinutes;

  return nextUpdate;
}

// 슬롯별 생명주기 관련 함수들
export function calculateSlotTraffic(createdAt: string): number {
  // 🔥 한국 시간(KST) 기준으로 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset);

  const createdDate = new Date(createdAt);
  // 🔥 created_at이 UTC로 저장되어 있다면 한국시간으로 변환
  const createdDateKST = new Date(createdDate.getTime() + kstOffset);

  // 슬롯 생성 시점부터 경과된 시간 (분 단위) - 한국시간 기준
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - createdDateKST.getTime()) / (60 * 1000)
  );

  // 12분마다 1씩 증가, 최대 120까지 (24시간 = 1440분)
  const traffic = Math.min(Math.floor(elapsedMinutes / 12), 120);

  return Math.max(0, traffic);
}

export function getSlotRemainingTime(createdAt: string): string {
  // 🔥 한국 시간(KST) 기준으로 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset);

  const createdDate = new Date(createdAt);
  // 🔥 created_at이 UTC로 저장되어 있다면 한국시간으로 변환
  const createdDateKST = new Date(createdDate.getTime() + kstOffset);

  // 슬롯 생성 시점부터 경과된 시간 (분 단위) - 한국시간 기준
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - createdDateKST.getTime()) / (60 * 1000)
  );

  // 24시간(1440분) 후 만료
  const totalLifetime = 1440; // 24시간
  const remainingMinutes = Math.max(0, totalLifetime - elapsedMinutes);

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (remainingMinutes <= 0) {
    return '만료됨';
  }

  return `${hours}시간 ${minutes}분`;
}

export function isSlotExpired(createdAt: string): boolean {
  // 🔥 한국 시간(KST) 기준으로 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset);

  const createdDate = new Date(createdAt);
  // 🔥 created_at이 UTC로 저장되어 있다면 한국시간으로 변환
  const createdDateKST = new Date(createdDate.getTime() + kstOffset);

  // 슬롯 생성 시점부터 경과된 시간 (분 단위) - 한국시간 기준
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - createdDateKST.getTime()) / (60 * 1000)
  );

  // 24시간(1440분) 후 만료
  return elapsedMinutes >= 1440;
}

export function getNextSlotTrafficUpdate(createdAt: string): number {
  // 🔥 한국 시간(KST) 기준으로 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
  const kstNow = new Date(now.getTime() + kstOffset);

  const createdDate = new Date(createdAt);
  // 🔥 created_at이 UTC로 저장되어 있다면 한국시간으로 변환
  const createdDateKST = new Date(createdDate.getTime() + kstOffset);

  // 슬롯 생성 시점부터 경과된 시간 (분 단위) - 한국시간 기준
  const elapsedMinutes = Math.floor(
    (kstNow.getTime() - createdDateKST.getTime()) / (60 * 1000)
  );

  // 다음 12분 단위까지 남은 시간
  const nextUpdate =
    (Math.floor(elapsedMinutes / 12) + 1) * 12 - elapsedMinutes;

  return nextUpdate;
}
