import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    // 미정산내역 테이블에서 해당 고객의 슬롯 정보 조회
    const { data: slots, error } = await supabase
      .from('unsettled_details')
      .select('*')
      .eq('customerId', customerId)
      .eq('status', 'pending');

    if (error) {
      console.error('슬롯 정보 조회 실패:', error);
      return NextResponse.json(
        { error: '슬롯 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 고객 정보 조회
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('username', customerId)
      .single();

    if (customerError) {
      console.error('고객 정보 조회 실패:', customerError);
      return NextResponse.json(
        { error: '고객 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 등록된 작업 수 조회 (사용된 슬롯 수)
    const { data: usedSlots, error: usedSlotsError } = await supabase
      .from('customers')
      .select('slot_count')
      .eq('customer', `_PD_${customerId}`);

    if (usedSlotsError) {
      console.error('사용된 슬롯 조회 실패:', usedSlotsError);
      return NextResponse.json(
        { error: '사용된 슬롯 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    const totalUsedSlots = usedSlots?.reduce((sum, item) => sum + (item.slot_count || 0), 0) || 0;
    const totalSlots = slots?.reduce((sum, item) => sum + (item.slotCount || 0), 0) || 0;
    const remainingSlots = Math.max(0, totalSlots - totalUsedSlots);

    const slotInfo = {
      customerId,
      customerName: customerData?.name || customerId,
      totalSlots,
      usedSlots: totalUsedSlots,
      remainingSlots,
      slots: slots || []
    };

    return NextResponse.json(slotInfo);
  } catch (error) {
    console.error('고객 슬롯 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

