// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/joins', '/rooms'], // Apply middleware only to these paths
};
