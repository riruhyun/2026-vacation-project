import { NextResponse } from "next/server";
import { MOCK_CANDIDATES } from "@/data/mock-plants";
import type { IdentifyRequest, IdentifyResponse } from "@/types/api";

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as IdentifyRequest;

        if (!body.image) {
            return NextResponse.json(
                { success: false, candidates: [] } satisfies IdentifyResponse,
                { status: 400 },
            );
        }

        // Simulate AI processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const response: IdentifyResponse = {
            success: true,
            candidates: MOCK_CANDIDATES,
        };

        return NextResponse.json(response);
    } catch {
        return NextResponse.json(
            { success: false, candidates: [] } satisfies IdentifyResponse,
            { status: 500 },
        );
    }
}