import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Supabase 연결 상태 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are not configured');
      return NextResponse.json(
        { error: 'Supabase configuration is missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id } = await params;
    const userId = id;
    
    // 상태 값 검증
    if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Supabase에서 사용자 상태 업데이트
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      // 테이블이 존재하지 않는 경우
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Users table does not exist. Please run the database schema first.' },
          { status: 500 }
        );
      }
      
      // 사용자를 찾을 수 없는 경우
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      throw new Error(`Failed to update user status in database: ${error.message}`);
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
