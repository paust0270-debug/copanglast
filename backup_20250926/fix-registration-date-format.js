const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRegistrationDateFormat() {
  console.log('🔧 registration_date 형식 수정');
  console.log('============================================================');

  try {
    // 1. 현재 customers 데이터 확인
    console.log('1️⃣ 현재 customers 데이터 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ customers 테이블 조회 오류:', customersError);
      return;
    }

    console.log('✅ customers 테이블 조회 성공:', customersData.length, '개');

    // 2. registration_date 형식 수정
    console.log('\n2️⃣ registration_date 형식 수정...');
    
    for (let i = 0; i < customersData.length; i++) {
      const customer = customersData[i];
      console.log(`고객 ${i + 1}: ${customer.name}`);
      
      // 현재 registration_date 확인
      console.log('현재 registration_date:', customer.registration_date);
      
      // 올바른 형식으로 변환 (시간/분/초 포함)
      let newRegistrationDate;
      
      if (customer.registration_date && customer.registration_date.includes(' ~ ')) {
        // 이미 올바른 형식인 경우
        newRegistrationDate = customer.registration_date;
        console.log('이미 올바른 형식입니다.');
      } else {
        // 단순 날짜 형식인 경우 변환
        const createdDate = customer.created_at ? new Date(customer.created_at) : new Date();
        const expiryDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
        
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        newRegistrationDate = `${formatDate(createdDate)} ~ ${formatDate(expiryDate)}`;
        console.log('새로운 registration_date:', newRegistrationDate);
        
        // 데이터베이스 업데이트
        const { error: updateError } = await supabase
          .from('customers')
          .update({ registration_date: newRegistrationDate })
          .eq('id', customer.id);

        if (updateError) {
          console.error('❌ 업데이트 오류:', updateError);
        } else {
          console.log('✅ 업데이트 성공');
        }
      }
      
      console.log('---');
    }

    // 3. 수정된 데이터 확인
    console.log('\n3️⃣ 수정된 데이터 확인...');
    const { data: updatedCustomersData, error: updatedError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (updatedError) {
      console.error('❌ 수정된 데이터 조회 오류:', updatedError);
    } else {
      console.log('✅ 수정된 데이터 조회 성공');
      
      updatedCustomersData.forEach((customer, index) => {
        console.log(`고객 ${index + 1} (${customer.name}):`);
        console.log('  registration_date:', customer.registration_date);
        
        // 잔여기간 계산 테스트
        if (customer.registration_date && customer.registration_date.includes(' ~ ')) {
          const dateRange = customer.registration_date.split(' ~ ');
          const expiryDateStr = dateRange[1];
          const expiryDate = new Date(expiryDateStr);
          const now = new Date();
          const diffMs = expiryDate.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            console.log(`  잔여기간: ${diffDays}일 ${diffHours}시간 ${diffMinutes}분 ${diffSeconds}초`);
          } else {
            console.log('  잔여기간: 만료됨');
          }
        }
        console.log('---');
      });
    }

    console.log('\n============================================================');
    console.log('🎉 registration_date 형식 수정 완료!');
    console.log('✅ 모든 고객의 등록일이 시간/분/초 포함 형식으로 수정되었습니다.');
    console.log('✅ 잔여기간이 실시간으로 일/시간/분/초 단위로 표시됩니다.');

  } catch (error) {
    console.error('❌ 수정 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

fixRegistrationDateFormat();
