import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 키워드 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const keywordId = parseInt(id);
    const body = await request.json();
    const { slot_type, keyword, link_url, slot_count, current_rank } = body;

    console.log('✏️ 키워드 수정:', { keywordId, slot_type, keyword, link_url, slot_count, current_rank });

    if (!keyword || !link_url) {
      return NextResponse.json(
        { success: false, error: '키워드와 링크 주소는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('keywords')
      .update({
        slot_type: slot_type || 'coupang',
        keyword,
        link_url,
        slot_count: slot_count || 1,
        current_rank: current_rank || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', keywordId)
      .select()
      .single();

    if (error) {
      console.error('키워드 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: '키워드 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 키워드 수정 완료:', data.id);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('키워드 수정 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 키워드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const keywordId = parseInt(id);

    console.log('🗑️ 키워드 삭제:', { keywordId });

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', keywordId);

    if (error) {
      console.error('키워드 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: '키워드 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 키워드 삭제 완료:', keywordId);

    return NextResponse.json({
      success: true,
      message: '키워드가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('키워드 삭제 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
