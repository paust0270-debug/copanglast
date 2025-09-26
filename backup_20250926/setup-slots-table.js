const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateSlotsTable() {
  try {
    console.log('🔍 slots 테이블 존재 여부 확인...');

    // slots 테이블 조회 시도
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('count')
      .limit(1);

    if (slotsError) {
      console.log('❌ slots 테이블이 존재하지 않습니다:', slotsError.message);
      console.log('📝 slots 테이블을 생성합니다...');
      
      // slots 테이블 생성 SQL 실행
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS slots (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          customer_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          slot_type TEXT NOT NULL CHECK (slot_type IN ('coupang', 'coupang-vip', 'coupang-app', 'naver-shopping', 'place', 'today-house', 'aliexpress')),
          slot_count INTEGER NOT NULL DEFAULT 1,
          payment_type TEXT CHECK (payment_type IN ('deposit', 'coupon')),
          payer_name TEXT,
          payment_amount INTEGER,
          payment_date DATE,
          usage_days INTEGER,
          memo TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'completed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.log('❌ slots 테이블 생성 실패:', createError.message);
        console.log('💡 수동으로 테이블을 생성하세요:');
        console.log('1. Supabase 대시보드에서 SQL 편집기 열기');
        console.log('2. create-slots-table.sql 파일의 내용을 실행');
        return;
      }

      console.log('✅ slots 테이블 생성 완료');
    } else {
      console.log('✅ slots 테이블이 이미 존재합니다');
    }

    // 테스트 데이터 삽입
    console.log('📝 테스트 슬롯 데이터 삽입...');
    const testSlots = [
      {
        customer_id: '_GDP_gutough',
        customer_name: '구요한',
        slot_type: 'coupang-app',
        slot_count: 5,
        payment_type: 'deposit',
        payer_name: '구요한',
        payment_amount: 50000,
        payment_date: '2024-01-15',
        usage_days: 30,
        memo: '본사',
        status: 'active'
      },
      {
        customer_id: 'test_user',
        customer_name: '테스트유저',
        slot_type: 'coupang-app',
        slot_count: 3,
        payment_type: 'coupon',
        payer_name: '테스트유저',
        payment_amount: 30000,
        payment_date: '2024-01-16',
        usage_days: 30,
        memo: '총판1',
        status: 'active'
      }
    ];

    for (const slot of testSlots) {
      const { data, error } = await supabase
        .from('slots')
        .insert([slot])
        .select();

      if (error) {
        console.log(`⚠️ 테스트 슬롯 삽입 실패 (${slot.customer_id}):`, error.message);
      } else {
        console.log(`✅ 테스트 슬롯 삽입 성공 (${slot.customer_id})`);
      }
    }

    // 최종 확인
    const { data: finalData, error: finalError } = await supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log('❌ 최종 확인 실패:', finalError.message);
    } else {
      console.log('✅ 최종 확인 완료');
      console.log(`📊 총 ${finalData.length}개의 슬롯 데이터가 있습니다`);
      console.log('📋 슬롯 데이터 목록:');
      finalData.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.customer_name} (${slot.customer_id}) - ${slot.slot_type} ${slot.slot_count}개`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkAndCreateSlotsTable();
