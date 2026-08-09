import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ observations: [] });
}

export async function POST(request: Request) {
  const observation = await request.json();

  return NextResponse.json(
    {
      observation,
      success: true,
    },
    { status: 201 },
  );
}
