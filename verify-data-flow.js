const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDataFlow() {
  console.log('🔍 데이터 흐름 검증 (슬롯 추가 → 정산까지)');
  console.log('============================================================');

  try {
    // 1. 전체 데이터 흐름 확인
    console.log('1️⃣ 전체 데이터 흐름 확인...');
    
    // customers 테이블 확인
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(3);

    if (customersError) {
      console.log('❌ customers 테이블 조회 오류:', customersError.message);
    } else {
      console.log(`✅ customers 테이블: ${customers.length}개 고객`);
      customers.forEach(customer => {
        console.log(`   - ${customer.name} (ID: ${customer.id})`);
      });
    }

    // slots 테이블 확인
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (slotsError) {
      console.log('❌ slots 테이블 조회 오류:', slotsError.message);
    } else {
      console.log(`✅ slots 테이블: ${slots.length}개 슬롯`);
      slots.forEach(slot => {
        console.log(`   - ${slot.customer_name} (${slot.slot_type} ${slot.slot_count}개, 상태: ${slot.status})`);
      });
    }

    // settlements 테이블 확인
    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (settlementsError) {
      console.log('❌ settlements 테이블 조회 오류:', settlementsError.message);
    } else {
      console.log(`✅ settlements 테이블: ${settlements.length}개 정산 항목`);
      settlements.forEach(settlement => {
        console.log(`   - ${settlement.customer_name} (${settlement.slot_type} ${settlement.slot_count}개, 총판: ${settlement.distributor_name}, 상태: ${settlement.status})`);
      });
    }

    // settlement_history 테이블 확인
    const { data: history, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.log('❌ settlement_history 테이블 조회 오류:', historyError.message);
    } else {
      console.log(`✅ settlement_history 테이블: ${history.length}개 정산 내역`);
      history.forEach(h => {
        console.log(`   - ${h.customer_name} (${h.slot_type} ${h.slot_count}개, 총판: ${h.distributor_name}, 상태: ${h.status})`);
      });
    }

    // 2. 데이터 일관성 확인
    console.log('\n2️⃣ 데이터 일관성 확인...');
    
    // customers와 slots 연결 확인
    if (customers && slots) {
      const customerIds = customers.map(c => c.id);
      const slotCustomerIds = [...new Set(slots.map(s => s.customer_id))];
      const missingCustomers = slotCustomerIds.filter(id => !customerIds.includes(id));
      
      if (missingCustomers.length > 0) {
        console.log(`⚠️  slots에 존재하지만 customers에 없는 고객 ID: ${missingCustomers.join(', ')}`);
      } else {
        console.log('✅ customers와 slots 연결 일관성 확인');
      }
    }

    // slots와 settlements 연결 확인
    if (slots && settlements) {
      const slotIds = slots.map(s => s.id);
      const settlementCustomerIds = [...new Set(settlements.map(s => s.customer_id))];
      const slotCustomerIds = [...new Set(slots.map(s => s.customer_id))];
      const missingSlots = settlementCustomerIds.filter(id => !slotCustomerIds.includes(id));
      
      if (missingSlots.length > 0) {
        console.log(`⚠️  settlements에 존재하지만 slots에 없는 고객 ID: ${missingSlots.join(', ')}`);
      } else {
        console.log('✅ slots와 settlements 연결 일관성 확인');
      }
    }

    // 3. distributor_name 일관성 확인
    console.log('\n3️⃣ distributor_name 일관성 확인...');
    
    if (settlements) {
      const nullDistributor = settlements.filter(s => !s.distributor_name);
      if (nullDistributor.length > 0) {
        console.log(`⚠️  settlements에서 distributor_name이 NULL인 항목: ${nullDistributor.length}개`);
        nullDistributor.forEach(s => {
          console.log(`   - ID: ${s.id}, 고객: ${s.customer_name}, 슬롯타입: ${s.slot_type}`);
        });
      } else {
        console.log('✅ 모든 settlements에 distributor_name이 설정됨');
      }
    }

    if (history) {
      const nullDistributorHistory = history.filter(h => !h.distributor_name);
      if (nullDistributorHistory.length > 0) {
        console.log(`⚠️  settlement_history에서 distributor_name이 NULL인 항목: ${nullDistributorHistory.length}개`);
      } else {
        console.log('✅ 모든 settlement_history에 distributor_name이 설정됨');
      }
    }

    // 4. 상태 일관성 확인
    console.log('\n4️⃣ 상태 일관성 확인...');
    
    if (settlements) {
      const statusCounts = settlements.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('settlements 상태 분포:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}개`);
      });
    }

    if (history) {
      const statusCounts = history.reduce((acc, h) => {
        acc[h.status] = (acc[h.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('settlement_history 상태 분포:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}개`);
      });
    }

  } catch (error) {
    console.error('❌ 데이터 흐름 검증 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

verifyDataFlow();
