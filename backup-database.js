require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 백업할 테이블 목록
const tables = [
  'user_profiles',
  'slots',
  'slot_status',
  'slot_coupangvip',
  'slot_coupangapp',
  'slot_naver',
  'slot_place',
  'slot_todayhome',
  'slot_aliexpress',
  'slot_copangrank',
  'slot_naverrank',
  'slot_placerank',
  'settlements',
  'settlement_history',
  'settlement_requests',
  'notices',
  'distributors',
  'traffic',
  'keywords',
];

async function backupTable(tableName) {
  console.log(`📦 ${tableName} 백업 중...`);

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`❌ ${tableName} 백업 실패:`, error.message);
      return { tableName, success: false, error: error.message, count: 0 };
    }

    const count = data?.length || 0;
    console.log(`✅ ${tableName}: ${count}개 레코드 백업 완료`);

    return { tableName, success: true, data, count };
  } catch (error) {
    console.error(`❌ ${tableName} 백업 예외:`, error.message);
    return { tableName, success: false, error: error.message, count: 0 };
  }
}

async function backupAllTables() {
  console.log('🚀 데이터베이스 전체 백업 시작...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `database-backup-${timestamp}`);

  // 백업 디렉토리 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const results = [];

  // 모든 테이블 백업
  for (const tableName of tables) {
    const result = await backupTable(tableName);
    results.push(result);

    if (result.success && result.data) {
      // JSON 파일로 저장
      const filePath = path.join(backupDir, `${tableName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2), 'utf-8');
    }

    // 너무 빠르게 요청하지 않도록 약간의 딜레이
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 백업 결과 요약
  console.log('\n📊 백업 결과 요약:');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);

  console.log(`✅ 성공: ${successful.length}개 테이블`);
  console.log(`❌ 실패: ${failed.length}개 테이블`);
  console.log(`📝 총 레코드: ${totalRecords}개`);
  console.log(`📁 백업 위치: ${backupDir}`);

  if (failed.length > 0) {
    console.log('\n⚠️  실패한 테이블:');
    failed.forEach(r => {
      console.log(`   - ${r.tableName}: ${r.error}`);
    });
  }

  // 백업 메타데이터 저장
  const metadata = {
    timestamp: new Date().toISOString(),
    backupDir,
    results: results.map(r => ({
      tableName: r.tableName,
      success: r.success,
      count: r.count,
      error: r.error,
    })),
    summary: {
      totalTables: tables.length,
      successful: successful.length,
      failed: failed.length,
      totalRecords,
    },
  };

  const metadataPath = path.join(backupDir, '_metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log('\n✅ 데이터베이스 백업 완료!');
  console.log(`📄 메타데이터: ${metadataPath}`);

  return metadata;
}

// 백업 실행
backupAllTables()
  .then(metadata => {
    console.log('\n🎉 모든 백업 작업이 완료되었습니다!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 백업 중 오류 발생:', error);
    process.exit(1);
  });
