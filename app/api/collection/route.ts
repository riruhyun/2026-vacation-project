import { NextResponse } from "next/server";
import { PLANT_SPECIES } from "@/data/plant-species";

export async function GET() {
  return NextResponse.json({ plants: PLANT_SPECIES });
}
