import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 엑셀 고객 추가 시작...');
    console.log(
      'Request headers:',
      Object.fromEntries(request.headers.entries())
    );

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
      errors: [] as string[],
    };

    // 각 행을 순차적으로 처리
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2;
      const rowArray = row as any[];

      try {
        console.log(`\n=== 행 ${rowNumber} 처리 시작 ===`);
        console.log('원본 데이터:', row);
        console.log('배열 길이:', rowArray?.length);
        console.log('배열 내용:', JSON.stringify(rowArray));

        // 빈 행 건너뛰기
        if (
          !rowArray ||
          rowArray.length === 0 ||
          rowArray.every(cell => !cell || cell.toString().trim() === '')
        ) {
          console.log(`행 ${rowNumber}: 빈 행 건너뛰기`);
          continue;
        }

        // 최소 컬럼 수 확인 (5개: 순번, 소속총판, 아이디, 비밀번호, 이름)
        if (rowArray.length < 5) {
          console.log(
            `행 ${rowNumber}: 컬럼 수 부족 - ${rowArray.length}개 (필요: 5개)`,
            rowArray
          );
          results.failed++;
          results.errors.push(
            `행 ${rowNumber}: 데이터 형식이 올바르지 않습니다. (컬럼 수: ${rowArray.length}/5, 데이터: ${JSON.stringify(rowArray)})`
          );
          continue;
        }

        const [
          no, // 순번 (참조용, 사용 안 함)
          distributor = '구대판다',
          username,
          password,
          name,
        ] = rowArray;

        console.log('파싱된 데이터:', {
          no,
          distributor,
          username,
          password,
          name,
        });

        // 필수 필드 검증 (각 필드가 존재하고 비어있지 않은지 확인)
        const usernameStr = username ? username.toString().trim() : '';
        const passwordStr = password ? password.toString().trim() : '';
        const nameStr = name ? name.toString().trim() : '';

        if (!usernameStr || !passwordStr || !nameStr) {
          const missingFields = [];
          if (!usernameStr) missingFields.push('아이디');
          if (!passwordStr) missingFields.push('비밀번호');
          if (!nameStr) missingFields.push('이름');

          console.log(
            `행 ${rowNumber}: 필수 필드 누락 - username: "${username}", password: "${password}", name: "${name}"`
          );
          results.failed++;
          results.errors.push(
            `행 ${rowNumber}: 필수 필드 누락 (${missingFields.join(', ')})`
          );
          continue;
        }

        // 데이터 정리
        const cleanUsername = usernameStr;
        const cleanPassword = passwordStr;
        const cleanName = nameStr;
        const cleanDistributor =
          distributor && distributor.toString().trim()
            ? distributor.toString().trim()
            : '구대판다';

        console.log('정리된 데이터:', {
          cleanUsername,
          cleanPassword,
          cleanName,
          cleanDistributor,
        });

        // 가입일은 현재 시간으로 설정
        const processedJoinDate = new Date().toISOString();

        // 슬롯 수는 기본값 0
        const slotCountNum = 0;

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
          console.log(
            `기존 사용자 ${cleanUsername} 업데이트 중... ID: ${existingUser.id}`
          );

          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              name: cleanName,
              password: cleanPassword,
              distributor: cleanDistributor,
              slot_used: slotCountNum,
              status: 'active',
              grade: '일반회원',
            })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError) {
            console.log(
              `사용자 ${cleanUsername} 업데이트 실패: ${updateError.message}`
            );
            results.failed++;
            results.errors.push(
              `행 ${rowNumber} (${cleanUsername}): 업데이트 실패 - ${updateError.message}`
            );
            continue;
          }

          console.log(`✅ 기존 고객 ${cleanUsername} 업데이트 성공`);
          results.success++;
          continue;
        }

        // 2단계: 새 사용자 생성 (Supabase Auth 사용)
        console.log(`새 사용자 ${cleanUsername} 생성 중...`);

        // Supabase Auth로 사용자 먼저 생성
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: `${cleanUsername}@temp.com`, // 임시 이메일 (username을 이메일로 사용)
            password: cleanPassword,
            options: {
              data: {
                username: cleanUsername,
                name: cleanName,
              },
            },
          }
        );

        if (authError) {
          console.log(
            `Auth 사용자 ${cleanUsername} 생성 실패: ${authError.message}`
          );

          // 이미 존재하는 사용자 오류인 경우 (email 중복 등)
          if (
            authError.message.includes('already registered') ||
            authError.message.includes('already exists') ||
            authError.message.includes('User already registered')
          ) {
            // 기존 사용자 업데이트로 처리 (이미 위에서 처리했으므로 여기서는 실패 처리)
            results.failed++;
            results.errors.push(
              `행 ${rowNumber} (${cleanUsername}): 이미 등록된 사용자입니다.`
            );
            continue;
          }

          results.failed++;
          results.errors.push(
            `행 ${rowNumber} (${cleanUsername}): Auth 사용자 생성 실패 - ${authError.message}`
          );
          continue;
        }

        if (!authData.user) {
          console.log(
            `Auth 사용자 ${cleanUsername} 생성 실패: user 데이터 없음`
          );
          results.failed++;
          results.errors.push(
            `행 ${rowNumber} (${cleanUsername}): Auth 사용자 생성 실패 - user 데이터 없음`
          );
          continue;
        }

        console.log(
          `✅ Auth 사용자 ${cleanUsername} 생성 성공, ID: ${authData.user.id}`
        );

        // user_profiles에 프로필 정보 저장
        const profileData: any = {
          id: authData.user.id, // auth.users.id 사용
          username: cleanUsername,
          password: cleanPassword,
          name: cleanName,
          status: 'active',
          grade: '일반회원',
          distributor: cleanDistributor,
          slot_used: slotCountNum,
          additional_count: 0,
          created_at: processedJoinDate,
        };

        console.log('삽입할 프로필 데이터:', profileData);

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select()
          .single();

        if (profileError) {
          console.log(
            `프로필 ${cleanUsername} 삽입 실패: ${profileError.message}`
          );
          results.failed++;
          results.errors.push(
            `행 ${rowNumber} (${cleanUsername}): 프로필 저장 실패 - ${profileError.message}`
          );
          continue;
        }

        console.log(`✅ 새 고객 ${cleanUsername} 생성 성공`);
        results.success++;
      } catch (error) {
        console.error(`행 ${rowNumber} 처리 중 오류:`, error);
        const username = rowArray[2] || '알 수 없음';
        results.failed++;
        results.errors.push(
          `행 ${rowNumber} (${username}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
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
        successRate:
          dataRows.length > 0
            ? Math.round((results.success / dataRows.length) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error('엑셀 고객 추가 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
