#!/usr/bin/env node

/**
 * 쿠팡 상품 순위 확인 실행 스크립트
 * 자연스러운 타이핑과 스크롤링을 통해 상위 100개 상품을 탐색
 */

const { execSync } = require('child_process');
const { program } = require('commander');

// Commander.js 설정
program
  .name('coupang-rank-check')
  .description('쿠팡에서 특정 상품의 순위를 확인하는 도구')
  .version('1.0.0');

program
  .command('check')
  .description('자전거 자물쇠 검색에서 특정 상품 순위 확인')
  .option('-p, --product-id <id>', '확인할 상품번호 (기본값: 8617045901)', '8617045901')
  .option('-h, --headless [mode]', '헤드리스 모드 (기본값: false)', false)
  .option('--debug', '디버그 모드 활성화', false)
  .action(async (options) => {
    console.log('🚀 쿠팡 순위 확인 도구 시작');
    console.log(`🎯 타겟 상품: ${options.productId}`);
    console.log(`🖥️ 헤드리스 모드: ${options.headless ? 'ON' : 'OFF'}`);
    
    try {
      // Playwright 테스트 실행 명령어 구성
      let command = 'npx playwright test test_coupang_rank_checker.spec.js';
      
      if (options.headless) {
        command += ' --project=chromium';
      } else {
        command += ' --headed --project=chromium';
      }
      
      if (options.debug) {
        command += ' --debug';
      }
      
      console.log('\n📝 실행 명령어:', command);
      console.log('⏳ 테스트 실행 중... (최대 5분 소요 예상)\n');
      
      // 환경 변수로 상품 ID 전달
      const env = { ...process.env, TARGET_PRODUCT_ID: options.productId };
      
      // Playwright 테스트 실행
      execSync(command, { 
        stdio: 'inherit', 
        env,
        encoding: 'utf8'
      });
      
      console.log('\n✅ 순위 확인 완료!');
      
    } catch (error) {
      console.error('\n❌ 오류 발생:', error.message);
      
      if (error.status === 1) {
        console.log('\n💡 힌트:');
        console.log('   - 브라우저 드라이버 설치: npx playwright install');
        console.log('   - 네트워크 연결 확인');
        console.log('   - 쿠팡 사이트 접근 가능 여부 확인');
      }
      
      process.exit(1);
    }
  });

program
  .command('install')
  .description('Playwright 브라우저 드라이버 설치')
  .action(() => {
    console.log('📦 Playwright 브라우저 드라이버 설치 중...');
    try {
      execSync('npx playwright install', { stdio: 'inherit' });
      console.log('✅ 브라우저 드라이버 설치 완료!');
    } catch (error) {
      console.error('❌ 설치 실패:', error.message);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('프로젝트 초기 설정')
  .action(() => {
    console.log('🔧 프로젝트 초기 설정 시작...');
    
    try {
      // 1. npm install 실행
      console.log('📦 의존성 패키지 설치 중...');
      execSync('npm install', { stdio: 'inherit' });
      
      // 2. Playwright 브라우저 드라이버 설치
      console.log('🌐 Playwright 브라우저 설치 중...');
      execSync('npx playwright install', { stdio: 'inherit' });
      
      console.log('✅ 초기 설정 완료!');
      console.log('\n📝 사용법:');
      console.log('   npm run check                    # 기본 상품 순위 확인');
      console.log('   npm run check -p 8617045901     # 특정 상품 순위 확인');
      console.log('   npm run check --headless        # 백그라운드에서 실행');
      
    } catch (error) {
      console.error('❌ 설정 실패:', error.message);
      process.exit(1);
    }
  });

// 프로그램 실행
program.parse();

// 명령어가 없는 경우 도움말 표시
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
