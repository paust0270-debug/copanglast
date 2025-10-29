import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log(`?뵍 [Middleware] 寃쎈줈: ${pathname}`);

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.get('isAuthenticated');
  const userInfo = request.cookies.get('userInfo');

  console.log(
    `?뜧 [Middleware] 荑좏궎 - isAuthenticated: ${!!isAuthenticated}, userInfo: ${!!userInfo}`
  );

  if (!isAuthenticated || !userInfo) {
    console.log(`??[Middleware] 由щ떎?대젆?? ${pathname} -> /login`);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  console.log(`??[Middleware] ?몄쬆 ?깃났: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
