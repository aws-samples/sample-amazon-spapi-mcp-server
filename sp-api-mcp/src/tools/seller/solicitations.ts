import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createSolicitationsTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_solicitations_get_solicitation_actions_for_order",
      description:
        "Get available solicitation actions for an order (e.g., request review). Returns whether solicitations can be sent. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "solicitations",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/solicitations/v1/orders/${params.amazonOrderId}`,
          { marketplaceIds: marketplaceIds.join(",") },
          "solicitations"
        );
        return response.data;
      },
    },
    {
      name: "spapi_solicitations_create_product_review_solicitation",
      description:
        "Send a product review solicitation to the buyer for an order. Can only be sent between 5-30 days after delivery. Rate limit: 1 request/sec. NOTE: Write operation — sends a real solicitation email.",
      scope: "seller",
      apiDomain: "solicitations",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/solicitations/v1/orders/${params.amazonOrderId}/solicitations/productReviewAndSellerFeedback`,
          {},
          "solicitations"
        );
        return response.data;
      },
    },
  ];
}
