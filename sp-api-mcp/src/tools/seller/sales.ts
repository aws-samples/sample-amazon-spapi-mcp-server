import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createSalesTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_sales_get_order_metrics",
      description:
        "Get aggregated order metrics (units ordered, revenue, average price) for a date range. Supports hourly, daily, weekly, monthly, yearly granularity. Rate limit: 0.5 requests/sec (burst of 15).",
      scope: "seller",
      apiDomain: "sales",
      inputSchema: {
        interval: z.string().describe("ISO 8601 interval (e.g. 2024-01-01T00:00:00Z--2024-01-31T23:59:59Z)"),
        granularity: z.enum(["Hour", "Day", "Week", "Month", "Year", "Total"]).describe("Aggregation granularity"),
        granularityTimeZone: z.string().optional().describe("IANA time zone (e.g. America/Los_Angeles)"),
        asin: z.string().optional().describe("Filter by ASIN"),
        sku: z.string().optional().describe("Filter by SKU"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/sales/v1/orderMetrics",
          {
            marketplaceIds: marketplaceIds.join(","),
            interval: params.interval,
            granularity: params.granularity,
            granularityTimeZone: params.granularityTimeZone,
            asin: params.asin,
            sku: params.sku,
          },
          "sales"
        );
        return response.data;
      },
    },
  ];
}
