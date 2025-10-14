#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env.local');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Supabase 환경 변수 자동 설정을 시작합니다...\n');

  // 기존 .env.local 파일 확인
  if (fs.existsSync(envPath)) {
    console.log('📁 기존 .env.local 파일이 발견되었습니다.');
    const overwrite = await question('기존 파일을 덮어쓰시겠습니까? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ 설정이 취소되었습니다.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Supabase 프로젝트 정보를 입력해주세요:');
  console.log('(Supabase 대시보드 → Settings → API에서 확인할 수 있습니다)\n');

  const supabaseUrl = await question('🔗 Supabase URL (예: https://your-project.supabase.co): ');
  const supabaseAnonKey = await question('🔑 Supabase Anon Key: ');

  // 입력 검증
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ URL과 Anon Key는 필수입니다.');
    rl.close();
    return;
  }

  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.log('❌ 올바른 Supabase URL 형식이 아닙니다.');
    rl.close();
    return;
  }

  // .env.local 파일 생성
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Generated on ${new Date().toISOString()}
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local 파일이 성공적으로 생성되었습니다!');
    console.log(`📁 파일 위치: ${envPath}`);
    
    console.log('\n📋 다음 단계:');
    console.log('1. Supabase 대시보드에서 SQL 편집기를 열어주세요');
    console.log('2. emergency-schema-fix.sql 파일의 내용을 복사하여 실행하세요');
    console.log('3. npm run dev로 개발 서버를 시작하세요');
    
  } catch (error) {
    console.error('❌ 파일 생성 중 오류가 발생했습니다:', error.message);
  }

  rl.close();
}

// 스크립트 실행
setupEnvironment().catch(console.error);
