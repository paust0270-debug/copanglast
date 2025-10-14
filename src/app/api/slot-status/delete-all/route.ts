import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 고객의 모든 슬롯 전체 삭제 (날짜 정보 보존)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: '고객 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 전체 슬롯 삭제 요청 - 고객 ID: ${customerId}`);

    // 삭제하기 전에 슬롯 정보 조회 (로깅용)
    const { data: slotInfoList, error: fetchError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', customerId);

    if (fetchError) {
      console.error('삭제할 슬롯 목록 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '삭제할 슬롯 목록을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    console.log(`📋 삭제할 슬롯 수: ${slotInfoList?.length || 0}개`);

    if (!slotInfoList || slotInfoList.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 슬롯이 없습니다.' },
        { status: 404 }
      );
    }

    // 날짜 정보 보존을 위해 모든 슬롯을 초기화 (삭제 대신 빈 상태로 리셋)
    const resetData = {
      distributor: '일반',
      work_group: '공통',
      keyword: '', // 빈 문자열로 리셋
      link_url: '', // 빈 문자열로 리셋
      current_rank: '',
      start_rank: '',
      traffic: '',
      equipment_group: '지정안함',
      status: '작동중',
      memo: '',
      slot_type: '쿠팡'
      // usage_days, created_at, updated_at, expiry_date는 보존 (변경하지 않음)
    };

    console.log('🔄 모든 슬롯 초기화 중 (날짜 정보 보존)...');

    const { data: resetSlots, error: resetError } = await supabase
      .from('slot_status')
      .update(resetData)
      .eq('customer_id', customerId)
      .select();

    if (resetError) {
      console.error('슬롯 전체 초기화 오류:', resetError);
      return NextResponse.json(
        { success: false, error: `슬롯 전체 초기화 중 오류가 발생했습니다: ${resetError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 전체 초기화 완료 - ${resetSlots?.length || 0}개, 날짜 정보 보존됨`);

    // keywords 테이블에서 해당 고객의 모든 키워드 정리
    try {
      console.log('🔄 keywords 테이블에서 키워드 정리 중...');
      
      const keywordsToDelete = slotInfoList
        .filter(slot => slot.keyword && slot.keyword.trim() !== '')
        .map(slot => ({ keyword: slot.keyword, link_url: slot.link_url }));

      if (keywordsToDelete.length > 0) {
        for (const keywordInfo of keywordsToDelete) {
          const { error: deleteError } = await supabase
            .from('keywords')
            .delete()
            .eq('keyword', keywordInfo.keyword)
            .eq('link_url', keywordInfo.link_url);

          if (deleteError) {
            console.error(`keywords 테이블 삭제 오류 (${keywordInfo.keyword}):`, deleteError);
          } else {
            console.log(`✅ keywords 테이블에서 키워드 정리 완료: ${keywordInfo.keyword}`);
          }
        }
      }
    } catch (keywordError) {
      console.error('keywords 테이블 정리 예외:', keywordError);
      console.log('⚠️ keywords 정리 실패했지만 슬롯 초기화는 성공');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        customer_id: customerId,
        reset_count: resetSlots?.length || 0,
        preserved_dates: slotInfoList.map(slot => ({
          id: slot.id,
          usage_days: slot.usage_days,
          created_at: slot.created_at,
          updated_at: slot.updated_at
        }))
      },
      message: `${resetSlots?.length || 0}개 슬롯이 성공적으로 초기화되었습니다. (날짜 정보 보존)`
    });

  } catch (error) {
    console.error('슬롯 전체 초기화 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
