declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  type SwaggerUIProps = {
    url?: string;
    deepLinking?: boolean;
    displayRequestDuration?: boolean;
  };

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
