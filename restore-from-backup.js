const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
    supabaseKey ? '설정됨' : '없음'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreFromBackup() {
  console.log('🔄 백업 데이터 복원 시작...');

  const backupDir = path.join(__dirname, 'backup_2025-09-17T10-37-15-730Z');

  try {
    // 1. 기존 데이터 삭제 (역순으로)
    console.log('🗑️ 기존 데이터 삭제 중...');

    const tablesToClear = [
      'settlement_history',
      'settlement_requests',
      'slot_add_forms',
      'settlements',
      'slots',
      'notices',
      'distributors',
      'customers',
      'user_profiles',
    ];

    for (const table of tablesToClear) {
      try {
        const { error } = await supabase.from(table).delete().neq('id', 0);
        if (error) {
          console.log(`⚠️ ${table} 테이블 삭제 중 오류 (무시):`, error.message);
        } else {
          console.log(`✅ ${table} 테이블 데이터 삭제 완료`);
        }
      } catch (err) {
        console.log(`⚠️ ${table} 테이블 삭제 중 예외 (무시):`, err.message);
      }
    }

    // 2. 백업 데이터 복원
    console.log('📥 백업 데이터 복원 중...');

    const tablesToRestore = [
      'user_profiles',
      'distributors',
      'customers',
      'notices',
      'slots',
      'settlements',
      'settlement_history',
      'settlement_requests',
      'slot_add_forms',
    ];

    for (const table of tablesToRestore) {
      const backupFile = path.join(backupDir, `${table}.json`);

      if (!fs.existsSync(backupFile)) {
        console.log(`⚠️ ${table} 백업 파일이 없습니다: ${backupFile}`);
        continue;
      }

      try {
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

        if (!Array.isArray(backupData) || backupData.length === 0) {
          console.log(`ℹ️ ${table} 테이블: 복원할 데이터가 없습니다`);
          continue;
        }

        console.log(
          `📥 ${table} 테이블 복원 중... (${backupData.length}개 레코드)`
        );

        // 배치로 삽입 (100개씩)
        const batchSize = 100;
        for (let i = 0; i < backupData.length; i += batchSize) {
          const batch = backupData.slice(i, i + batchSize);

          const { data, error } = await supabase
            .from(table)
            .insert(batch)
            .select();

          if (error) {
            console.error(
              `❌ ${table} 테이블 배치 ${Math.floor(i / batchSize) + 1} 삽입 실패:`,
              error.message
            );
          } else {
            console.log(
              `✅ ${table} 테이블 배치 ${Math.floor(i / batchSize) + 1} 삽입 완료 (${batch.length}개)`
            );
          }
        }

        console.log(`✅ ${table} 테이블 복원 완료`);
      } catch (err) {
        console.error(`❌ ${table} 테이블 복원 실패:`, err.message);
      }
    }

    console.log('🎉 백업 데이터 복원 완료!');

    // 3. 복원 결과 확인
    console.log('🔍 복원 결과 확인 중...');

    for (const table of tablesToRestore) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (error) {
          console.log(`⚠️ ${table} 테이블 확인 실패:`, error.message);
        } else {
          console.log(`📊 ${table} 테이블: ${data?.length || 0}개 레코드`);
        }
      } catch (err) {
        console.log(`⚠️ ${table} 테이블 확인 중 예외:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ 백업 복원 중 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
restoreFromBackup();
