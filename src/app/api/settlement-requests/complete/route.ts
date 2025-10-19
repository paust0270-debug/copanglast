import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTimestampWithoutMs } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotIds, settlementData, isEditMode, settlementHistoryId } = body;

    if (!slotIds || !Array.isArray(slotIds) || !settlementData) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 데이터가 올바르지 않습니다.',
        },
        { status: 400 }
      );
    }

    // slotIds 안전성 검증 및 변환
    const safeSlotIds = slotIds
      .map(id => {
        const numericId = parseInt(id);
        return isNaN(numericId) ? 0 : numericId;
      })
      .filter(id => id > 0);

    console.log('정산 완료 처리 시작:', {
      originalSlotIds: slotIds,
      safeSlotIds,
      settlementData,
      isEditMode,
    });

    if (safeSlotIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 정산 ID가 없습니다.',
        },
        { status: 400 }
      );
    }

    // 1. settlements 테이블에서 데이터 조회 (원래 구조)
    const { data: settlementsData, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .in('id', safeSlotIds);

    if (fetchError) {
      console.error('정산 데이터 조회 오류:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: '정산 데이터를 조회하는 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    if (!settlementsData || settlementsData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '정산할 데이터를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 각 항목의 payment_type 확인
    console.log('정산 데이터 payment_type 확인:');
    settlementsData.forEach((item, index) => {
      console.log(`항목 ${index + 1}:`, {
        id: item.id,
        payment_type: item.payment_type,
        customer_id: item.customer_id,
      });
    });

    console.log('조회된 정산 데이터:', settlementsData.length, '개');

    // 2. settlement_history 테이블에 합산된 하나의 데이터로 삽입 (정산완료 기록)
    const batchId = `batch_${Date.now()}`;
    const currentDateTime = new Date().toISOString();

    // 선택된 항목들을 하나의 합산 데이터로 생성 (원래 구조)
    const totalSlotCount = settlementsData.reduce((sum, item) => {
      const slotCount = parseInt(item.slot_count);
      return sum + (isNaN(slotCount) ? 1 : slotCount);
    }, 0);

    const totalPaymentAmount = (() => {
      const depositAmount = parseInt(settlementData.total_deposit_amount);
      if (!isNaN(depositAmount)) return depositAmount;

      return settlementsData.reduce((sum, item) => {
        const paymentAmount = parseInt(item.payment_amount);
        return sum + (isNaN(paymentAmount) ? 0 : paymentAmount);
      }, 0);
    })();

    // 대표 데이터 선택 (첫 번째 항목 기준)
    const representativeItem = settlementsData[0];

    // 카테고리 결정 (혼합된 경우 우선순위: 입금 > 연장 > 일반)
    const categories = [
      ...new Set(
        settlementsData.map(item =>
          item.payment_type === 'extension'
            ? '연장'
            : item.payment_type === 'deposit'
              ? '입금'
              : '일반'
        )
      ),
    ];

    let finalCategory;
    if (categories.length === 1) {
      finalCategory = categories[0];
    } else {
      // 혼합된 경우 우선순위에 따라 결정
      if (categories.includes('입금')) {
        finalCategory = '입금';
      } else if (categories.includes('연장')) {
        finalCategory = '연장';
      } else {
        finalCategory = '일반';
      }
    }

    console.log('카테고리 결정:', { categories, finalCategory });

    // 다음 순번 계산 (기존 데이터 개수 + 1)
    const { count: existingCount, error: countError } = await supabase
      .from('settlement_history')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('순번 계산을 위한 카운트 조회 오류:', countError);
    }

    const nextSequentialNumber = (existingCount || 0) + 1;
    console.log('다음 순번:', nextSequentialNumber);

    const settlementHistoryData = {
      sequential_number: nextSequentialNumber,
      category: finalCategory,
      distributor_name:
        settlementData.distributor_name ||
        representativeItem.distributor_name ||
        '총판A',
      customer_id: settlementData.customer_id || representativeItem.customer_id,
      customer_name:
        settlementData.customer_name ||
        representativeItem.customer_name ||
        settlementData.customer_id ||
        representativeItem.customer_id,
      slot_addition_date:
        settlementData.slot_addition_date ||
        representativeItem.slot_addition_date ||
        new Date().toISOString().split('T')[0],
      slot_type:
        settlementData.slot_type || representativeItem.slot_type || 'mixed',
      slot_count: totalSlotCount,
      payer_name:
        settlementData.payer_name || representativeItem.payer_name || '입금자',
      payment_amount: totalPaymentAmount,
      usage_days:
        settlementData.usage_days || representativeItem.usage_days || 0,
      memo: settlementData.memo || representativeItem.memo || '',
      status: 'completed',
      payment_type: 'batch', // 합산된 데이터임을 표시
      created_at: currentDateTime,
      completed_at: currentDateTime,
      settlement_batch_id: batchId,
      original_settlement_item_id: null,
    };

    console.log('정산 내역 저장 데이터:', settlementHistoryData);

    let insertedData;

    if (isEditMode && settlementHistoryId) {
      // 수정 모드: 기존 settlement_history 업데이트
      console.log(
        '수정 모드: settlement_history 업데이트, ID:',
        settlementHistoryId
      );

      // 안전하게 필수 필드만 업데이트
      const updateFields: Record<string, unknown> = {};

      if (settlementData.payer_name !== undefined) {
        updateFields.payer_name = settlementData.payer_name;
      }

      if (settlementData.totalAmount !== undefined) {
        updateFields.payment_amount = parseInt(settlementData.totalAmount) || 0;
      }

      if (settlementData.memo !== undefined) {
        updateFields.memo = settlementData.memo;
      }

      console.log('업데이트할 필드들:', updateFields);

      const { data: updatedData, error: updateError } = await supabase
        .from('settlement_history')
        .update(updateFields)
        .eq('id', settlementHistoryId)
        .select();

      if (updateError) {
        console.error('정산 내역 업데이트 오류:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: '정산 내역 업데이트 중 오류가 발생했습니다.',
          },
          { status: 500 }
        );
      }

      insertedData = updatedData;
      console.log('정산 내역 업데이트 완료:', insertedData.length, '개 항목');
    } else {
      // 일반 모드: 새로운 settlement_history 삽입
      const { data: newData, error: insertError } = await supabase
        .from('settlement_history')
        .insert([settlementHistoryData])
        .select();

      if (insertError) {
        console.error('정산 내역 저장 오류:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: '정산 내역 저장 중 오류가 발생했습니다.',
          },
          { status: 500 }
        );
      }

      insertedData = newData;
      console.log('정산 내역 저장 완료:', insertedData.length, '개 항목');
    }

    // 3. settlements 테이블에서 해당 항목들의 상태를 'history'로 업데이트 (삭제 대신 상태 변경)
    // 정산수정을 위해 원본 데이터는 보존하고 상태만 변경
    const { error: updateError } = await supabase
      .from('settlements')
      .update({
        status: 'history',
        updated_at: getTimestampWithoutMs(),
      })
      .in('id', safeSlotIds);

    if (updateError) {
      console.error('정산 데이터 상태 업데이트 오류:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: '정산 데이터 상태 업데이트 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log(
      '정산 데이터 상태 업데이트 완료 (history):',
      safeSlotIds.length,
      '개 항목'
    );

    // 4. 정산 수정용 원본 데이터를 settlement_edit_items 테이블에 저장
    const createdSettlementId = insertedData[0]?.id;
    if (createdSettlementId) {
      console.log(
        '정산 수정용 원본 데이터 저장 시작, settlement_history_id:',
        createdSettlementId
      );

      const editItemsData = settlementsData.map(settlement => ({
        settlement_history_id: createdSettlementId,
        original_settlement_id: settlement.id,
        customer_id: settlement.customer_id,
        customer_name: settlement.customer_name,
        distributor_name: settlement.distributor_name,
        slot_type: settlement.slot_type,
        slot_count: settlement.slot_count,
        payment_type: settlement.payment_type,
        payer_name: settlement.payer_name,
        payment_amount: settlement.payment_amount,
        usage_days: settlement.usage_days,
        memo: settlement.memo,
        status: 'pending',
      }));

      const { error: editItemsError } = await supabase
        .from('settlement_edit_items')
        .insert(editItemsData);

      if (editItemsError) {
        console.error('정산 수정용 데이터 저장 오류:', editItemsError);
        // 에러가 발생해도 정산 완료는 계속 진행
      } else {
        console.log(
          '정산 수정용 원본 데이터 저장 완료:',
          editItemsData.length,
          '개 항목'
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        batchId: batchId,
        totalItemsCount: insertedData.length,
        deletedItemsCount: safeSlotIds.length,
        insertedData: insertedData,
      },
      message: '정산이 성공적으로 완료되었습니다.',
    });
  } catch (error) {
    console.error('정산 완료 처리 중 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '정산 완료 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
