import { openApiDocument } from "@/lib/openapi";

export function GET() {
  return Response.json(openApiDocument);
}
