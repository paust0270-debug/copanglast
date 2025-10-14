import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true, // 빌드 중 ESLint 무시
  },
  typescript: {
    ignoreBuildErrors: true, // 빌드 중 TypeScript 오류 무시
  },
  experimental: {
    // Turbopack 설정 제거 (Next.js 15에서 문제 발생)
  },
  // swcMinify 제거 (Next.js 15에서 더 이상 필요하지 않음)
};

export default nextConfig;
