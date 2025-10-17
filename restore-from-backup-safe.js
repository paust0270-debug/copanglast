const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreFromBackupSafe() {
  console.log('🔄 안전한 백업 데이터 복원 시작...');

  const backupDir = path.join(__dirname, 'backup_2025-09-17T10-37-15-730Z');

  try {
    // 1. user_profiles 복원 (ID 제외)
    console.log('📥 user_profiles 테이블 복원 중...');
    const userProfilesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'user_profiles.json'), 'utf8')
    );

    for (const user of userProfilesData) {
      const { id, ...userData } = user; // ID 제외
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(userData)
        .select();

      if (error) {
        console.error('❌ user_profiles 삽입 실패:', error.message);
      } else {
        console.log(`✅ user_profiles 삽입 완료: ${userData.username}`);
      }
    }

    // 2. slots 복원 (ID 제외)
    console.log('📥 slots 테이블 복원 중...');
    const slotsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'slots.json'), 'utf8')
    );

    for (const slot of slotsData) {
      const { id, ...slotData } = slot; // ID 제외
      const { data, error } = await supabase
        .from('slots')
        .insert(slotData)
        .select();

      if (error) {
        console.error('❌ slots 삽입 실패:', error.message);
      } else {
        console.log(
          `✅ slots 삽입 완료: ${slotData.customer_id} - ${slotData.slot_type}`
        );
      }
    }

    // 3. settlements 복원 (ID 제외)
    console.log('📥 settlements 테이블 복원 중...');
    const settlementsData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'settlements.json'), 'utf8')
    );

    for (const settlement of settlementsData) {
      const { id, ...settlementData } = settlement; // ID 제외
      const { data, error } = await supabase
        .from('settlements')
        .insert(settlementData)
        .select();

      if (error) {
        console.error('❌ settlements 삽입 실패:', error.message);
      } else {
        console.log(
          `✅ settlements 삽입 완료: ${settlementData.customer_name}`
        );
      }
    }

    // 4. settlement_history 복원 (ID 제외)
    console.log('📥 settlement_history 테이블 복원 중...');
    const settlementHistoryData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'settlement_history.json'), 'utf8')
    );

    for (const history of settlementHistoryData) {
      const { id, ...historyData } = history; // ID 제외
      const { data, error } = await supabase
        .from('settlement_history')
        .insert(historyData)
        .select();

      if (error) {
        console.error('❌ settlement_history 삽입 실패:', error.message);
      } else {
        console.log(`✅ settlement_history 삽입 완료`);
      }
    }

    // 5. notices 복원 (ID 제외)
    console.log('📥 notices 테이블 복원 중...');
    const noticesData = JSON.parse(
      fs.readFileSync(path.join(backupDir, 'notices.json'), 'utf8')
    );

    for (const notice of noticesData) {
      const { id, ...noticeData } = notice; // ID 제외
      const { data, error } = await supabase
        .from('notices')
        .insert(noticeData)
        .select();

      if (error) {
        console.error('❌ notices 삽입 실패:', error.message);
      } else {
        console.log(`✅ notices 삽입 완료: ${noticeData.title}`);
      }
    }

    console.log('🎉 안전한 백업 데이터 복원 완료!');

    // 6. 복원 결과 확인
    console.log('🔍 복원 결과 확인 중...');

    const tables = [
      'user_profiles',
      'slots',
      'settlements',
      'settlement_history',
      'notices',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (error) {
          console.log(`⚠️ ${table} 테이블 확인 실패:`, error.message);
        } else {
          console.log(`📊 ${table} 테이블: ${data?.length || 0}개 레코드`);
        }
      } catch (err) {
        console.log(`⚠️ ${table} 테이블 확인 중 예외:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ 백업 복원 중 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
restoreFromBackupSafe();
