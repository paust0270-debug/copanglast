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
export function calculateRemainingTimeKST(createdAt: string, usageDays: number): {
  days: number;
  hours: number;
  minutes: number;
  string: string;
} {
  // 현재 시간 (한국 시간 기준)
  const now = new Date();
  
  // created_at을 로컬 시간으로 해석 (DB에 한국시간으로 저장되어 있음)
  const createdDate = new Date(createdAt);
  
  // 만료일 계산 (created_at + usage_days, 72시간 방식)
  // 예: 3일이면 등록일부터 72시간 후 만료
  const expiryDate = new Date(
    createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000
  );
  
  // 잔여 시간 계산 (밀리초)
  const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
  
  // 잔여 시간을 일, 시간, 분으로 변환
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
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
    string: remainingTimeString || '0분'
  };
}