const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSididieDistributor() {
  console.log('🔄 sididie 사용자의 distributor 정보 업데이트 시작...');

  try {
    // 1. 현재 sididie 사용자 정보 확인
    const { data: currentUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', 'sididie')
      .single();

    if (fetchError) {
      console.error('❌ sididie 사용자 조회 실패:', fetchError.message);
      return;
    }

    console.log('📋 현재 sididie 사용자 정보:', {
      username: currentUser.username,
      name: currentUser.name,
      distributor: currentUser.distributor,
      grade: currentUser.grade,
    });

    // 2. distributor를 "구대판다"로 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        distributor: '구대판다',
        name: '임지영', // 이름도 한글로 수정
      })
      .eq('username', 'sididie')
      .select()
      .single();

    if (updateError) {
      console.error('❌ sididie 사용자 업데이트 실패:', updateError.message);
      return;
    }

    console.log('✅ sididie 사용자 업데이트 완료:', {
      username: updatedUser.username,
      name: updatedUser.name,
      distributor: updatedUser.distributor,
      grade: updatedUser.grade,
    });

    // 3. slots 테이블의 sididie 관련 데이터도 업데이트
    console.log('🔄 slots 테이블의 sididie 데이터 업데이트 중...');

    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('id, customer_id, distributor')
      .eq('customer_id', 'sididie');

    if (slotsError) {
      console.error('❌ slots 데이터 조회 실패:', slotsError.message);
    } else {
      console.log(`📊 sididie 관련 slots 데이터: ${slotsData?.length || 0}개`);

      if (slotsData && slotsData.length > 0) {
        const { error: updateSlotsError } = await supabase
          .from('slots')
          .update({ distributor: '구대판다' })
          .eq('customer_id', 'sididie');

        if (updateSlotsError) {
          console.error(
            '❌ slots 데이터 업데이트 실패:',
            updateSlotsError.message
          );
        } else {
          console.log('✅ slots 데이터 업데이트 완료');
        }
      }
    }

    console.log('🎉 sididie 사용자 distributor 정보 업데이트 완료!');
  } catch (error) {
    console.error('❌ 업데이트 중 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
updateSididieDistributor();
