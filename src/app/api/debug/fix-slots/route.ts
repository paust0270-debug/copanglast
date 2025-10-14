import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, newStatus } = body;

    if (!slotId || !newStatus) {
      return NextResponse.json({
        success: false,
        error: '슬롯 ID와 새로운 상태가 필요합니다.'
      }, { status: 400 });
    }

    console.log('슬롯 상태 수정 시작:', { slotId, newStatus });

    // 허용된 상태 확인
    const allowedStatuses = ['active', 'inactive', 'expired', 'completed'];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json({
        success: false,
        error: `허용되지 않은 상태입니다. 허용된 상태: ${allowedStatuses.join(', ')}`
      }, { status: 400 });
    }

    // 슬롯 상태 업데이트
    const { data, error } = await supabase
      .from('slots')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)
      .select();

    if (error) {
      console.error('슬롯 상태 수정 오류:', error);
      return NextResponse.json({
        success: false,
        error: `슬롯 상태 수정 실패: ${error.message}`
      }, { status: 500 });
    }

    console.log('슬롯 상태 수정 성공:', data);

    return NextResponse.json({
      success: true,
      message: '슬롯 상태가 수정되었습니다.',
      data: data
    });

  } catch (error) {
    console.error('슬롯 상태 수정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}


