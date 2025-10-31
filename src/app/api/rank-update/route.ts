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
  };
  return mapping[slotType] || 'slot_status';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, slotType, username } = body;

    if (!customerId || !slotType || !username) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const tableName = getTableName(slotType);

    // 해당 테이블에서 해당 고객의 모든 슬롯 조회 (키워드가 있는 것만)
    const { data: slotStatusData, error: fetchError } = await supabase
      .from(tableName)
      .select('id, keyword, link_url, slot_sequence, customer_id, current_rank')
      .eq('customer_id', username)
      .not('keyword', 'eq', '')
      .not('keyword', 'is', null)
      .order('slot_sequence', { ascending: true });

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
    }));

    // keywords 테이블에 저장
    const { error: insertError } = await supabase
      .from('keywords')
      .insert(keywordRecords);

    if (insertError) {
      console.error('keywords 테이블 삽입 오류:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: `keywords 테이블 삽입 실패: ${insertError.message}`,
        },
        { status: 500 }
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
