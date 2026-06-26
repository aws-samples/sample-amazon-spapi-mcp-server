import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createListingsRestrictionsTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_listings_restrictions_get_restrictions",
      description:
        "Get listing restrictions for an ASIN in a marketplace. Shows whether you're approved to sell, what conditions apply, and any required approvals. Rate limit: 5 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "listings-restrictions",
      inputSchema: {
        asin: z.string().describe("ASIN to check restrictions for"),
        sellerId: z.string().describe("Seller ID"),
        conditionType: z.enum(["new_new", "new_open_box", "new_oem", "refurbished_refurbished", "used_like_new", "used_very_good", "used_good", "used_acceptable", "collectible_like_new", "collectible_very_good", "collectible_good", "collectible_acceptable"]).optional().describe("Item condition"),
        reasonLocale: z.string().optional().describe("Locale for restriction reasons (e.g., en_US)"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/listings/2021-08-01/restrictions",
          {
            asin: params.asin,
            sellerId: params.sellerId,
            marketplaceIds: marketplaceIds.join(","),
            conditionType: params.conditionType,
            reasonLocale: params.reasonLocale,
          },
          "listings-restrictions"
        );
        return response.data;
      },
    },
  ];
}
