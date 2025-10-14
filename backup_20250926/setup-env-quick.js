#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

// 제공된 Supabase 정보
const supabaseUrl = 'https://cwsdvgkjptuvbdtxcejt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2R2Z2tqcHR1dmJkdHhjZWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTQ0MzksImV4cCI6MjA3MTk3MDQzOX0.kSKAYjtFWoxHn0PNq6mAZ2OEngeGR7i_FW3V75Hrby8';

async function setupEnvironment() {
  console.log('🚀 Supabase 환경 변수를 자동으로 설정합니다...\n');

  // .env.local 파일 생성
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Generated on ${new Date().toISOString()}
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local 파일이 성공적으로 생성되었습니다!');
    console.log(`📁 파일 위치: ${envPath}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
    
    console.log('\n📋 다음 단계:');
    console.log('1. Supabase 대시보드에서 SQL 편집기를 열어주세요');
    console.log('2. emergency-schema-fix.sql 파일의 내용을 복사하여 실행하세요');
    console.log('3. npm run test:connection으로 연결을 테스트하세요');
    console.log('4. npm run dev로 개발 서버를 시작하세요');
    
  } catch (error) {
    console.error('❌ 파일 생성 중 오류가 발생했습니다:', error.message);
  }
}

// 스크립트 실행
setupEnvironment().catch(console.error);
