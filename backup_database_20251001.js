require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function backupDatabase() {
  console.log('🔄 데이터베이스 백업 시작...');
  
  const backupData = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  try {
    // 1. customers 테이블 백업
    console.log('📊 customers 테이블 백업 중...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.error('❌ customers 테이블 백업 실패:', customersError);
    } else {
      backupData.tables.customers = customers;
      console.log(`✅ customers 테이블 백업 완료: ${customers?.length || 0}개 레코드`);
    }

    // 2. users 테이블 백업
    console.log('📊 users 테이블 백업 중...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ users 테이블 백업 실패:', usersError);
    } else {
      backupData.tables.users = users;
      console.log(`✅ users 테이블 백업 완료: ${users?.length || 0}개 레코드`);
    }

    // 3. user_profiles 테이블 백업
    console.log('📊 user_profiles 테이블 백업 중...');
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (userProfilesError) {
      console.error('❌ user_profiles 테이블 백업 실패:', userProfilesError);
    } else {
      backupData.tables.user_profiles = userProfiles;
      console.log(`✅ user_profiles 테이블 백업 완료: ${userProfiles?.length || 0}개 레코드`);
    }

    // 4. slots 테이블 백업
    console.log('📊 slots 테이블 백업 중...');
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('*');
    
    if (slotsError) {
      console.error('❌ slots 테이블 백업 실패:', slotsError);
    } else {
      backupData.tables.slots = slots;
      console.log(`✅ slots 테이블 백업 완료: ${slots?.length || 0}개 레코드`);
    }

    // 5. slot_status 테이블 백업
    console.log('📊 slot_status 테이블 백업 중...');
    const { data: slotStatus, error: slotStatusError } = await supabase
      .from('slot_status')
      .select('*');
    
    if (slotStatusError) {
      console.error('❌ slot_status 테이블 백업 실패:', slotStatusError);
    } else {
      backupData.tables.slot_status = slotStatus;
      console.log(`✅ slot_status 테이블 백업 완료: ${slotStatus?.length || 0}개 레코드`);
    }

    // 6. keywords 테이블 백업
    console.log('📊 keywords 테이블 백업 중...');
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('*');
    
    if (keywordsError) {
      console.error('❌ keywords 테이블 백업 실패:', keywordsError);
    } else {
      backupData.tables.keywords = keywords;
      console.log(`✅ keywords 테이블 백업 완료: ${keywords?.length || 0}개 레코드`);
    }

    // 7. notices 테이블 백업
    console.log('📊 notices 테이블 백업 중...');
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('*');
    
    if (noticesError) {
      console.error('❌ notices 테이블 백업 실패:', noticesError);
    } else {
      backupData.tables.notices = notices;
      console.log(`✅ notices 테이블 백업 완료: ${notices?.length || 0}개 레코드`);
    }

    // 8. 백업 파일 저장
    const backupFileName = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
    const backupFilePath = path.join(__dirname, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
    
    console.log('✅ 데이터베이스 백업 완료!');
    console.log(`📁 백업 파일: ${backupFilePath}`);
    
    // 백업 통계 출력
    const totalRecords = Object.values(backupData.tables).reduce((sum, table) => sum + (table?.length || 0), 0);
    console.log(`📊 총 백업된 레코드 수: ${totalRecords}개`);
    
    Object.entries(backupData.tables).forEach(([tableName, data]) => {
      console.log(`   - ${tableName}: ${data?.length || 0}개 레코드`);
    });

  } catch (error) {
    console.error('❌ 데이터베이스 백업 중 오류 발생:', error);
  }
}

// 백업 실행
backupDatabase();

