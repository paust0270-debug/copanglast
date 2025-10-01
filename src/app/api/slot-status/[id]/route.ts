import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 특정 슬롯 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 슬롯 삭제 요청 - ID: ${id}`);

    // 삭제하기 전에 슬롯 정보 조회 (로깅용)
    const { data: slotInfo, error: fetchError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('삭제할 슬롯 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '삭제할 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`📋 삭제할 슬롯 정보:`, slotInfo);

    // slot_status 테이블에서 삭제
    const { error: deleteError } = await supabase
      .from('slot_status')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('슬롯 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: `슬롯 삭제 중 오류가 발생했습니다: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 삭제 완료 - ID: ${id}, 슬롯 개수: ${slotInfo.slot_count}`);

    // keywords 테이블에서 해당 키워드 정리 (분리 저장 방식)
    try {
      console.log('🔄 keywords 테이블에서 키워드 정리 중...');
      
      // 해당 슬롯의 키워드와 링크로 keywords 테이블에서 검색
      const { data: keywordsToDelete, error: findError } = await supabase
        .from('keywords')
        .select('*')
        .eq('keyword', slotInfo.keyword)
        .eq('link_url', slotInfo.link_url);

      if (findError) {
        console.error('keywords 테이블 조회 오류:', findError);
      } else if (keywordsToDelete && keywordsToDelete.length > 0) {
        // 해당 키워드가 keywords 테이블에 있으면 삭제
        const { error: deleteError } = await supabase
          .from('keywords')
          .delete()
          .eq('keyword', slotInfo.keyword)
          .eq('link_url', slotInfo.link_url);

        if (deleteError) {
          console.error('keywords 테이블 삭제 오류:', deleteError);
        } else {
          console.log(`✅ keywords 테이블에서 키워드 정리 완료: ${slotInfo.keyword}`);
        }
      } else {
        console.log('ℹ️ keywords 테이블에 해당 키워드가 없어서 정리할 필요 없음');
      }
    } catch (keywordError) {
      console.error('keywords 테이블 정리 예외:', keywordError);
      // keywords 정리 실패해도 슬롯 삭제는 성공으로 처리
      console.log('⚠️ keywords 정리 실패했지만 슬롯 삭제는 성공');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        slot_count: slotInfo.slot_count,
        keyword: slotInfo.keyword
      },
      message: '슬롯이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 삭제 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 슬롯 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔍 슬롯 조회 요청 - ID: ${id}`);

    const { data, error } = await supabase
      .from('slot_status')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('슬롯 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '슬롯 조회 성공'
    });

  } catch (error) {
    console.error('슬롯 조회 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 슬롯 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`✏️ 슬롯 수정 요청 - ID: ${id}`, body);

    const { data, error } = await supabase
      .from('slot_status')
      .update({
        ...body
        // updated_at은 만료일이므로 수정 시 변경하지 않음
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('슬롯 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: `슬롯 수정 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 수정 완료 - ID: ${id}`);

    // keywords 테이블 동기화 (키워드나 링크가 변경된 경우)
    if (body.keyword || body.link_url) {
      try {
        console.log('🔄 keywords 테이블 동기화 중...');
        
        // 기존 keywords에서 해당 슬롯의 키워드 찾기
        const { data: existingKeywords, error: findError } = await supabase
          .from('keywords')
          .select('*')
          .eq('keyword', data.keyword)
          .eq('link_url', data.link_url);

        if (findError) {
          console.error('기존 키워드 조회 오류:', findError);
        } else if (existingKeywords && existingKeywords.length > 0) {
          // 기존 키워드가 있으면 업데이트
          const { error: updateError } = await supabase
            .from('keywords')
            .update({
              keyword: data.keyword,
              link_url: data.link_url,
              slot_type: data.slot_type || 'coupang',
              // updated_at은 만료일이므로 수정 시 변경하지 않음
            })
            .eq('id', existingKeywords[0].id);

          if (updateError) {
            console.error('keywords 테이블 업데이트 오류:', updateError);
          } else {
            console.log('✅ keywords 테이블 동기화 완료');
          }
        } else {
          // 기존 키워드가 없으면 새로 추가
          const { error: insertError } = await supabase
            .from('keywords')
            .insert({
              slot_type: data.slot_type || 'coupang',
              keyword: data.keyword,
              link_url: data.link_url,
              slot_count: 1,
              current_rank: null,
              last_check_date: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('.')[0]
            });

          if (insertError) {
            console.error('keywords 테이블 삽입 오류:', insertError);
          } else {
            console.log('✅ keywords 테이블에 새 키워드 추가 완료');
          }
        }
      } catch (keywordError) {
        console.error('keywords 테이블 동기화 예외:', keywordError);
        // keywords 동기화 실패해도 슬롯 수정은 성공으로 처리
        console.log('⚠️ keywords 동기화 실패했지만 슬롯 수정은 성공');
      }
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      message: '슬롯이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 수정 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


