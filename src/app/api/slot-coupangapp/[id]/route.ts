import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTimestampWithoutMs } from '@/lib/utils';

// 특정 쿠팡APP 슬롯 삭제 (날짜 정보 보존)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 쿠팡APP 슬롯 삭제 요청 - ID: ${id}`);

    // 삭제하기 전에 슬롯 정보 조회 (로깅용)
    const { data: slotInfo, error: fetchError } = await supabase
      .from('slot_coupangapp')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('삭제할 쿠팡APP 슬롯 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '삭제할 쿠팡APP 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`📋 삭제할 쿠팡APP 슬롯 정보:`, slotInfo);

    // 날짜 정보 보존을 위해 초기화 (삭제 대신 빈 상태로 리셋)
    const resetData = {
      distributor: '일반',
      work_group: '공통',
      keyword: '', // 빈 문자열로 리셋
      link_url: '', // 빈 문자열로 리셋
      current_rank: null,
      start_rank: null,
      traffic: '',
      equipment_group: '지정안함',
      status: '작동중',
      memo: '',
      slot_type: '쿠팡APP',
      updated_at: getTimestampWithoutMs(), // 초기화 시 업데이트 시간 갱신
      // usage_days, created_at, expiry_date는 보존 (변경하지 않음)
    };

    console.log('🔄 쿠팡APP 슬롯 초기화 중 (날짜 정보 보존)...');

    const { data: resetSlot, error: resetError } = await supabase
      .from('slot_coupangapp')
      .update(resetData)
      .eq('id', id)
      .select()
      .single();

    if (resetError) {
      console.error('쿠팡APP 슬롯 초기화 오류:', resetError);
      return NextResponse.json(
        {
          success: false,
          error: `쿠팡APP 슬롯 초기화 중 오류가 발생했습니다: ${resetError.message}`,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 쿠팡APP 슬롯 초기화 완료 - ID: ${id}, 날짜 정보 보존됨`);

    // keywords 테이블에서 해당 키워드 정리
    try {
      console.log('🔄 keywords 테이블에서 쿠팡APP 키워드 정리 중...');

      if (slotInfo.keyword) {
        const { data: keywordsToDelete, error: findError } = await supabase
          .from('keywords')
          .select('*')
          .eq('keyword', slotInfo.keyword)
          .eq('link_url', slotInfo.link_url)
          .eq('slot_type', '쿠팡APP');

        if (findError) {
          console.error('keywords 테이블 조회 오류:', findError);
        } else if (keywordsToDelete && keywordsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('keywords')
            .delete()
            .eq('keyword', slotInfo.keyword)
            .eq('link_url', slotInfo.link_url)
            .eq('slot_type', '쿠팡APP');

          if (deleteError) {
            console.error('keywords 테이블 삭제 오류:', deleteError);
          } else {
            console.log(
              `✅ keywords 테이블에서 쿠팡APP 키워드 정리 완료: ${slotInfo.keyword}`
            );
          }
        }
      }
    } catch (keywordError) {
      console.error('keywords 테이블 정리 예외:', keywordError);
      console.log('⚠️ keywords 정리 실패했지만 쿠팡APP 슬롯 초기화는 성공');
    }

    // traffic 테이블에서도 해당 키워드 정리
    try {
      console.log('🔄 traffic 테이블에서 쿠팡APP 키워드 정리 중...');

      if (slotInfo.keyword) {
        const { data: trafficToDelete, error: findError } = await supabase
          .from('traffic')
          .select('*')
          .eq('keyword', slotInfo.keyword)
          .eq('link_url', slotInfo.link_url)
          .eq('slot_type', '쿠팡APP');

        if (findError) {
          console.error('traffic 테이블 조회 오류:', findError);
        } else if (trafficToDelete && trafficToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('traffic')
            .delete()
            .eq('keyword', slotInfo.keyword)
            .eq('link_url', slotInfo.link_url)
            .eq('slot_type', '쿠팡APP');

          if (deleteError) {
            console.error('traffic 테이블 삭제 오류:', deleteError);
          } else {
            console.log(
              `✅ traffic 테이블에서 쿠팡APP 키워드 정리 완료: ${slotInfo.keyword}`
            );
          }
        }
      }
    } catch (trafficError) {
      console.error('traffic 테이블 정리 예외:', trafficError);
      console.log('⚠️ traffic 정리 실패했지만 쿠팡APP 슬롯 초기화는 성공');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        slot_count: slotInfo.slot_count,
        keyword: slotInfo.keyword,
        usage_days: slotInfo.usage_days,
        created_at: slotInfo.created_at,
        updated_at: slotInfo.updated_at,
      },
      message: '쿠팡APP 슬롯이 성공적으로 초기화되었습니다. (날짜 정보 보존)',
    });
  } catch (error) {
    console.error('쿠팡APP 슬롯 초기화 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 쿠팡APP 슬롯 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔍 쿠팡APP 슬롯 조회 요청 - ID: ${id}`);

    const { data, error } = await supabase
      .from('slot_coupangapp')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('쿠팡APP 슬롯 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '쿠팡APP 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '쿠팡APP 슬롯 조회 성공',
    });
  } catch (error) {
    console.error('쿠팡APP 슬롯 조회 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 쿠팡APP 슬롯 수정 (날짜 정보 보존)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`✏️ 쿠팡APP 슬롯 수정 요청 - ID: ${id}`, body);

    // 기존 데이터 조회 (잔여기간/등록일/만료일 보존용)
    const { data: existingData, error: fetchError } = await supabase
      .from('slot_coupangapp')
      .select('usage_days, created_at, updated_at, expiry_date')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('기존 쿠팡APP 데이터 조회 오류:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: '기존 쿠팡APP 슬롯 데이터를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 잔여기간/등록일/만료일은 기존 값으로 보존
    const { usage_days, created_at, updated_at, expiry_date, ...updateData } =
      body;
    console.log(
      `🔒 보존되는 필드: usage_days=${existingData.usage_days}, created_at=${existingData.created_at}, updated_at=${existingData.updated_at}`
    );
    console.log(`📝 업데이트되는 필드:`, updateData);

    // 기존의 잔여기간/등록일/만료일을 명시적으로 포함하여 업데이트
    const { data, error } = await supabase
      .from('slot_coupangapp')
      .update({
        ...updateData,
        usage_days: existingData.usage_days,
        created_at: existingData.created_at,
        updated_at: getTimestampWithoutMs(),
        expiry_date: existingData.expiry_date,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('쿠팡APP 슬롯 수정 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: `쿠팡APP 슬롯 수정 중 오류가 발생했습니다: ${error.message}`,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 쿠팡APP 슬롯 수정 완료 - ID: ${id}`);

    // keywords 테이블 동기화 (키워드나 링크가 변경된 경우)
    if (body.keyword || body.link_url) {
      try {
        console.log('🔄 keywords 테이블 쿠팡APP 동기화 중...');

        const { data: existingKeywords, error: findError } = await supabase
          .from('keywords')
          .select('*')
          .eq('keyword', data.keyword)
          .eq('link_url', data.link_url)
          .eq('slot_type', '쿠팡APP');

        if (findError) {
          console.error('기존 쿠팡APP 키워드 조회 오류:', findError);
        } else if (existingKeywords && existingKeywords.length > 0) {
          const { error: updateError } = await supabase
            .from('keywords')
            .update({
              keyword: data.keyword,
              link_url: data.link_url,
              slot_type: '쿠팡APP',
            })
            .eq('id', existingKeywords[0].id);

          if (updateError) {
            console.error(
              'keywords 테이블 쿠팡APP 업데이트 오류:',
              updateError
            );
          } else {
            console.log('✅ keywords 테이블 쿠팡APP 동기화 완료');
          }
        } else {
          const { error: insertError } = await supabase
            .from('keywords')
            .insert({
              slot_type: '쿠팡APP',
              keyword: data.keyword,
              link_url: data.link_url,
              slot_count: 1,
              current_rank: null,
              last_check_date: new Date(
                new Date().getTime() + 9 * 60 * 60 * 1000
              )
                .toISOString()
                .split('.')[0],
            });

          if (insertError) {
            console.error('keywords 테이블 쿠팡APP 삽입 오류:', insertError);
          } else {
            console.log('✅ keywords 테이블에 새 쿠팡APP 키워드 추가 완료');
          }
        }
      } catch (keywordError) {
        console.error('keywords 테이블 쿠팡APP 동기화 예외:', keywordError);
        console.log('⚠️ keywords 동기화 실패했지만 쿠팡APP 슬롯 수정은 성공');
      }
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '쿠팡APP 슬롯이 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('쿠팡APP 슬롯 수정 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
