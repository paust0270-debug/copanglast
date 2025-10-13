// slot_rank_history 테이블에 샘플 데이터 삽입하여 스키마 확인
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRankHistoryInsert() {
  console.log('🧪 slot_rank_history 테이블 샘플 데이터 삽입 테스트\n');
  
  try {
    // 샘플 데이터 삽입 시도
    const sampleData = {
      customer_id: 'choiangello1',
      slot_sequence: 1,
      rank_date: new Date().toISOString(),
      current_rank: 15,
      rank_change: 0,
      start_rank_diff: 0
    };
    
    console.log('📤 삽입할 샘플 데이터:', sampleData);
    
    const { data, error } = await supabase
      .from('slot_rank_history')
      .insert([sampleData])
      .select();
    
    if (error) {
      console.error('❌ 데이터 삽입 실패:', error);
      
      // 에러 메시지에서 누락된 컬럼이나 타입 오류 확인
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('\n💡 해결 방법:');
        console.log('1. Supabase Dashboard → SQL Editor에서 다음 쿼리 실행:');
        console.log('   SELECT column_name, data_type FROM information_schema.columns');
        console.log('   WHERE table_name = \'slot_rank_history\';');
        console.log('2. 또는 테이블을 삭제하고 다시 생성:');
        console.log('   DROP TABLE IF EXISTS slot_rank_history;');
        console.log('   -- 그 후 새로운 스키마로 테이블 생성');
      }
    } else {
      console.log('✅ 샘플 데이터 삽입 성공!');
      console.log('📥 삽입된 데이터:', data);
      
      // 삽입된 데이터로 컬럼 구조 확인
      const insertedRow = data[0];
      const columns = Object.keys(insertedRow);
      
      console.log('\n📊 확인된 컬럼 구조:');
      columns.forEach(col => {
        const value = insertedRow[col];
        const type = typeof value;
        console.log(`  - ${col}: ${type} (값: ${value})`);
      });
      
      // 필요한 컬럼 확인
      const requiredColumns = [
        'id', 'customer_id', 'slot_sequence', 'rank_date', 
        'current_rank', 'rank_change', 'start_rank_diff', 'created_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️ 누락된 컬럼들:');
        missingColumns.forEach(col => {
          console.log(`  - ${col}`);
        });
        
        console.log('\n🔧 필요한 ALTER TABLE 쿼리:');
        missingColumns.forEach(col => {
          let alterQuery = `ALTER TABLE slot_rank_history ADD COLUMN ${col}`;
          if (col === 'id') {
            alterQuery += ' BIGSERIAL PRIMARY KEY';
          } else if (col === 'created_at') {
            alterQuery += ' TIMESTAMP DEFAULT NOW()';
          } else if (col.includes('rank')) {
            alterQuery += ' INTEGER';
          } else if (col.includes('date')) {
            alterQuery += ' TIMESTAMP';
          } else {
            alterQuery += ' TEXT';
          }
          alterQuery += ';';
          console.log(`  ${alterQuery}`);
        });
      } else {
        console.log('\n✅ 모든 필요한 컬럼이 존재합니다.');
      }
      
      // 테스트 데이터 삭제
      console.log('\n🧹 테스트 데이터 삭제 중...');
      const { error: deleteError } = await supabase
        .from('slot_rank_history')
        .delete()
        .eq('customer_id', 'choiangello1')
        .eq('slot_sequence', 1);
      
      if (deleteError) {
        console.error('❌ 테스트 데이터 삭제 실패:', deleteError);
      } else {
        console.log('✅ 테스트 데이터 삭제 완료');
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testRankHistoryInsert().catch(console.error);
