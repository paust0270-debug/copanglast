require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 백업할 테이블 목록
const tables = [
  'users',
  'user_profiles', 
  'customers',
  'distributors',
  'slots',
  'slot_status',
  'keywords',
  'slot_add_forms',
  'slot_rank_history',
  'settlements'
];

async function backupTable(tableName) {
  try {
    console.log(`📊 ${tableName} 테이블 백업 중...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`❌ ${tableName} 테이블 조회 실패:`, error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`⚠️ ${tableName} 테이블에 데이터가 없습니다.`);
      return `-- ${tableName} 테이블에 데이터가 없습니다.\n`;
    }

    console.log(`✅ ${tableName} 테이블에서 ${data.length}개 레코드 백업 완료`);

    // INSERT 문 생성
    let sql = `-- ${tableName} 테이블 데이터 백업 (${data.length}개 레코드)\n`;
    sql += `-- 생성일: ${new Date().toISOString()}\n\n`;

    // 컬럼명 추출
    const columns = Object.keys(data[0]);
    const columnList = columns.join(', ');

    // 데이터를 INSERT 문으로 변환
    data.forEach((row, index) => {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === 'boolean') return value;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return value;
      }).join(', ');

      sql += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
    });

    sql += '\n';
    return sql;

  } catch (error) {
    console.error(`❌ ${tableName} 테이블 백업 중 오류:`, error);
    return null;
  }
}

async function createDatabaseBackup() {
  console.log('🚀 데이터베이스 백업을 시작합니다...\n');

  let fullSql = `-- 데이터베이스 백업 파일
-- 생성일: ${new Date().toISOString()}
-- 프로젝트: Coupang Rank Checker Web Application
-- 
-- 이 파일은 Supabase 데이터베이스의 모든 데이터를 포함합니다.
-- 복원 시에는 테이블이 이미 존재해야 합니다.
-- 
-- 사용법:
-- 1. Supabase SQL Editor에서 이 파일의 내용을 실행
-- 2. 또는 psql 명령어로 실행: psql -f database-backup.sql
--

`;

  // 각 테이블을 순차적으로 백업
  for (const table of tables) {
    const tableSql = await backupTable(table);
    if (tableSql) {
      fullSql += tableSql;
    }
  }

  // 백업 파일 저장
  const backupFileName = `database-backup-${new Date().toISOString().split('T')[0]}.sql`;
  fs.writeFileSync(backupFileName, fullSql, 'utf8');

  console.log(`\n✅ 데이터베이스 백업 완료!`);
  console.log(`📁 백업 파일: ${backupFileName}`);
  console.log(`📊 총 ${tables.length}개 테이블 처리 완료`);

  return backupFileName;
}

// 스크립트 실행
if (require.main === module) {
  createDatabaseBackup()
    .then((filename) => {
      console.log(`\n🎉 백업이 성공적으로 완료되었습니다: ${filename}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 백업 중 오류가 발생했습니다:', error);
      process.exit(1);
    });
}

module.exports = { createDatabaseBackup };
