import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 슬롯 타입별 테이블 매핑
const getTableName = (slotType: string) => {
  const mapping: Record<string, string> = {
    쿠팡: 'slot_status',
    쿠팡APP: 'slot_coupangapp',
    쿠팡VIP: 'slot_coupangvip',
    쿠팡순위체크: 'slot_copangrank',
    네이버쇼핑: 'slot_naver',
    N쇼핑순위체크: 'slot_naverrank',
    플레이스: 'slot_place',
    N플레이스순위체크: 'slot_placerank',
    오늘의집: 'slot_todayhome',
    알리익스프레스: 'slot_aliexpress',
  };
  return mapping[slotType] || 'slot_status';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, slotType, username, slotIds } = body; // 🔥 slotIds 추가

    // 🔥 username과 slotType은 필수, customerId는 선택적 (slotIds가 있으면 불필요)
    if (!username || !slotType) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다. (username, slotType 필수)',
        },
        { status: 400 }
      );
    }

    // 🔥 slotIds가 없거나 빈 배열이고 customerId도 없으면 오류
    const hasSlotIds = slotIds && Array.isArray(slotIds) && slotIds.length > 0;
    if (!hasSlotIds && !customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId 또는 slotIds가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서버 사이드 쿨다운 체크 (1시간 = 3600000ms)
    const { data: lastRankUpdate, error: cooldownFetchError } = await supabase
      .from('keywords')
      .select('created_at')
      .eq('customer_id', username)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!cooldownFetchError && lastRankUpdate && lastRankUpdate.created_at) {
      const lastUpdate = new Date(lastRankUpdate.created_at);
      const now = new Date();
      const elapsedMs = now.getTime() - lastUpdate.getTime();
      const oneHourMs = 60 * 60 * 1000; // 1시간

      if (elapsedMs < oneHourMs) {
        const remainingMs = oneHourMs - elapsedMs;
        const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
        const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

        return NextResponse.json(
          {
            success: false,
            error: '쿨다운',
            cooldownRemaining: remainingMs / 1000, // 초 단위
            message: `순위갱신은 1시간마다 사용할 수 있습니다. 남은 시간: ${remainingMinutes}분 ${remainingSeconds}초`,
          },
          { status: 429 }
        );
      }
    }

    const tableName = getTableName(slotType);

    // 🔥 선택된 슬롯 ID가 있으면 해당 슬롯만 조회, 없으면 전체 조회
    let query = supabase
      .from(tableName)
      .select('id, keyword, link_url, slot_sequence, customer_id, current_rank')
      .eq('customer_id', username)
      .not('keyword', 'eq', '')
      .not('keyword', 'is', null);

    // 🔥 선택된 슬롯 ID가 있으면 필터링
    if (hasSlotIds) {
      // ID를 숫자로 변환 (문자열일 수 있음)
      const numericSlotIds = slotIds
        .map(id => (typeof id === 'string' ? parseInt(id) : id))
        .filter(id => !isNaN(id));
      console.log('🔵 필터링할 슬롯 ID:', numericSlotIds);

      if (numericSlotIds.length > 0) {
        query = query.in('id', numericSlotIds);
      } else {
        console.error('🔴 유효한 슬롯 ID가 없습니다:', slotIds);
        return NextResponse.json(
          { success: false, error: '유효하지 않은 슬롯 ID입니다.' },
          { status: 400 }
        );
      }
    }

    const { data: slotStatusData, error: fetchError } = await query.order(
      'slot_sequence',
      { ascending: true }
    );

    console.log('🔵 조회된 슬롯 개수:', slotStatusData?.length || 0);

    if (fetchError) {
      console.error('슬롯 데이터 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '슬롯 데이터 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!slotStatusData || slotStatusData.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록된 슬롯이 없습니다.' },
        { status: 404 }
      );
    }

    // current_rank 처리 (DB에서 INTEGER로 변경되었으므로 숫자 그대로 사용)
    const getRankNumber = (rank: number | string | null) => {
      if (rank === null || rank === undefined) return null;
      if (typeof rank === 'number') return rank;
      if (typeof rank === 'string') {
        const match = rank.match(/^(\d+)/);
        return match ? parseInt(match[1]) : null;
      }
      return null;
    };

    // 🔥 현재 시간 (한국 시간 기준, UTC+9)
    const currentDateKST = new Date(
      new Date().getTime() + 9 * 60 * 60 * 1000
    ).toISOString();

    // keywords 테이블에 삽입할 데이터 생성 (슬롯 등록과 동일한 구조)
    const keywordRecords = slotStatusData.map(slot => ({
      keyword: slot.keyword,
      link_url: slot.link_url,
      slot_type: slotType,
      slot_count: 1,
      current_rank: getRankNumber(slot.current_rank), // INTEGER 또는 문자열 모두 처리
      slot_sequence: slot.slot_sequence,
      customer_id: slot.customer_id,
      slot_id: slot.id,
      // 🔥 이전 체크일 기록 (순위갱신 요청 시점)
      last_check_date: currentDateKST,
    }));

    // keywords 테이블에 저장
    console.log('🔵 keywords 테이블에 삽입할 데이터:', {
      개수: keywordRecords.length,
      샘플: keywordRecords.slice(0, 2),
      slotType: slotType,
    });

    const { data: insertedData, error: insertError } = await supabase
      .from('keywords')
      .insert(keywordRecords)
      .select();

    if (insertError) {
      console.error('❌ keywords 테이블 삽입 오류:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: `keywords 테이블 삽입 실패: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    console.log('✅ keywords 테이블 삽입 성공:', {
      삽입된개수: insertedData?.length || 0,
      샘플: insertedData?.slice(0, 2),
    });

    // 🔥 원본 슬롯 테이블에도 last_check_date 업데이트
    const slotIdsToUpdate = slotStatusData.map(slot => slot.id);
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ last_check_date: currentDateKST })
      .in('id', slotIdsToUpdate);

    if (updateError) {
      console.error('슬롯 테이블 last_check_date 업데이트 오류:', updateError);
      // 업데이트 실패해도 keywords 테이블 삽입은 성공했으므로 계속 진행 (경고만 로그)
    } else {
      console.log(
        `✅ 원본 슬롯 테이블(${tableName}) last_check_date 업데이트 완료: ${slotIdsToUpdate.length}개`
      );
    }

    console.log(
      `✅ 순위갱신 완료: ${keywordRecords.length}개 슬롯이 keywords 테이블에 등록되었습니다.`
    );

    return NextResponse.json({
      success: true,
      count: keywordRecords.length,
      message: `${keywordRecords.length}개의 슬롯이 keywords 테이블에 등록되었습니다.`,
    });
  } catch (error) {
    console.error('순위갱신 API 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
