import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    console.log('settlements 테이블 생성 시작...');

    // settlements 테이블 생성 SQL
    const createTableSQL = `
      -- 기존 settlements 테이블 삭제 (있다면)
      DROP TABLE IF EXISTS settlements CASCADE;

      -- 정산 테이블 생성 (최종 구조)
      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        sequential_number INTEGER NOT NULL,
        distributor_name VARCHAR(255) NOT NULL,
        total_slots INTEGER NOT NULL,
        total_deposit_amount DECIMAL(10,2) NOT NULL,
        depositor_name VARCHAR(255),
        deposit_date DATE,
        request_date DATE,
        memo TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_settlements_distributor_name ON settlements(distributor_name);
      CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
      CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at);
      CREATE INDEX IF NOT EXISTS idx_settlements_deposit_date ON settlements(deposit_date);

      -- 정산 상태에 대한 설명
      COMMENT ON TABLE settlements IS '정산 완료 내역';
      COMMENT ON COLUMN settlements.sequential_number IS '순번';
      COMMENT ON COLUMN settlements.distributor_name IS '대상총판';
      COMMENT ON COLUMN settlements.total_slots IS '슬롯수';
      COMMENT ON COLUMN settlements.total_deposit_amount IS '정산계산 입금액값';
      COMMENT ON COLUMN settlements.depositor_name IS '정산계산 입금자명 값';
      COMMENT ON COLUMN settlements.deposit_date IS '정산계산 입금일 값';
      COMMENT ON COLUMN settlements.request_date IS '요청일';
      COMMENT ON COLUMN settlements.memo IS '메모';
      COMMENT ON COLUMN settlements.status IS '정산 상태 (completed)';
      COMMENT ON COLUMN settlements.created_at IS '생성일시';
      COMMENT ON COLUMN settlements.updated_at IS '수정일시';
    `;

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('settlements 테이블 생성 에러:', error);
      return NextResponse.json({
        success: false,
        error: 'settlements 테이블을 생성하는 중 오류가 발생했습니다.',
        details: error.message
      }, { status: 500 });
    }

    console.log('settlements 테이블 생성 완료');

    return NextResponse.json({
      success: true,
      message: 'settlements 테이블이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('settlements 테이블 생성 API 에러:', error);
    return NextResponse.json({
      success: false,
      error: 'settlements 테이블을 생성하는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}


