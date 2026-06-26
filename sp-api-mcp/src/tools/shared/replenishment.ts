import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createReplenishmentTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_replenishment_get_selling_partner_metrics",
      description:
        "Get Subscribe & Save metrics for the selling partner, including subscriber counts, revenue, and forecasting data. Rate limit: 1 request/sec.",
      scope: "shared",
      apiDomain: "replenishment",
      inputSchema: {
        aggregationFrequency: z.enum(["WEEK", "MONTH", "QUARTER", "YEAR"]).optional().describe("Aggregation period"),
        timeInterval: z.object({
          startDate: z.string().describe("ISO 8601 start date"),
          endDate: z.string().describe("ISO 8601 end date"),
        }).describe("Time range for metrics"),
        metrics: z.array(z.enum([
          "SHIPPED_SUBSCRIPTION_UNITS", "TOTAL_SUBSCRIPTIONS_REVENUE",
          "ACTIVE_SUBSCRIPTIONS", "SUBSCRIBER_AVERAGE_REVENUE",
          "NON_SUBSCRIBER_AVERAGE_REVENUE", "LOST_SUBSCRIBERS", "SUBSCRIBER_AVERAGE_REORDERS",
        ])).optional().describe("Metrics to retrieve"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/replenishment/2022-11-07/sellingPartners/metrics/search",
          {
            aggregationFrequency: params.aggregationFrequency,
            timeInterval: params.timeInterval,
            metrics: params.metrics,
            marketplaceId: marketplaceIds[0],
          },
          "replenishment"
        );
        return response.data;
      },
    },
    {
      name: "spapi_replenishment_list_offer_metrics",
      description:
        "Get Subscribe & Save offer-level metrics (per-ASIN subscriber count, revenue, forecasts). Rate limit: 1 request/sec.",
      scope: "shared",
      apiDomain: "replenishment",
      inputSchema: {
        aggregationFrequency: z.enum(["WEEK", "MONTH", "QUARTER", "YEAR"]).optional(),
        timeInterval: z.object({
          startDate: z.string(),
          endDate: z.string(),
        }).describe("Time range"),
        filters: z.object({
          asins: z.array(z.string()).optional().describe("Filter by ASINs"),
        }).optional(),
        pageSize: z.number().optional(),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.post(
          "/replenishment/2022-11-07/offers/metrics/search",
          {
            aggregationFrequency: params.aggregationFrequency,
            timeInterval: params.timeInterval,
            filters: params.filters,
            marketplaceId: marketplaceIds[0],
            pagination: { pageSize: params.pageSize, nextToken: params.nextToken },
          },
          "replenishment"
        );
        return response.data;
      },
    },
  ];
}
