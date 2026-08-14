"use client";

import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerDocs() {
  return (
    <SwaggerUI
      url="/api/openapi"
      deepLinking
      displayRequestDuration
    />
  );
}
