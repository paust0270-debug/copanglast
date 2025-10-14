// 모든 키워드 확인
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllKeywords() {
  console.log('🔍 모든 키워드 확인\n');
  
  // keywords 테이블의 모든 데이터 확인
  const { data: allKeywords, error } = await supabase
    .from('keywords')
    .select('*')
    .order('id');
    
  if (error) {
    console.error('❌ keywords 조회 실패:', error);
    return;
  }
  
  console.log(`📊 총 ${allKeywords.length}개 키워드:`);
  
  // 키워드별로 그룹화
  const keywordGroups = {};
  allKeywords.forEach(keyword => {
    if (!keywordGroups[keyword.keyword]) {
      keywordGroups[keyword.keyword] = [];
    }
    keywordGroups[keyword.keyword].push(keyword);
  });
  
  Object.keys(keywordGroups).forEach(keyword => {
    const group = keywordGroups[keyword];
    console.log(`\n📝 "${keyword}" (${group.length}개):`);
    group.forEach((item, index) => {
      console.log(`  ${index + 1}. ID: ${item.id}, slot_sequence: ${item.slot_sequence}, customer_id: ${item.customer_id}`);
    });
  });
  
  // slot_status 테이블 확인
  console.log('\n🔍 slot_status 테이블 확인:');
  const { data: slotStatus, error: statusError } = await supabase
    .from('slot_status')
    .select('*')
    .eq('customer_id', 'choiangello1')
    .order('slot_sequence');
    
  if (statusError) {
    console.error('❌ slot_status 조회 실패:', statusError);
  } else {
    console.log(`📊 총 ${slotStatus.length}개 슬롯:`);
    slotStatus.forEach(slot => {
      console.log(`  ${slot.slot_sequence}. ${slot.keyword} | 현재순위: ${slot.current_rank} | 시작순위: ${slot.start_rank}`);
    });
  }
  
  console.log('\n✅ 확인 완료!');
}

checkAllKeywords().catch(console.error);
