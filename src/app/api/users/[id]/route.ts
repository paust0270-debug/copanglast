import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { getTimestampWithoutMs } from '@/lib/utils';
import { hashPassword } from '@/lib/password';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('🔧 사용자 수정 요청:', { id, body });
    
    const { 
      username, 
      password, 
      name, 
      email, 
      phone, 
      kakaoId, 
      memo, 
      grade, 
      distributor,
      manager_id,
      slot_used, 
      additional_count, 
      status,
      processor,
      approved_at
    } = body;

    // Supabase 클라이언트 생성
    const supabase = createSupabaseClient();

    // 업데이트할 데이터 준비
    const updateData: Record<string, string | number | boolean> = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined && password.trim() !== '') {
      // 비밀번호를 원본 그대로 저장 (해시하지 않음)
      updateData.password = password;
      console.log('🔧 비밀번호 저장:', password);
    } else {
      console.log('🔧 비밀번호 변경 없음 또는 빈 문자열');
    }
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (kakaoId !== undefined) updateData.kakao_id = kakaoId; // kakaoId를 kakao_id로 매핑
    if (memo !== undefined) updateData.memo = memo;
    if (grade !== undefined) updateData.grade = grade;
    if (distributor !== undefined) updateData.distributor = distributor;
    if (manager_id !== undefined) updateData.manager_id = manager_id;
    if (slot_used !== undefined) updateData.slot_used = slot_used;
    if (additional_count !== undefined) updateData.additional_count = additional_count;
    if (processor !== undefined) updateData.processor = processor;
    if (status !== undefined) {
      updateData.status = status;
      // 승인 상태가 변경되면 승인일시 업데이트
      if (status === 'active') {
        updateData.approved_at = approved_at || new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.approved_at = null; // 거부시 승인일시 제거
      }
    }
    if (approved_at !== undefined) updateData.approved_at = approved_at;
    updateData.updated_at = getTimestampWithoutMs();

    console.log('🔧 업데이트할 데이터:', updateData);

    // user_profiles 테이블에서 업데이트 (기존 구조와 호환성 유지)
    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('🔧 업데이트 결과:', { updatedUser, error });

    if (error) {
      console.error('사용자 정보 수정 오류:', error);
      return NextResponse.json(
        { error: '사용자 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 업데이트된 사용자 정보에서 비밀번호 필드 확인
    console.log('✅ 사용자 수정 성공 - 업데이트된 필드들:', Object.keys(updatedUser));
    if (updateData.password) {
      console.log('✅ 비밀번호 필드 업데이트 확인됨');
    } else {
      console.log('⚠️ 비밀번호 필드 업데이트 없음');
    }

    return NextResponse.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      user: updatedUser
    });

  } catch (error) {
    console.error('사용자 정보 수정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Supabase 클라이언트 생성
    const supabase = createSupabaseClient();

    // 사용자 삭제 (user_profiles 테이블에서)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('사용자 삭제 오류:', error);
      return NextResponse.json(
        { error: '사용자 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('사용자 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
