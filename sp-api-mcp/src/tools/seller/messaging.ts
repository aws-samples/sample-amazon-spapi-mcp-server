import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createMessagingTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_messaging_get_messaging_actions_for_order",
      description:
        "Get available messaging actions for a given order. Returns which message types can be sent to the buyer. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "messaging",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/messaging/v1/orders/${params.amazonOrderId}`,
          { marketplaceIds: marketplaceIds.join(",") },
          "messaging"
        );
        return response.data;
      },
    },
    {
      name: "spapi_messaging_send_message",
      description:
        "Send a message to a buyer for a specific order. Supports various message types like order delivery info, legal disclosures, etc. Rate limit: 1 request/sec. NOTE: Write operation — sends a real message to the buyer.",
      scope: "seller",
      apiDomain: "messaging",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
        messageType: z.enum([
          "confirmCustomizationDetails",
          "confirmDeliveryDetails",
          "legalDisclosure",
          "negativeFeedbackRemoval",
          "confirmOrderDetails",
          "confirmServiceDetails",
          "amazonMotors",
          "warranty",
          "digitalAccessKey",
          "unexpectedProblem",
        ]).describe("Type of message to send"),
        body: z.string().optional().describe("Message body text (if applicable)"),
        attachments: z.array(z.object({
          uploadDestinationId: z.string(),
          fileName: z.string(),
        })).optional().describe("Attachments (upload first via Uploads API)"),
      },
      handler: async (params) => {
        const endpoint = `/messaging/v1/orders/${params.amazonOrderId}/messages/${params.messageType}`;
        const response = await client.post(
          endpoint,
          {
            body: params.body,
            attachments: params.attachments,
            marketplaceIds: marketplaceIds,
          },
          "messaging"
        );
        return response.data;
      },
    },
  ];
}
