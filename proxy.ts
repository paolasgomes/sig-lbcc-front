import { NextRequest, NextResponse } from "next/server";

const TOKEN_STORAGE_KEY = "sig-lbcc-token";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") {
    const token = request.cookies.get(TOKEN_STORAGE_KEY)?.value;

    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
