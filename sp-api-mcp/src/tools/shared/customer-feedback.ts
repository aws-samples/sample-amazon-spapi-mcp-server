import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createCustomerFeedbackTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_customer_feedback_get_reviews",
      description:
        "Get product review insights and summaries for your ASINs. Includes sentiment analysis, star ratings, and top themes. Rate limit: 1 request/sec.",
      scope: "shared",
      apiDomain: "customer-feedback",
      inputSchema: {
        asins: z.array(z.string()).describe("ASINs to get review insights for"),
        startDate: z.string().optional().describe("ISO 8601 start date"),
        endDate: z.string().optional().describe("ISO 8601 end date"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/customerFeedback/2024-06-01/reviews",
          {
            asins: params.asins,
            marketplaceId: marketplaceIds[0],
            startDate: params.startDate,
            endDate: params.endDate,
          },
          "customer-feedback"
        );
        return response.data;
      },
    },
    {
      name: "spapi_customer_feedback_get_return_insights",
      description:
        "Get return reason insights for your ASINs. Shows top return reasons, defect rates, and trends. Rate limit: 1 request/sec.",
      scope: "shared",
      apiDomain: "customer-feedback",
      inputSchema: {
        asins: z.array(z.string()).describe("ASINs to get return insights for"),
        startDate: z.string().optional().describe("ISO 8601 start date"),
        endDate: z.string().optional().describe("ISO 8601 end date"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/customerFeedback/2024-06-01/returnInsights",
          {
            asins: params.asins,
            marketplaceId: marketplaceIds[0],
            startDate: params.startDate,
            endDate: params.endDate,
          },
          "customer-feedback"
        );
        return response.data;
      },
    },
  ];
}
