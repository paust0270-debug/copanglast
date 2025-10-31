import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 환경설정 조회
export async function GET(request: NextRequest) {
  try {
    // 1. slot_status 테이블에서 고유한 slot_type 목록 가져오기
    const { data: slotTypes, error: slotTypesError } = await supabase
      .from('slot_status')
      .select('slot_type')
      .not('slot_type', 'is', null)
      .not('slot_type', 'eq', '');

    if (slotTypesError) {
      console.error('slot_type 조회 오류:', slotTypesError);
      return NextResponse.json(
        {
          success: false,
          error: 'slot_type 조회에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 고유한 slot_type 추출
    const uniqueSlotTypes = [
      ...new Set((slotTypes || []).map((s: any) => s.slot_type)),
    ].filter(Boolean) as string[];

    // 2. 기존 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('slot_type_settings')
      .select('*')
      .order('slot_type', { ascending: true });

    if (settingsError) {
      console.error('환경설정 조회 오류:', settingsError);
      // 설정 조회 실패해도 계속 진행
    }

    // 3. slot_type별로 설정값 매핑 (기존 설정이 있으면 사용, 없으면 0)
    const settingsMap = new Map(
      (settings || []).map((s: any) => [s.slot_type, s.interval_hours || 0])
    );

    // 4. 모든 고유한 slot_type에 대한 설정값 반환
    const result = uniqueSlotTypes.map(slotType => ({
      slot_type: slotType,
      interval_hours: settingsMap.get(slotType) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('환경설정 조회 예외:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 환경설정 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        {
          success: false,
          error: '설정 데이터가 올바르지 않습니다.',
        },
        { status: 400 }
      );
    }

    // 기존 설정 삭제 후 새로 삽입
    const { error: deleteError } = await supabase
      .from('slot_type_settings')
      .delete()
      .neq('id', 0); // 모든 레코드 삭제

    if (deleteError) {
      console.error('기존 설정 삭제 오류:', deleteError);
    }

    // 새 설정 삽입
    const insertData = settings.map((s: any) => ({
      slot_type: s.slot_type,
      interval_hours: s.interval_hours || 0,
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('slot_type_settings')
      .insert(insertData);

    if (insertError) {
      console.error('환경설정 저장 오류:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: '환경설정 저장에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '환경설정이 저장되었습니다.',
    });
  } catch (error) {
    console.error('환경설정 저장 예외:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
