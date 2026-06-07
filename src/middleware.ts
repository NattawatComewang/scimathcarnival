import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Client-side auth guards are handled inside each page via useAuth() + useRouter().
// This middleware just defines the matcher so the runtime knows which routes are protected.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
