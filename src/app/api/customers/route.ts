import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 모든 고객 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Customers 데이터:', data?.length || 0, '개');

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    // distributor_name 매핑 (간단한 방식)
    const mappedData = (data || []).map(customer => ({
      ...customer,
      distributor_name: customer.distributor || '-',
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 새 고객 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('customers')
      .insert([body])
      .select();

    if (error) {
      console.error('Error adding customer:', error);
      return NextResponse.json(
        { error: 'Failed to add customer' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
