import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const isDevMode = process.env.NODE_ENV === 'development';
  try {
    if (isDevMode) console.log('🔄 총판 목록 조회 중...');

    const { data, error } = await supabase
      .from('distributors')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      if (isDevMode) console.error('총판 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '총판 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const distributorNames = data.map(d => d.name);

    if (isDevMode) console.log('✅ 총판 목록 조회 완료:', distributorNames);

    return NextResponse.json({
      success: true,
      data: distributorNames
    });

  } catch (error) {
    if (isDevMode) console.error('총판 목록 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

