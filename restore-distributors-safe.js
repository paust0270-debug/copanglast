const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreDistributorsSafe() {
  console.log('🔄 distributors 테이블 안전 복원 시작...');

  const backupDir = path.join(__dirname, 'backup_2025-09-17T10-37-15-730Z');

  try {
    // distributors 복원 (description 제외)
    console.log('📥 distributors 테이블 복원 중...');
    const distributorsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'distributors.json'), 'utf8')
    );

    for (const distributor of distributorsData) {
      const { description, ...distributorData } = distributor; // description 제외

      const { data, error } = await supabase
        .from('distributors')
        .upsert(distributorData, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('❌ distributors 삽입 실패:', error.message);
      } else {
        console.log(`✅ distributors 삽입 완료: ${distributorData.name}`);
      }
    }

    console.log('🎉 distributors 테이블 복원 완료!');

    // 복원 결과 확인
    const { data, error } = await supabase
      .from('distributors')
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`⚠️ distributors 테이블 확인 실패:`, error.message);
    } else {
      console.log(`📊 distributors 테이블: ${data?.length || 0}개 레코드`);
    }
  } catch (error) {
    console.error('❌ distributors 복원 중 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
restoreDistributorsSafe();
