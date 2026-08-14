"use client";

import dynamic from "next/dynamic";
import type { ComponentProps, ComponentType } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

type SwaggerUIWithCredentialsProps = ComponentProps<typeof SwaggerUI> & {
  withCredentials?: boolean;
};

const SwaggerUIWithCredentials = SwaggerUI as ComponentType<SwaggerUIWithCredentialsProps>;

export default function SwaggerDocs() {
  return (
    <SwaggerUIWithCredentials
      url="/api/openapi"
      deepLinking
      displayRequestDuration
      withCredentials
    />
  );
}
