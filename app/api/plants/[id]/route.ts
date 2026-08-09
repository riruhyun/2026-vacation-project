import { NextResponse } from "next/server";
import { PLANT_SPECIES } from "@/data/plant-species";

interface PlantRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: PlantRouteContext) {
  const { id } = await context.params;
  const plant = PLANT_SPECIES.find((item) => item.id === id);

  if (!plant) {
    return NextResponse.json({ error: "Plant not found" }, { status: 404 });
  }

  return NextResponse.json({ plant });
}
