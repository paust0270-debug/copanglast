import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '?꾩씠?붿? 鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '?꾩씠???먮뒗 鍮꾨?踰덊샇媛 ?щ컮瑜댁? ?딆뒿?덈떎.' },
        { status: 401 }
      );
    }

    // Response ?앹꽦
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        grade: user.grade,
        distributor: user.distributor,
        status: user.status,
      },
    });

    // 荑좏궎 ?ㅼ젙
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
    });

    response.cookies.set(
      'userInfo',
      JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        grade: user.grade,
        distributor: user.distributor,
        status: user.status,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
      }
    );

    response.cookies.set('rememberMe', String(rememberMe || false), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
    });

    return response;
  } catch (error) {
    console.error('濡쒓렇???ㅻ쪟:', error);
    return NextResponse.json(
      { error: '濡쒓렇??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.' },
      { status: 500 }
    );
  }
}
