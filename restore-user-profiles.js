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

async function restoreUserProfiles() {
  console.log('🔄 user_profiles 테이블 복원 시작...');

  const backupDir = path.join(__dirname, 'backup_2025-09-17T10-37-15-730Z');

  try {
    // user_profiles 복원 (ID 포함)
    console.log('📥 user_profiles 테이블 복원 중...');
    const userProfilesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'user_profiles.json'), 'utf8')
    );

    for (const user of userProfilesData) {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(user, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('❌ user_profiles 삽입 실패:', error.message);
      } else {
        console.log(`✅ user_profiles 삽입 완료: ${user.username}`);
      }
    }

    console.log('🎉 user_profiles 테이블 복원 완료!');

    // 복원 결과 확인
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`⚠️ user_profiles 테이블 확인 실패:`, error.message);
    } else {
      console.log(`📊 user_profiles 테이블: ${data?.length || 0}개 레코드`);
    }
  } catch (error) {
    console.error('❌ user_profiles 복원 중 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
restoreUserProfiles();
