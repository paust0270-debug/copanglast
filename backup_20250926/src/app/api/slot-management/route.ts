import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserSlotInfo, 
  changeSlotStatus, 
  checkSlotExpiry,
  getUserSlotDetails 
} from '@/lib/slot-management';

// 사용자별 슬롯 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'info':
        const slotInfo = await getUserSlotInfo(userId);
        return NextResponse.json(slotInfo);
      
      case 'details':
        const slotDetails = await getUserSlotDetails(userId);
        return NextResponse.json(slotDetails);
      
      case 'expiry':
        const expiryResult = await checkSlotExpiry();
        return NextResponse.json(expiryResult);
      
      default:
        const defaultInfo = await getUserSlotInfo(userId);
        return NextResponse.json(defaultInfo);
    }
  } catch (error) {
    console.error('슬롯 정보 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 상태 변경
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, newStatus } = body;

    if (!slotId || !newStatus) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID와 새 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await changeSlotStatus(slotId, newStatus);
    return NextResponse.json(result);
  } catch (error) {
    console.error('슬롯 상태 변경 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
