import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { username, password, name, email, phone, kakaoId } = body;

    console.log('회원가입 요청 데이터:', { username, name, email, phone, kakaoId });

    // 필수 필드 검증
    if (!username || !password || !name) {
      console.log('필수 필드 누락:', { username: !!username, password: !!password, name: !!name });
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Supabase 연결 상태 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수 미설정');
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    console.log('Supabase 환경 변수 확인됨');

    // 1단계: Supabase Auth로 사용자 생성 (스키마 캐시 문제 해결 적용)
    console.log('Supabase Auth 사용자 생성 시작');
    const createAuthUser = async () => {
      return await supabase.auth.signUp({
        email: `${username}@temp.com`, // 임시 이메일 (username을 이메일로 사용)
        password: password,
        options: {
          data: {
            username: username,
            name: name
          }
        }
      });
    };

    const { data: authData, error: authError } = await createAuthUser();

    if (authError) {
      console.error('Auth 사용자 생성 오류:', authError);
      
      // Rate limiting 오류 처리
      if (authError.message.includes('56 seconds') || authError.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: '회원가입 요청이 너무 빈번합니다. 1분 후에 다시 시도해주세요.',
            code: 'RATE_LIMIT',
            retryAfter: 60
          },
          { status: 429 }
        );
      }
      
      // 중복 사용자 오류 처리
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          { 
            error: '이미 등록된 사용자입니다. 다른 아이디를 사용해주세요.',
            code: 'USER_EXISTS'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `사용자 생성에 실패했습니다: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!authData.user) {
      console.error('Auth 사용자 데이터 없음');
      return NextResponse.json(
        { error: '사용자 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('Auth 사용자 생성 성공:', authData.user.id);

    // 2단계: user_profiles 테이블에 추가 정보 저장 (스키마 캐시 문제 해결 적용)
    console.log('사용자 프로필 정보 저장 시작');
    
    // 기본 프로필 데이터 (username 컬럼 제외)
    const profileData: any = {
      id: authData.user.id, // auth.users.id와 직접 연결
      username: username, // 아이디
      password: password, // 비밀번호 추가
      name: name, // 고객명
      status: 'pending', // 승인 대기 상태
      grade: '일반회원',
      distributor: '일반',
      slot_used: 0,
      additional_count: 0
    };

    // 선택사항 필드들 추가 (값이 있는 경우에만)
    if (email && email.trim()) {
      profileData.email = email.trim();
    }
    if (phone && phone.trim()) {
      profileData.phone = phone.trim();
    }
    if (kakaoId && kakaoId.trim()) {
      profileData.kakao_id = kakaoId.trim();
    }

    console.log('프로필 데이터:', profileData);

    // username 컬럼이 있는지 확인하고 있으면 추가
    let hasUsernameColumn = false;
    try {
      const { error: testError } = await supabase
        .from('user_profiles')
        .select('username')
        .limit(1);
      
      if (!testError) {
        hasUsernameColumn = true;
        profileData.username = username;
        console.log('✅ username 컬럼이 존재하여 추가합니다.');
      }
    } catch (error) {
      console.log('⚠️ username 컬럼이 존재하지 않습니다. 기본 컬럼만 사용합니다.');
    }

    const insertProfile = async () => {
      return await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();
    };

    const { data: profile, error: profileError } = await insertProfile();

    if (profileError) {
      console.error('프로필 저장 오류:', profileError);
      console.error('오류 코드:', profileError.code);
      console.error('오류 메시지:', profileError.message);
      
      // user_profiles 테이블이 없는 경우
      if (profileError.code === '42P01') {
        return NextResponse.json(
          { 
            error: '사용자 프로필 테이블이 존재하지 않습니다.',
            solution: 'Supabase SQL 편집기에서 supabase-schema.sql을 실행해주세요.',
            details: profileError.message
          },
          { status: 500 }
        );
      }
      
      // username 컬럼이 없는 경우 - 이 경우는 이미 처리했으므로 무시
      if (profileError.code === 'PGRST204' && profileError.message.includes('username')) {
        console.log('⚠️ username 컬럼이 없지만 이미 처리되었습니다.');
        // username 없이 다시 시도
        delete profileData.username;
        
        const retryInsert = async () => {
          return await supabase
            .from('user_profiles')
            .insert([profileData])
            .select()
            .single();
        };
        
        const { data: retryProfile, error: retryError } = await retryInsert();
        
        if (retryError) {
          return NextResponse.json(
            { 
              error: '프로필 정보 저장에 실패했습니다.',
              details: retryError.message
            },
            { status: 500 }
          );
        }
        
        console.log('✅ username 없이 프로필 저장 성공:', retryProfile);
        
        return NextResponse.json({
          success: true,
          message: '가입신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
          user: {
            id: authData.user.id,
            username: username,
            name: name,
            status: 'pending'
          }
        });
      }
      
      // 스키마 캐시 문제
      if (profileError.message.includes('schema cache') || 
          profileError.message.includes('relation') || 
          profileError.message.includes('table') ||
          profileError.message.includes('column')) {
        return NextResponse.json(
          { 
            error: '데이터베이스 스키마 캐시 문제입니다.',
            solution: 'Supabase SQL 편집기에서 supabase-schema.sql을 실행해주세요.',
            details: profileError.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `프로필 정보 저장에 실패했습니다: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log('프로필 저장 성공:', profile);

    return NextResponse.json({
      success: true,
      message: '가입신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
      user: {
        id: authData.user.id,
        username: username,
        name: name,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('회원가입 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // user_profiles 테이블에서 사용자 목록 조회 (최적화: 스키마 캐시 문제 해결 제거)
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '사용자 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 데이터 형식 변환
    const users = profiles?.map(profile => ({
      id: profile.id,
      username: profile.username || profile.name, // 실제 username이 있으면 사용, 없으면 name을 fallback
      password: profile.password, // 비밀번호 표시
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      kakaoId: profile.kakao_id, // kakao_id를 kakaoId로 매핑
      memo: profile.memo,
      grade: profile.grade,
      distributor: profile.distributor,
      distributor_name: profile.distributor, // distributor 값을 distributor_name으로도 매핑
      manager_id: profile.manager_id,
      status: profile.status,
      slot_used: profile.slot_used,
      additional_count: profile.additional_count,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      approved_at: profile.approved_at,
      processor: profile.processor
    })) || [];

    return NextResponse.json({ users });

  } catch (error) {
    console.error('사용자 목록 조회 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
