const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupSettlementData() {
  console.log('🧹 정산 관련 DB 데이터 전체 삭제');
  console.log('============================================================');

  try {
    // 1. settlements 테이블 데이터 삭제
    console.log('1️⃣ settlements 테이블 데이터 삭제...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*');

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
    } else {
      console.log('현재 settlements 데이터 개수:', settlementsData?.length || 0);
      
      if (settlementsData && settlementsData.length > 0) {
        const { error: deleteError } = await supabase
          .from('settlements')
          .delete()
          .neq('id', 0); // 모든 데이터 삭제

        if (deleteError) {
          console.error('❌ settlements 삭제 오류:', deleteError);
        } else {
          console.log('✅ settlements 테이블 데이터 삭제 완료');
        }
      } else {
        console.log('✅ settlements 테이블이 이미 비어있습니다.');
      }
    }

    // 2. settlement_history 테이블 데이터 삭제
    console.log('\n2️⃣ settlement_history 테이블 데이터 삭제...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*');

    if (historyError) {
      console.error('❌ settlement_history 테이블 조회 오류:', historyError);
    } else {
      console.log('현재 settlement_history 데이터 개수:', historyData?.length || 0);
      
      if (historyData && historyData.length > 0) {
        const { error: deleteError } = await supabase
          .from('settlement_history')
          .delete()
          .neq('id', 0); // 모든 데이터 삭제

        if (deleteError) {
          console.error('❌ settlement_history 삭제 오류:', deleteError);
        } else {
          console.log('✅ settlement_history 테이블 데이터 삭제 완료');
        }
      } else {
        console.log('✅ settlement_history 테이블이 이미 비어있습니다.');
      }
    }

    // 3. settlement_requests 테이블 데이터 삭제
    console.log('\n3️⃣ settlement_requests 테이블 데이터 삭제...');
    const { data: requestsData, error: requestsError } = await supabase
      .from('settlement_requests')
      .select('*');

    if (requestsError) {
      console.error('❌ settlement_requests 테이블 조회 오류:', requestsError);
    } else {
      console.log('현재 settlement_requests 데이터 개수:', requestsData?.length || 0);
      
      if (requestsData && requestsData.length > 0) {
        const { error: deleteError } = await supabase
          .from('settlement_requests')
          .delete()
          .neq('id', 0); // 모든 데이터 삭제

        if (deleteError) {
          console.error('❌ settlement_requests 삭제 오류:', deleteError);
        } else {
          console.log('✅ settlement_requests 테이블 데이터 삭제 완료');
        }
      } else {
        console.log('✅ settlement_requests 테이블이 이미 비어있습니다.');
      }
    }

    // 4. slot_add_forms 테이블 데이터 삭제
    console.log('\n4️⃣ slot_add_forms 테이블 데이터 삭제...');
    const { data: formsData, error: formsError } = await supabase
      .from('slot_add_forms')
      .select('*');

    if (formsError) {
      console.error('❌ slot_add_forms 테이블 조회 오류:', formsError);
    } else {
      console.log('현재 slot_add_forms 데이터 개수:', formsData?.length || 0);
      
      if (formsData && formsData.length > 0) {
        const { error: deleteError } = await supabase
          .from('slot_add_forms')
          .delete()
          .neq('id', 0); // 모든 데이터 삭제

        if (deleteError) {
          console.error('❌ slot_add_forms 삭제 오류:', deleteError);
        } else {
          console.log('✅ slot_add_forms 테이블 데이터 삭제 완료');
        }
      } else {
        console.log('✅ slot_add_forms 테이블이 이미 비어있습니다.');
      }
    }

    // 5. 최종 확인
    console.log('\n5️⃣ 삭제 후 최종 확인...');
    
    const { data: finalSettlements } = await supabase.from('settlements').select('count');
    const { data: finalHistory } = await supabase.from('settlement_history').select('count');
    const { data: finalRequests } = await supabase.from('settlement_requests').select('count');
    const { data: finalForms } = await supabase.from('slot_add_forms').select('count');

    console.log('최종 데이터 개수:');
    console.log('- settlements:', finalSettlements?.length || 0);
    console.log('- settlement_history:', finalHistory?.length || 0);
    console.log('- settlement_requests:', finalRequests?.length || 0);
    console.log('- slot_add_forms:', finalForms?.length || 0);

    console.log('\n============================================================');
    console.log('🎉 정산 관련 DB 데이터 전체 삭제 완료!');
    console.log('✅ 미정산내역, 정산내역, 정산대기, 정산수정 데이터가 모두 삭제되었습니다.');
    console.log('✅ 이제 전체 테스트를 진행하실 수 있습니다!');

  } catch (error) {
    console.error('❌ 삭제 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

cleanupSettlementData();
