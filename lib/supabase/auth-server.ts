import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export function createAuthServerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );
}
