import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createFbaInventoryTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_fba_inventory_get_summaries",
      description:
        "Get FBA inventory summaries including fulfillable, inbound, reserved, and unfulfillable quantities. Can filter by ASIN, SKU, or date. Rate limit: 2 requests/sec (burst of 2).",
      scope: "seller",
      apiDomain: "fba-inventory",
      inputSchema: {
        granularityType: z.enum(["Marketplace"]).default("Marketplace").describe("Granularity level"),
        granularityId: z.string().optional().describe("Marketplace ID for granularity (defaults to configured marketplace)"),
        sellerSkus: z.array(z.string()).optional().describe("Filter by seller SKU(s)"),
        startDateTime: z.string().optional().describe("ISO 8601 date. Inventory snapshot start."),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/fba/inventory/v1/summaries",
          {
            details: true,
            granularityType: params.granularityType || "Marketplace",
            granularityId: params.granularityId || marketplaceIds[0],
            marketplaceIds: marketplaceIds.join(","),
            sellerSkus: (params.sellerSkus as string[])?.join(","),
            startDateTime: params.startDateTime,
            nextToken: params.nextToken,
          },
          "fba-inventory"
        );
        return response.data;
      },
    },
  ];
}
