import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("privacyflow_session")?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // Protected paths that require authentication
  const isProtectedPath =
    pathname.startsWith("/create") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/policy");

  // Auth pages (login, signup, forgot-password)
  const isAuthPath = pathname === "/" || pathname === "/signup" || pathname === "/forgot-password";

  // 1. Unauthenticated users trying to access protected generator pages -> redirect to login (/)
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users trying to access login/signup -> redirect to generator (/create)
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/create", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons)
     * - /p/ (public hosted policy pages)
     * - /api/ (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|p/|api/).*)",
  ],
};
