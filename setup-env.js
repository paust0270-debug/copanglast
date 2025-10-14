#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Supabase 환경 변수 설정 도우미');
console.log('=====================================\n');

const envPath = path.join(__dirname, '.env.local');

// .env.local 파일이 이미 존재하는지 확인
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local 파일이 이미 존재합니다.');
  rl.question('덮어쓰시겠습니까? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('설정을 취소했습니다.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Supabase 프로젝트 정보를 입력해주세요.\n');
  
  rl.question('1. Supabase Project URL (예: https://abc123.supabase.co): ', (url) => {
    if (!url || !url.includes('supabase.co')) {
      console.log('❌ 올바른 Supabase URL을 입력해주세요.');
      rl.close();
      return;
    }
    
    rl.question('2. Supabase Anon Key (anon public): ', (key) => {
      if (!key || key.length < 20) {
        console.log('❌ 올바른 API 키를 입력해주세요.');
        rl.close();
        return;
      }
      
      // 환경 변수 파일 생성
      const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}

# Development Environment
NODE_ENV=development

# Generated on: ${new Date().toISOString()}
`;

      try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ .env.local 파일이 성공적으로 생성되었습니다!');
        console.log(`📁 파일 위치: ${envPath}`);
        console.log('\n🔧 다음 단계:');
        console.log('1. npm run dev 로 개발 서버 시작');
        console.log('2. http://localhost:3000/supabase-test 접속하여 연결 테스트');
        console.log('3. Supabase SQL Editor에서 supabase-schema.sql 실행');
        
      } catch (error) {
        console.error('❌ 파일 생성 중 오류가 발생했습니다:', error.message);
      }
      
      rl.close();
    });
  });
}

rl.on('close', () => {
  process.exit(0);
});
