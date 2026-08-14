import type { Metadata } from "next";
import SwaggerDocs from "@/components/api-docs/SwaggerDocs";
import "swagger-ui-react/swagger-ui.css";
import "./swagger.css";

export const metadata: Metadata = {
  title: "API Docs | 초록도감",
  description: "초록도감 백엔드 API 문서",
};

export default function ApiDocsPage() {
  return (
    <main className="api-docs-page">
      <SwaggerDocs />
    </main>
  );
}
