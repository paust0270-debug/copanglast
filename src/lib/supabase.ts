import { createClient as _createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// createClient를 명시적으로 export
export const createClient = _createClient

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 설정되지 않음');
  console.error('프로젝트 루트에 .env.local 파일을 생성하고 환경 변수를 설정하세요.');
  console.error('설정 방법: node setup-env.js 실행 또는 수동으로 .env.local 파일 생성');
} else {
  console.log('✅ Supabase 환경 변수가 설정되었습니다.');
  console.log('URL:', supabaseUrl.substring(0, 20) + '...');
  console.log('Key:', supabaseAnonKey.substring(0, 10) + '...');
}

// 성능 최적화된 Supabase 클라이언트 설정
export function createSupabaseClient() {
  return _createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5분 캐시 허용으로 성능 향상
        'X-Requested-With': 'XMLHttpRequest'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

// 성능 최적화된 Supabase 클라이언트
export const supabase = createSupabaseClient();

// Supabase 연결 테스트 함수 (간소화)
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (error) {
      return { success: false, error: error.message, data: null };
    }
    
    return { success: true, error: null, data: { message: '연결 성공' } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '알 수 없는 오류', data: null };
  }
}

// distributors 테이블 존재 여부 확인 함수
export async function checkDistributorsTable() {
  try {
    const { data, error } = await supabase
      .from('distributors')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('distributors 테이블 확인 오류:', error);
      return { exists: false, error: error.message };
    }
    
    return { exists: true, error: null };
  } catch (err) {
    console.error('distributors 테이블 확인 중 예외:', err);
    return { exists: false, error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

// 고객 데이터 타입 정의
export interface Customer {
  id?: number
  name: string
  username: string
  password?: string
  phone?: string
  email?: string
  created_at?: string
}

// 성능 최적화된 고객 목록 조회 함수
export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getCustomers 오류:', err);
    throw err;
  }
}

// 총판 데이터 타입 정의
export interface Distributor {
  id?: number
  name: string
  type: '본사' | '선택안함'
  sub_count?: number
  manager?: string
  domain?: string
  ip?: string
  site_name?: string
  menu_abbr?: string
  default_days: number
  coupon_days: number
  member_count?: number
  memo?: string
  status?: 'active' | 'inactive'
  created_at?: string
}

// 성능 최적화된 총판 목록 조회 함수
export async function getDistributors() {
  try {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase 오류:', error);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('getDistributors 오류:', err);
    console.error('오류 타입:', typeof err);
    console.error('오류 메시지:', err instanceof Error ? err.message : '알 수 없는 오류');
    throw err;
  }
}

// 총판 추가 함수
export async function addDistributor(distributor: Omit<Distributor, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('distributors')
      .insert([distributor])
      .select();
    
    if (error) {
      console.error('Supabase 추가 오류:', error);
      throw error;
    }
    return data[0];
  } catch (err) {
    console.error('addDistributor 오류:', err);
    console.error('오류 타입:', typeof err);
    console.error('오류 메시지:', err instanceof Error ? err.message : '알 수 없는 오류');
    throw err;
  }
}

// 총판 수정 함수
export async function updateDistributor(id: number, distributor: Partial<Distributor>) {
  try {
    const { data, error } = await supabase
      .from('distributors')
      .update(distributor)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Supabase 수정 오류:', error);
      throw error;
    }
    return data[0];
  } catch (err) {
    console.error('updateDistributor 오류:', err);
    console.error('오류 타입:', typeof err);
    console.error('오류 메시지:', err instanceof Error ? err.message : '알 수 없는 오류');
    throw err;
  }
}

// 총판 조회 함수 (단일)
export async function getDistributor(id: number) {
  try {
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase 조회 오류:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('getDistributor 오류:', err);
    console.error('오류 타입:', typeof err);
    console.error('오류 메시지:', err instanceof Error ? err.message : '알 수 없는 오류');
    throw err;
  }
}

// 총판 삭제 함수
export async function deleteDistributor(id: number) {
  const { error } = await supabase
    .from('distributors')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// 고객 추가 함수
export async function addCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select();
  
  if (error) throw error;
  return data[0];
}

// 고객 삭제 함수
export async function deleteCustomer(id: number) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// 고객 수정 함수
export async function updateCustomer(id: number, updates: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

// 슬롯 데이터 타입 정의
export interface Slot {
  id?: number
  customer_id: string
  customer_name: string
  slot_type: string
  slot_count: number
  payment_type?: string
  payer_name?: string
  payment_amount?: number
  payment_date?: string
  usage_days?: number
  memo?: string
  status: 'active' | 'inactive' | 'expired' | 'completed'
  created_at?: string
  updated_at?: string
}

// 성능 최적화된 슬롯 목록 조회 함수
export async function getSlots() {
  try {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getSlots 오류:', err);
    throw err;
  }
}

// 슬롯 추가 함수
export async function addSlot(slot: Omit<Slot, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('slots')
    .insert([slot])
    .select();
  
  if (error) throw error;
  return data[0];
}

// 성능 최적화된 슬롯 현황 조회 함수
export async function getSlotStatus() {
  try {
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (slotsError) throw slotsError;
    
    // 성능 최적화: Map을 사용하여 O(n²) → O(n)으로 개선
    const slotMap = new Map<string, Slot[]>();
    slotsData?.forEach(slot => {
      if (!slotMap.has(slot.customer_id)) {
        slotMap.set(slot.customer_id, []);
      }
      slotMap.get(slot.customer_id)!.push(slot);
    });
    
    const slotStatusData = slotsData?.map(slot => {
      const customerSlots = slotMap.get(slot.customer_id) || [];
      const usedSlots = customerSlots.filter(s => s.status === 'active').length;
      
      return {
        id: slot.id,
        customerId: slot.customer_id,
        customerName: slot.customer_name,
        slotType: slot.slot_type,
        slotCount: slot.slot_count,
        usedSlots: usedSlots,
        remainingSlots: Math.max(0, slot.slot_count - usedSlots),
        totalPaymentAmount: slot.payment_amount || 0,
        remainingDays: slot.usage_days || 0,
        registrationDate: slot.created_at ? new Date(slot.created_at).toISOString().split('T')[0] : '',
        expiryDate: slot.created_at && slot.usage_days ? 
          new Date(new Date(slot.created_at).getTime() + (slot.usage_days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : '',
        addDate: slot.created_at ? new Date(slot.created_at).toISOString().split('T')[0] : '',
        status: slot.status,
        userGroup: slot.memo || '본사'
      };
    }) || [];
    
    return slotStatusData;
  } catch (err) {
    console.error('getSlotStatus 오류:', err);
    throw err;
  }
}

// 간소화된 스키마 캐시 갱신 함수
export async function forceSchemaRefresh() {
  try {
    await supabase.from('customers').select('count').limit(1);
    await supabase.from('slots').select('count').limit(1);
  } catch (err) {
    console.log('스키마 갱신 중 오류:', err);
  }
}

// 간소화된 스키마 캐시 문제 해결 함수
export async function fixSchemaCacheIssues() {
  try {
    await forceSchemaRefresh();
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}

// 성능 최적화된 스키마 캐시 래퍼 함수 (재시도 횟수 감소)
export function withSchemaCacheFix<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // 스키마 캐시 관련 오류인지 확인
      if (error?.code === 'PGRST116' || 
          error?.message?.includes('relation') || 
          error?.message?.includes('table') ||
          error?.message?.includes('schema')) {
        
        await forceSchemaRefresh();
        return await fn(...args); // 한 번만 재시도
      }
      
      throw error;
    }
  };
}

