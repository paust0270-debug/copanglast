import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 사용자별 슬롯 정보 조회
export async function getUserSlotInfo(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_slot_info', { user_id_param: userId });

    if (error) {
      console.error('사용자 슬롯 정보 조회 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] || null };
  } catch (error) {
    console.error('사용자 슬롯 정보 조회 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 슬롯 상태 변경
export async function changeSlotStatus(slotId: number, newStatus: string) {
  try {
    // 직접 슬롯 테이블 업데이트
    const { data, error } = await supabase
      .from('slots')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)
      .select();

    if (error) {
      console.error('슬롯 상태 변경 실패:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: '슬롯을 찾을 수 없습니다.' };
    }

    console.log('✅ 슬롯 상태 변경 성공:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('슬롯 상태 변경 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 슬롯 만료 체크
export async function checkSlotExpiry() {
  try {
    const { data, error } = await supabase
      .rpc('check_slot_expiry');

    if (error) {
      console.error('슬롯 만료 체크 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('슬롯 만료 체크 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 사용자별 슬롯 현황 조회 (상세)
export async function getUserSlotDetails(userId: string) {
  try {
    // 사용자 기본 정보
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', userId)
      .single();

    if (userError) {
      console.error('사용자 정보 조회 실패:', userError);
      return { success: false, error: userError.message };
    }

    // 슬롯별 상세 정보
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (slotsError) {
      console.error('슬롯 상세 정보 조회 실패:', slotsError);
      return { success: false, error: slotsError.message };
    }

    // 작업 등록된 슬롯 정보
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('name', userData.name)
      .eq('status', '작동중');

    if (customersError) {
      console.error('작업 등록 정보 조회 실패:', customersError);
      return { success: false, error: customersError.message };
    }

    // 슬롯별 통계 계산
    const slotStats = {
      total: slotsData.reduce((sum, slot) => sum + slot.slot_count, 0),
      active: slotsData.filter(s => s.status === 'active').reduce((sum, slot) => sum + slot.slot_count, 0),
      expired: slotsData.filter(s => s.status === 'expired').reduce((sum, slot) => sum + slot.slot_count, 0),
      suspended: slotsData.filter(s => s.status === 'suspended').reduce((sum, slot) => sum + slot.slot_count, 0),
      used: customersData.reduce((sum, customer) => sum + customer.slot_count, 0)
    };

    return {
      success: true,
      data: {
        user: userData,
        slots: slotsData,
        customers: customersData,
        stats: slotStats
      }
    };
  } catch (error) {
    console.error('사용자 슬롯 상세 정보 조회 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 슬롯 추가 시 사용자 슬롯 정보 업데이트
export async function updateUserSlotsAfterSlotAdd(customerId: string, slotCount: number) {
  try {
    // 슬롯 추가 후 사용자 슬롯 정보 자동 업데이트 (트리거에 의해 처리됨)
    // 추가적인 로직이 필요한 경우 여기에 구현
    
    return { success: true, message: '슬롯 정보가 자동으로 업데이트되었습니다.' };
  } catch (error) {
    console.error('슬롯 추가 후 업데이트 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 작업 등록 시 슬롯 사용량 업데이트
export async function updateUserSlotsAfterWorkAdd(customerName: string, slotCount: number) {
  try {
    // 작업 등록 후 사용자 슬롯 정보 자동 업데이트 (트리거에 의해 처리됨)
    // 추가적인 로직이 필요한 경우 여기에 구현
    
    return { success: true, message: '슬롯 사용량이 자동으로 업데이트되었습니다.' };
  } catch (error) {
    console.error('작업 등록 후 업데이트 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}
