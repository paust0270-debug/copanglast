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
  
  // 백업 폴더 제외 설정
  webpack: (config, { isServer }) => {
    // 백업 파일들을 빌드에서 완전히 제외
    config.resolve.alias = {
      ...config.resolve.alias,
      // 백업 파일들을 빈 모듈로 대체
      './page_backup_.tsx': false,
      './page_backup_20250831_165903.tsx': false,
    };
    
    // 백업 폴더를 빌드에서 제외
    config.module.rules.push({
      test: /backup_/,
      use: 'null-loader'
    });
    
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/backup_*/**',
        '**/*.backup.*'
      ]
    };
    return config;
  },
};

export default nextConfig;
