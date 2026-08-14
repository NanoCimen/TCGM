import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /dashboard is deliberately excluded — signed-out visitors can view the
  // shell empty (see app/dashboard/page.tsx), rather than getting bounced.
  const requiresAuth =
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/actividad") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/sell");

  if (!user && requiresAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Land on the homepage with the register modal already open (see the
    // `?auth=register` handling in MarketplacePage) instead of dropping
    // guests on a bare landing page with no indication of why they got sent
    // back.
    url.search = "?auth=register";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname.startsWith("/login") ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/onboarding"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
