/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포를 위한 설정
  output: 'standalone',
  // 이미지 최적화
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

