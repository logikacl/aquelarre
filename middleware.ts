import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  if (pathname.startsWith("/cuenta") && !session) {
    return Response.redirect(new URL("/checkout", req.url));
  }
  if (pathname.startsWith("/admin") && !(session as any)?.isAdmin) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = { matcher: ["/cuenta/:path*", "/admin/:path*"] };
