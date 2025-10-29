/**
 * Supabase 데이터베이스 백업 스크립트
 * 환경 변수에서 연결 정보를 읽어 모든 테이블의 스키마와 데이터를 백업합니다.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 백업 디렉토리 생성
const backupDir = path.join(__dirname, 'database-backup');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupPath = path.join(backupDir, `backup-${timestamp}`);

if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath, { recursive: true });
}

console.log('📦 데이터베이스 백업을 시작합니다...');
console.log(`📂 백업 경로: ${backupPath}`);

// 주요 테이블 목록 (프로젝트에서 사용하는 테이블들)
const tables = [
  'slots',
  'slot_status',
  'slot_copangrank',
  'slot_naverrank',
  'slot_placerank',
  'settlements',
  'settlement_history',
  'user_profiles',
  'keywords',
  'traffic',
  'notices',
  'distributors',
  'users', // Supabase auth.users는 직접 접근 불가
];

async function backupTableSchema(tableName) {
  try {
    // 테이블 스키마 정보 가져오기 (정보 스키마 쿼리)
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: tableName })
      .catch(async () => {
        // RPC가 없으면 직접 쿼리 시도
        return { data: null, error: { message: 'RPC 함수 없음' } };
      });

    return {
      table: tableName,
      schema: data || null,
      error: error?.message || null,
    };
  } catch (err) {
    return {
      table: tableName,
      schema: null,
      error: err.message,
    };
  }
}

async function backupTableData(tableName) {
  try {
    // 모든 데이터 가져오기 (페이지네이션 처리)
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(
          `  ⚠️  ${tableName} 테이블 데이터 조회 오류:`,
          error.message
        );
        return { table: tableName, data: [], error: error.message };
      }

      if (data) {
        allData = allData.concat(data);
      }

      hasMore = data && data.length === pageSize;
      from += pageSize;
    }

    return {
      table: tableName,
      data: allData,
      count: allData.length,
      error: null,
    };
  } catch (err) {
    console.error(`  ❌ ${tableName} 테이블 백업 중 오류:`, err.message);
    return {
      table: tableName,
      data: [],
      count: 0,
      error: err.message,
    };
  }
}

async function createBackupSummary(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalTables: results.length,
    successfulBackups: results.filter(r => !r.error && r.count > 0).length,
    failedBackups: results.filter(r => r.error).length,
    emptyTables: results.filter(r => !r.error && r.count === 0).length,
    totalRecords: results.reduce((sum, r) => sum + (r.count || 0), 0),
    tables: results.map(r => ({
      table: r.table,
      count: r.count || 0,
      status: r.error ? 'failed' : r.count === 0 ? 'empty' : 'success',
      error: r.error || null,
    })),
  };

  fs.writeFileSync(
    path.join(backupPath, 'backup-summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  return summary;
}

async function main() {
  const results = [];

  // 각 테이블 백업
  for (const tableName of tables) {
    console.log(`\n📋 ${tableName} 테이블 백업 중...`);
    const backup = await backupTableData(tableName);

    if (backup.error) {
      console.log(`  ❌ 실패: ${backup.error}`);
    } else {
      console.log(`  ✅ 성공: ${backup.count}개 레코드`);

      // JSON 파일로 저장
      if (backup.data.length > 0) {
        fs.writeFileSync(
          path.join(backupPath, `${tableName}.json`),
          JSON.stringify(backup.data, null, 2),
          'utf8'
        );
      }
    }

    results.push(backup);
  }

  // 백업 요약 생성
  console.log('\n📊 백업 요약 생성 중...');
  const summary = await createBackupSummary(results);

  // 백업 정보 파일 작성
  const backupInfo = {
    timestamp: summary.timestamp,
    supabaseUrl: supabaseUrl,
    backupPath: backupPath,
    summary: summary,
  };

  fs.writeFileSync(
    path.join(backupPath, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2),
    'utf8'
  );

  // SQL 형태의 INSERT 문 생성 (선택사항)
  console.log('\n💾 SQL INSERT 문 생성 중...');
  let sqlContent = `-- Supabase 데이터베이스 백업\n`;
  sqlContent += `-- 생성 시간: ${summary.timestamp}\n`;
  sqlContent += `-- 프로젝트: ${supabaseUrl}\n\n`;

  for (const result of results) {
    if (result.data && result.data.length > 0) {
      sqlContent += `\n-- ${result.table} 테이블 (${result.count}개 레코드)\n`;
      sqlContent += `-- 주의: 이 SQL은 참고용입니다. 실제 복원 시 스키마를 먼저 생성해야 합니다.\n\n`;

      for (const record of result.data) {
        const columns = Object.keys(record).join(', ');
        const values = Object.values(record)
          .map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (v instanceof Date) return `'${v.toISOString()}'`;
            return String(v);
          })
          .join(', ');

        sqlContent += `INSERT INTO ${result.table} (${columns}) VALUES (${values});\n`;
      }
    }
  }

  fs.writeFileSync(
    path.join(backupPath, 'backup-data.sql'),
    sqlContent,
    'utf8'
  );

  console.log('\n✨ 백업 완료!\n');
  console.log('📊 백업 요약:');
  console.log(`  ✅ 성공: ${summary.successfulBackups}개 테이블`);
  console.log(`  ❌ 실패: ${summary.failedBackups}개 테이블`);
  console.log(`  📭 비어있음: ${summary.emptyTables}개 테이블`);
  console.log(`  📝 총 레코드: ${summary.totalRecords}개`);
  console.log(`\n📂 백업 위치: ${backupPath}`);
  console.log(`\n📄 파일:`);
  console.log(`  - backup-info.json: 백업 정보`);
  console.log(`  - backup-summary.json: 백업 요약`);
  console.log(`  - backup-data.sql: SQL INSERT 문`);
  console.log(`  - *.json: 각 테이블별 데이터 (JSON 형식)`);
}

main().catch(err => {
  console.error('❌ 백업 중 오류 발생:', err);
  process.exit(1);
});
