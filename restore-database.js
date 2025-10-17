require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function restoreTable(tableName, backupDir) {
  console.log(`📦 ${tableName} 복원 중...`);

  const filePath = path.join(backupDir, `${tableName}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${tableName}: 백업 파일이 없습니다. 건너뜁니다.`);
    return { tableName, success: false, error: '백업 파일 없음', count: 0 };
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data || data.length === 0) {
      console.log(`⚠️  ${tableName}: 복원할 데이터가 없습니다.`);
      return { tableName, success: true, count: 0 };
    }

    console.log(`   ${data.length}개 레코드 발견`);

    // 기존 데이터 삭제 여부 확인 (사용자 입력)
    const deleteExisting = await question(
      `   기존 ${tableName} 데이터를 삭제하시겠습니까? (y/N): `
    );

    if (deleteExisting.toLowerCase() === 'y') {
      console.log(`   기존 데이터 삭제 중...`);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

      if (deleteError) {
        console.error(`   ❌ 기존 데이터 삭제 실패:`, deleteError.message);
      } else {
        console.log(`   ✅ 기존 데이터 삭제 완료`);
      }
    }

    // 데이터 삽입 (배치 처리)
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(
          `   ❌ 배치 ${Math.floor(i / batchSize) + 1} 삽입 실패:`,
          error.message
        );
      } else {
        inserted += batch.length;
        console.log(`   진행: ${inserted}/${data.length}`);
      }

      // API rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ ${tableName}: ${inserted}개 레코드 복원 완료`);
    return { tableName, success: true, count: inserted };
  } catch (error) {
    console.error(`❌ ${tableName} 복원 예외:`, error.message);
    return { tableName, success: false, error: error.message, count: 0 };
  }
}

async function restoreDatabase() {
  console.log('🚀 데이터베이스 복원 시작...\n');

  // 백업 디렉토리 선택
  const backupDirs = fs
    .readdirSync(__dirname)
    .filter(name => name.startsWith('database-backup-'))
    .sort()
    .reverse();

  if (backupDirs.length === 0) {
    console.error('❌ 백업 디렉토리를 찾을 수 없습니다.');
    rl.close();
    process.exit(1);
  }

  console.log('📁 사용 가능한 백업:');
  backupDirs.forEach((dir, index) => {
    console.log(`   ${index + 1}. ${dir}`);
  });

  const selection = await question('\n복원할 백업 번호를 입력하세요: ');
  const selectedIndex = parseInt(selection) - 1;

  if (selectedIndex < 0 || selectedIndex >= backupDirs.length) {
    console.error('❌ 잘못된 선택입니다.');
    rl.close();
    process.exit(1);
  }

  const backupDir = path.join(__dirname, backupDirs[selectedIndex]);
  console.log(`\n📂 백업 디렉토리: ${backupDir}\n`);

  // 메타데이터 읽기
  const metadataPath = path.join(backupDir, '_metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log('📊 백업 정보:');
    console.log(`   생성일시: ${metadata.timestamp}`);
    console.log(`   테이블 수: ${metadata.summary.totalTables}`);
    console.log(`   총 레코드: ${metadata.summary.totalRecords}\n`);
  }

  const confirm = await question('⚠️  복원을 진행하시겠습니까? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('복원이 취소되었습니다.');
    rl.close();
    process.exit(0);
  }

  console.log('\n');

  // 백업 파일 목록
  const backupFiles = fs
    .readdirSync(backupDir)
    .filter(name => name.endsWith('.json') && name !== '_metadata.json')
    .map(name => name.replace('.json', ''));

  const results = [];

  // 모든 테이블 복원
  for (const tableName of backupFiles) {
    const result = await restoreTable(tableName, backupDir);
    results.push(result);
    console.log('');
  }

  // 복원 결과 요약
  console.log('\n📊 복원 결과 요약:');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);

  console.log(`✅ 성공: ${successful.length}개 테이블`);
  console.log(`❌ 실패: ${failed.length}개 테이블`);
  console.log(`📝 총 복원 레코드: ${totalRecords}개`);

  if (failed.length > 0) {
    console.log('\n⚠️  실패한 테이블:');
    failed.forEach(r => {
      console.log(`   - ${r.tableName}: ${r.error}`);
    });
  }

  console.log('\n✅ 데이터베이스 복원 완료!');
  rl.close();
}

// 복원 실행
restoreDatabase()
  .then(() => {
    console.log('\n🎉 모든 복원 작업이 완료되었습니다!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 복원 중 오류 발생:', error);
    rl.close();
    process.exit(1);
  });
