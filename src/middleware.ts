import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "paramedic_session_user_id";
const PUBLIC_ROUTES = ["/auth/login", "/", "/api/auth/signin", "/api/auth/signup"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow all API routes (they handle auth themselves)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionUserId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionUserId) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
