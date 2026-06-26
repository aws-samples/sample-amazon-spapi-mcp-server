import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createTokensTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_tokens_create_restricted_data_token",
      description:
        "Create a Restricted Data Token (RDT) for accessing PII-sensitive data (buyer name, address, email). Required for Orders buyerInfo and shippingAddress. Rate limit: 1 request/sec (burst of 10).",
      scope: "shared",
      apiDomain: "tokens",
      inputSchema: {
        restrictedResources: z.array(z.object({
          method: z.enum(["GET", "PUT", "POST", "DELETE"]).describe("HTTP method"),
          path: z.string().describe("API path (e.g., /orders/v0/orders/111-xxx/buyerInfo)"),
          dataElements: z.array(z.string()).optional().describe("Data elements to restrict (e.g., buyerInfo, shippingAddress)"),
        })).describe("Resources requiring restricted access"),
        targetApplication: z.string().optional().describe("Target application ID (for delegated access)"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/tokens/2021-03-01/restrictedDataToken",
          {
            restrictedResources: params.restrictedResources,
            targetApplication: params.targetApplication,
          },
          "tokens"
        );
        return response.data;
      },
    },
  ];
}
