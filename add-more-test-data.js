const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화 (서비스 역할 키 사용)
const supabaseUrl = 'https://cwsdvgkjptuvbdtxcejt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2R2Z2tqcHR1dmJkdHhjZWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NDQzOSwiZXhwIjoyMDcxOTcwNDM5fQ.KOOooT-vz-JW2rcdwJdQdirePPIERmYWR4Vqy2v_2NY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMoreTestData() {
  try {
    console.log('더 많은 테스트 데이터 추가 시작...');
    
    // 추가 테스트 데이터
    const additionalSlots = [
      {
        customer_id: 'customer_001',
        customer_name: '김철수',
        slot_type: '쿠팡 App',
        slot_count: 10,
        payment_type: '월결제',
        payer_name: '김철수',
        payment_amount: 50000,
        payment_date: '2024-01-20',
        usage_days: 30,
        memo: '본사',
        status: 'active'
      },
      {
        customer_id: 'customer_002',
        customer_name: '이영희',
        slot_type: '쿠팡 App',
        slot_count: 8,
        payment_type: '월결제',
        payer_name: '이영희',
        payment_amount: 40000,
        payment_date: '2024-01-21',
        usage_days: 30,
        memo: '총판1',
        status: 'active'
      },
      {
        customer_id: 'customer_003',
        customer_name: '박민수',
        slot_type: '쿠팡 App',
        slot_count: 15,
        payment_type: '월결제',
        payer_name: '박민수',
        payment_amount: 75000,
        payment_date: '2024-01-22',
        usage_days: 30,
        memo: '총판2',
        status: 'pending'
      },
      {
        customer_id: 'customer_004',
        customer_name: '최지영',
        slot_type: '쿠팡 App',
        slot_count: 6,
        payment_type: '월결제',
        payer_name: '최지영',
        payment_amount: 30000,
        payment_date: '2024-01-23',
        usage_days: 30,
        memo: '본사',
        status: 'completed'
      },
      {
        customer_id: 'customer_005',
        customer_name: '정현우',
        slot_type: '쿠팡 App',
        slot_count: 12,
        payment_type: '월결제',
        payer_name: '정현우',
        payment_amount: 60000,
        payment_date: '2024-01-24',
        usage_days: 30,
        memo: '총판1',
        status: 'active'
      },
      {
        customer_id: 'customer_006',
        customer_name: '한소영',
        slot_type: '쿠팡 App',
        slot_count: 7,
        payment_type: '월결제',
        payer_name: '한소영',
        payment_amount: 35000,
        payment_date: '2024-01-25',
        usage_days: 30,
        memo: '총판2',
        status: 'inactive'
      },
      {
        customer_id: 'customer_007',
        customer_name: '송태호',
        slot_type: '쿠팡 App',
        slot_count: 20,
        payment_type: '월결제',
        payer_name: '송태호',
        payment_amount: 100000,
        payment_date: '2024-01-26',
        usage_days: 30,
        memo: '본사',
        status: 'expired'
      },
      {
        customer_id: 'customer_008',
        customer_name: '윤미라',
        slot_type: '쿠팡 App',
        slot_count: 9,
        payment_type: '월결제',
        payer_name: '윤미라',
        payment_amount: 45000,
        payment_date: '2024-01-27',
        usage_days: 30,
        memo: '총판1',
        status: 'active'
      }
    ];

    // 데이터 삽입
    const { data, error } = await supabase
      .from('slots')
      .insert(additionalSlots);

    if (error) {
      console.error('데이터 삽입 오류:', error);
      return;
    }

    console.log('✅ 추가 테스트 데이터 삽입 완료!');
    console.log('삽입된 데이터 수:', additionalSlots.length);

    // 전체 슬롯 데이터 조회
    const { data: allSlots, error: fetchError } = await supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('데이터 조회 오류:', fetchError);
      return;
    }

    console.log('📊 현재 전체 슬롯 데이터:');
    console.log('총 슬롯 수:', allSlots.length);
    allSlots.forEach((slot, index) => {
      console.log(`${index + 1}. ${slot.customer_name} (${slot.memo}) - ${slot.status}`);
    });

  } catch (error) {
    console.error('스크립트 실행 오류:', error);
  }
}

// 스크립트 실행
addMoreTestData();
