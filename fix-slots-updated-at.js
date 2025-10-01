require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSlotsUpdatedAt() {
  try {
    console.log('🔄 slots 테이블의 updated_at 수정 시작...');
    
    // sisisi 고객의 슬롯 데이터 조회
    const { data: slots, error: selectError } = await supabase
      .from('slots')
      .select('id, created_at, usage_days')
      .eq('customer_id', 'sisisi');
    
    if (selectError) {
      console.error('❌ 데이터 조회 오류:', selectError);
      return;
    }
    
    console.log('📊 기존 데이터:', slots);
    
    // 각 슬롯의 updated_at을 created_at + usage_days로 수정
    for (const slot of slots) {
      const createdDate = new Date(slot.created_at);
      const expiryDate = new Date(createdDate.getTime() + (slot.usage_days || 0) * 24 * 60 * 60 * 1000);
      
      const { error: updateError } = await supabase
        .from('slots')
        .update({ updated_at: expiryDate.toISOString() })
        .eq('id', slot.id);
      
      if (updateError) {
        console.error(`❌ 슬롯 ${slot.id} 업데이트 오류:`, updateError);
      } else {
        console.log(`✅ 슬롯 ${slot.id} 업데이트 완료: ${expiryDate.toISOString()}`);
      }
    }
    
    console.log('✅ 모든 슬롯의 updated_at 수정 완료');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

fixSlotsUpdatedAt();
