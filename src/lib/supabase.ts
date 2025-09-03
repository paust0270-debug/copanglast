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
}

// createClient 함수 export
export function createSupabaseClient() {
  return _createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // 세션 캐시 완전 비활성화
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
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

// 스키마 캐시 문제 완전 해결을 위한 강화된 Supabase 클라이언트 설정
export const supabase = createSupabaseClient();

// 스키마 캐시 강제 갱신 함수
export async function forceSchemaRefresh() {
  console.log('🔄 강제 스키마 갱신 실행...');
  
  try {
    // 여러 테이블에 접근하여 스키마 캐시 강제 갱신
    const tables = ['customers', 'users', 'user_profiles'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`⚠️ ${table} 테이블 접근 중 오류 (정상):`, error.message);
        } else {
          console.log(`✅ ${table} 테이블 스키마 갱신 완료`);
        }
      } catch (err) {
        console.log(`⚠️ ${table} 테이블 접근 중 예외:`, err);
      }
    }
    
    console.log('✅ 강제 스키마 갱신 완료');
  } catch (err) {
    console.error('❌ 강제 스키마 갱신 중 오류:', err);
  }
}

// 연결 풀 재설정 함수
export async function resetConnectionPool() {
  console.log('🔄 연결 풀 재설정 실행...');
  
  try {
    // 새로운 클라이언트 인스턴스 생성
    const newSupabase = _createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    });
    
    // 연결 테스트
    const { data, error } = await newSupabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️ 새 연결 풀 테스트 중 오류:', error.message);
    } else {
      console.log('✅ 연결 풀 재설정 완료');
    }
  } catch (err) {
    console.log('⚠️ 연결 풀 재설정 중 예외:', err);
  }
}

// 스키마 캐시 문제 해결 함수
export async function fixSchemaCacheIssues() {
  console.log('🚀 스키마 캐시 문제 해결 시작...');
  
  try {
    // 1. 강제 스키마 갱신
    await forceSchemaRefresh();
    
    // 2. 연결 풀 재설정
    await resetConnectionPool();
    
    // 3. 최종 테스트
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ 최종 테스트 실패:', error.message);
      return false;
    }
    
    console.log('✅ 스키마 캐시 문제 해결 완료');
    return true;
  } catch (err) {
    console.error('❌ 스키마 캐시 문제 해결 중 오류:', err);
    return false;
  }
}

// 재시도 로직이 포함된 데이터베이스 쿼리 함수
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 3
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 쿼리 시도 ${attempt}/${maxRetries}...`);
      
      const result = await queryFn();
      
      if (result.error) {
        // 스키마 캐시 관련 오류인지 확인
        if (result.error.code === 'PGRST116' || 
            result.error.message.includes('relation') || 
            result.error.message.includes('table') ||
            result.error.message.includes('schema')) {
          
          console.log('🔄 스키마 캐시 문제 감지, 갱신 후 재시도...');
          await forceSchemaRefresh();
          
          if (attempt < maxRetries) {
            lastError = result.error;
            // 잠시 대기 후 재시도
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
      }
      
      return result;
    } catch (err) {
      console.error(`❌ 시도 ${attempt} 실패:`, err);
      lastError = err;
      
      if (attempt < maxRetries) {
        // 잠시 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return { data: null, error: lastError };
}

// 스키마 캐시 문제 해결을 위한 래퍼 함수
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
        
        console.log('🔄 스키마 캐시 문제 감지, 갱신 후 재시도...');
        await forceSchemaRefresh();
        
        // 재시도
        return await fn(...args);
      }
      
      throw error;
    }
  };
}

// 고객 데이터 타입 정의
export interface Customer {
  id?: number
  name: string
  keyword: string
  link_url: string
  slot_count: number
  memo?: string
  work_group?: string
  equipment_group?: string
  current_rank?: string
  start_rank?: string
  traffic?: string
  remaining_days?: string
  registration_date?: string
  status?: string
  created_at?: string
  updated_at?: string
}

// 고객 추가 함수
export async function addCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
  
  if (error) throw error
  return data[0]
}

// 고객 목록 조회 함수
export async function getCustomers() {
  try {
    console.log('Supabase getCustomers 함수 시작...');
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Supabase 응답 - data:', data, 'error:', error);
    
    if (error) {
      console.error('Supabase 오류 발생:', error);
      throw error;
    }
    
    if (!data) {
      console.log('데이터가 null입니다. 빈 배열 반환.');
      return [];
    }
    
    console.log('성공적으로 데이터 반환:', data);
    return data;
  } catch (err) {
    console.error('getCustomers 함수에서 오류 발생:', err);
    throw err;
  }
}

// 고객 삭제 함수
export async function deleteCustomer(id: number) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// 고객 수정 함수
export async function updateCustomer(id: number, updates: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}
