// slot_rank_history 테이블 스키마 확인
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRankHistorySchema() {
  console.log('🔍 slot_rank_history 테이블 스키마 확인\n');
  
  try {
    // 기존 데이터 확인 (테이블 존재 여부도 함께 확인)
    const { data: existingData, error: dataError } = await supabase
      .from('slot_rank_history')
      .select('*')
      .limit(5);
    
    if (dataError) {
      console.error('❌ 테이블 접근 실패:', dataError);
      console.log('테이블이 존재하지 않거나 접근 권한이 없습니다.');
      return;
    }
    
    console.log('✅ slot_rank_history 테이블이 존재합니다.');
    
    if (existingData.length > 0) {
      console.log(`\n📈 기존 데이터 (${existingData.length}개):`);
      existingData.forEach((row, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
      });
      
      // 첫 번째 레코드의 키를 통해 컬럼 구조 파악
      const firstRow = existingData[0];
      const existingColumns = Object.keys(firstRow);
      
      console.log('\n📊 현재 컬럼 구조:');
      existingColumns.forEach(col => {
        const value = firstRow[col];
        const type = typeof value;
        console.log(`  - ${col}: ${type} (예시값: ${value})`);
      });
      
      // 필요한 컬럼 확인
      const requiredColumns = [
        'id', 'customer_id', 'slot_sequence', 'rank_date', 
        'current_rank', 'rank_change', 'start_rank_diff', 'created_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️ 누락된 컬럼들:');
        missingColumns.forEach(col => {
          console.log(`  - ${col}`);
        });
      } else {
        console.log('\n✅ 모든 필요한 컬럼이 존재합니다.');
      }
    } else {
      console.log('\n📊 테이블이 비어있습니다. 컬럼 구조를 확인할 수 없습니다.');
      console.log('샘플 데이터를 삽입하여 구조를 확인하거나, 직접 SQL로 컬럼을 확인해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error);
  }
}

checkRankHistorySchema().catch(console.error);
