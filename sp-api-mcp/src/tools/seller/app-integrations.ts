import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createAppIntegrationsTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_app_integrations_create_notification",
      description:
        "Send a notification to a selling partner via the App Integrations API. Used by SP-API applications to communicate with sellers. Rate limit: 1 request/sec. NOTE: Write operation.",
      scope: "seller",
      apiDomain: "app-integrations",
      inputSchema: {
        templateId: z.string().describe("Notification template ID"),
        notificationParameters: z.record(z.string()).describe("Template parameter key-value pairs"),
        marketplaceId: z.string().optional().describe("Target marketplace ID"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/appIntegrations/2024-04-01/notifications",
          {
            templateId: params.templateId,
            notificationParameters: params.notificationParameters,
            marketplaceId: params.marketplaceId,
          },
          "app-integrations"
        );
        return response.data;
      },
    },
  ];
}
