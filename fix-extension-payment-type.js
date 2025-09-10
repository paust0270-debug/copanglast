const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixExtensionPaymentType() {
  try {
    console.log('🔧 연장 내역의 payment_type 수정 시작...');

    // 1. 현재 settlements 테이블의 데이터 확인
    const { data: settlements, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .in('status', ['pending', '승인대기']);

    if (fetchError) {
      console.error('❌ 정산 데이터 조회 오류:', fetchError);
      return;
    }

    console.log('📊 조회된 정산 내역 수:', settlements?.length || 0);

    if (settlements && settlements.length > 0) {
      console.log('📋 정산 내역 샘플:');
      settlements.slice(0, 3).forEach((settlement, index) => {
        console.log(`  ${index + 1}. ID: ${settlement.id}, payment_type: ${settlement.payment_type}, memo: ${settlement.memo}`);
      });
    }

    // 2. 연장 관련 내역 찾기 (memo에 '연장'이 포함된 것들)
    const extensionSettlements = settlements?.filter(settlement => 
      settlement.memo && settlement.memo.includes('연장')
    ) || [];

    console.log('🔍 연장 관련 정산 내역 수:', extensionSettlements.length);

    if (extensionSettlements.length > 0) {
      console.log('📋 연장 관련 정산 내역:');
      extensionSettlements.forEach((settlement, index) => {
        console.log(`  ${index + 1}. ID: ${settlement.id}, payment_type: ${settlement.payment_type}, memo: ${settlement.memo}`);
      });

      // 3. 연장 관련 내역의 payment_type을 'extension'으로 업데이트
      const extensionIds = extensionSettlements.map(s => s.id);
      
      const { data: updatedData, error: updateError } = await supabase
        .from('settlements')
        .update({ payment_type: 'extension' })
        .in('id', extensionIds)
        .select();

      if (updateError) {
        console.error('❌ payment_type 업데이트 오류:', updateError);
        return;
      }

      console.log('✅ 연장 내역 payment_type 업데이트 완료:', updatedData?.length || 0, '개');
      
      if (updatedData && updatedData.length > 0) {
        console.log('📋 업데이트된 내역:');
        updatedData.forEach((settlement, index) => {
          console.log(`  ${index + 1}. ID: ${settlement.id}, payment_type: ${settlement.payment_type}, memo: ${settlement.memo}`);
        });
      }
    } else {
      console.log('ℹ️ 연장 관련 정산 내역이 없습니다.');
    }

    // 4. 최종 확인
    console.log('\n🔍 최종 확인:');
    const { data: finalCheck } = await supabase
      .from('settlements')
      .select('id, payment_type, memo')
      .in('status', ['pending', '승인대기'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (finalCheck && finalCheck.length > 0) {
      console.log('📋 최근 정산 내역 (상위 5개):');
      finalCheck.forEach((settlement, index) => {
        console.log(`  ${index + 1}. ID: ${settlement.id}, payment_type: ${settlement.payment_type}, memo: ${settlement.memo}`);
      });
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
}

fixExtensionPaymentType();

