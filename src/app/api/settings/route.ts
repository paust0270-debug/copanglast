import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 환경설정 조회
export async function GET(request: NextRequest) {
  try {
    // 항상 표시할 슬롯 타입 목록 (각각 다른 테이블에 있음)
    const requiredSlotTypes = ['쿠팡', '쿠팡APP', '쿠팡VIP', '쿠팡순위체크'];

    // 2. 기존 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('slot_type_settings')
      .select('*')
      .order('slot_type', { ascending: true });

    if (settingsError) {
      console.error('환경설정 조회 오류:', settingsError);
      // 테이블이 없을 수 있으므로 빈 배열로 처리
      if (
        settingsError.code === 'PGRST116' ||
        settingsError.message?.includes('does not exist')
      ) {
        // 테이블이 없는 경우 빈 설정 반환
        const result = requiredSlotTypes.map(slotType => ({
          slot_type: slotType,
          interval_hours: 0,
        }));
        return NextResponse.json({
          success: true,
          data: result,
        });
      }
      // 다른 에러는 500 반환
      throw settingsError;
    }

    // 3. slot_type별로 설정값 매핑 (기존 설정이 있으면 사용, 없으면 0)
    const settingsMap = new Map(
      (settings || []).map((s: any) => [s.slot_type, s.interval_hours || 0])
    );

    // 4. 필수 슬롯 타입에 대한 설정값 반환 (항상 표시)
    const result = requiredSlotTypes.map(slotType => ({
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

    // upsert 방식으로 변경 (더 안전하고 효율적)
    const upsertData = settings.map((s: any) => ({
      slot_type: s.slot_type,
      interval_hours: s.interval_hours || 0,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('slot_type_settings')
      .upsert(upsertData, {
        onConflict: 'slot_type',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('환경설정 저장 오류:', upsertError);

      // 테이블이 없는 경우 에러 메시지 반환
      if (
        upsertError.code === 'PGRST116' ||
        upsertError.message?.includes('does not exist')
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'slot_type_settings 테이블이 존재하지 않습니다. create-scheduler-tables.sql 파일을 실행해주세요.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `환경설정 저장에 실패했습니다: ${upsertError.message}`,
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
