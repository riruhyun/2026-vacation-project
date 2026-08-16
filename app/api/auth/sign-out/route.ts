import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, data: {} });
  await createAuthServerClient(request, response).auth.signOut();
  return response;
}
