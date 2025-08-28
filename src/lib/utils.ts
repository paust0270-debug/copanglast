import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
