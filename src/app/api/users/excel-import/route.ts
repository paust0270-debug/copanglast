import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 엑셀 고객 추가 시작...');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    console.log('FormData keys:', Array.from(formData.keys()));
    
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ 파일이 선택되지 않았습니다.');
      return NextResponse.json(
        { error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      );
    }

    console.log(`엑셀 파일 처리 시작: ${file.name}`);
    console.log('파일 크기:', file.size, 'bytes');
    console.log('파일 타입:', file.type);

    // 파일을 ArrayBuffer로 읽기
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 첫 번째 시트 선택
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 시트를 JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('엑셀 데이터 파싱 결과:', jsonData.length, '행');
    console.log('첫 3행 데이터:', jsonData.slice(0, 3));
    
    // 헤더 제거 (첫 번째 행)
    const dataRows = jsonData.slice(1);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // 각 행을 순차적으로 처리
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2;
      
      try {
        console.log(`\n=== 행 ${rowNumber} 처리 시작 ===`);
        console.log('원본 데이터:', row);
        
        // 빈 행 건너뛰기
        const rowArray = row as any[];
        if (!rowArray || rowArray.length === 0 || rowArray.every(cell => !cell || cell.toString().trim() === '')) {
          console.log(`행 ${rowNumber}: 빈 행 건너뛰기`);
          continue;
        }

        // 최소 컬럼 수 확인
        if (rowArray.length < 6) {
          console.log(`행 ${rowNumber}: 컬럼 수 부족 - ${rowArray.length}개 (필요: 6개)`, rowArray);
          results.failed++;
          results.errors.push(`행 ${rowNumber}: 데이터 형식이 올바르지 않습니다. (컬럼 수: ${rowArray.length})`);
          continue;
        }

        const [
          no,
          distributor = '구대판다',
          username,
          name,
          phone = '',
          joinDate = new Date().toISOString(),
          slotCount = 0
        ] = rowArray;

        console.log('파싱된 데이터:', {
          no, distributor, username, name, phone, joinDate, slotCount
        });

        // 필수 필드 검증
        if (!username || !name || username.toString().trim() === '' || name.toString().trim() === '') {
          console.log(`행 ${rowNumber}: 필수 필드 누락 - username: "${username}", name: "${name}"`);
          results.failed++;
          results.errors.push(`행 ${rowNumber}: 필수 필드(아이디, 고객명) 누락`);
          continue;
        }

        // 데이터 정리
        const cleanUsername = username.toString().trim();
        const cleanName = name.toString().trim();
        const cleanPhone = phone ? phone.toString().trim() : '';
        const cleanDistributor = distributor ? distributor.toString().trim() : '구대판다';

        console.log('정리된 데이터:', {
          cleanUsername, cleanName, cleanPhone, cleanDistributor
        });

        // 임시 비밀번호 생성
        const password = `${cleanUsername}123`;

        // 날짜 형식 처리
        let processedJoinDate = joinDate;
        if (joinDate && typeof joinDate === 'string') {
          try {
            const dateStr = joinDate.toString().trim();
            if (dateStr.includes(' ')) {
              processedJoinDate = new Date(dateStr).toISOString();
            } else if (dateStr.includes('-')) {
              processedJoinDate = new Date(dateStr + 'T00:00:00').toISOString();
            } else {
              processedJoinDate = new Date().toISOString();
            }
          } catch (error) {
            processedJoinDate = new Date().toISOString();
          }
        }

        // 슬롯 수 처리
        const slotCountNum = parseInt(slotCount.toString()) || 0;

        // 1단계: 기존 사용자 확인
        console.log(`기존 사용자 확인: ${cleanUsername}`);
        const { data: existingUsers, error: checkError } = await supabase
          .from('user_profiles')
          .select('id, username')
          .eq('username', cleanUsername)
          .limit(1);

        if (checkError) {
          console.log(`기존 사용자 확인 오류: ${checkError.message}`);
        }

        if (existingUsers && existingUsers.length > 0) {
          // 기존 사용자 업데이트
          const existingUser = existingUsers[0];
          console.log(`기존 사용자 ${cleanUsername} 업데이트 중... ID: ${existingUser.id}`);

          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              name: cleanName,
              phone: cleanPhone,
              distributor: cleanDistributor,
              slot_used: slotCountNum,
              status: 'active',
              grade: '일반회원'
            })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError) {
            console.log(`사용자 ${cleanUsername} 업데이트 실패: ${updateError.message}`);
            results.failed++;
            results.errors.push(`행 ${rowNumber} (${cleanUsername}): 업데이트 실패 - ${updateError.message}`);
            continue;
          }

          console.log(`✅ 기존 고객 ${cleanUsername} 업데이트 성공`);
          results.success++;
          continue;
        }

        // 2단계: 새 사용자 생성 (ID 자동 생성)
        console.log(`새 사용자 ${cleanUsername} 생성 중...`);

        const profileData: {
          username: string;
          password: string;
          name: string;
          phone: string;
          status: string;
          grade?: string;
          distributor?: string;
          email?: string;
          address?: string;
          registration_date?: string;
        } = {
          username: cleanUsername,
          password: password,
          name: cleanName,
          phone: cleanPhone,
          status: 'active',
          grade: '일반회원',
          distributor: cleanDistributor,
          slot_used: slotCountNum,
          additional_count: 0,
          created_at: processedJoinDate
        };

        console.log('삽입할 프로필 데이터:', profileData);

        // 직접 삽입 시도 (ID 자동 생성)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select()
          .single();

        if (profileError) {
          console.log(`프로필 ${cleanUsername} 삽입 실패: ${profileError.message}`);
          
          // 삽입 실패 시 upsert 시도
          console.log(`upsert로 재시도: ${cleanUsername}`);
          const { data: upsertProfile, error: upsertError } = await supabase
            .from('user_profiles')
            .upsert([profileData], { 
              onConflict: 'username',
              ignoreDuplicates: false 
            })
            .select()
            .single();

          if (upsertError) {
            console.log(`upsert도 실패: ${upsertError.message}`);
            results.failed++;
            results.errors.push(`행 ${rowNumber} (${cleanUsername}): 삽입 및 upsert 모두 실패 - ${profileError.message}`);
            continue;
          }

          console.log(`✅ 고객 ${cleanUsername} upsert 성공`);
          results.success++;
        } else {
          console.log(`✅ 새 고객 ${cleanUsername} 생성 성공`);
          results.success++;
        }

      } catch (error) {
        console.error(`행 ${rowNumber} 처리 중 오류:`, error);
        const username = row[2] || '알 수 없음';
        results.failed++;
        results.errors.push(`행 ${rowNumber} (${username}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }

    console.log(`\n=== 엑셀 고객 추가 완료 ===`);
    console.log(`성공: ${results.success}명, 실패: ${results.failed}명`);
    console.log('오류 목록:', results.errors);

    return NextResponse.json({
      success: true,
      message: `엑셀 대량 등록이 완료되었습니다. 성공: ${results.success}명, 실패: ${results.failed}명`,
      results,
      summary: {
        total: dataRows.length,
        success: results.success,
        failed: results.failed,
        successRate: dataRows.length > 0 ? Math.round((results.success / dataRows.length) * 100) : 0
      }
    });

  } catch (error) {
    console.error('엑셀 고객 추가 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}