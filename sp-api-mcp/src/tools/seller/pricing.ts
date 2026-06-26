import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createPricingTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_pricing_get_competitive_pricing",
      description:
        "Get competitive pricing information for items including Buy Box prices, offer counts, and landed price. Supports batch requests of up to 20 ASINs. Rate limit: 0.5 requests/sec (burst of 1).",
      scope: "seller",
      apiDomain: "pricing",
      inputSchema: {
        asins: z.array(z.string()).min(1).max(20).describe("List of ASINs (max 20)"),
      },
      handler: async (params) => {
        const requests = (params.asins as string[]).map((asin) => ({
          uri: `/products/pricing/2022-05-01/items/${asin}/competitiveSummary`,
          method: "GET",
          marketplaceId: marketplaceIds[0],
          includedData: ["competitivePricing", "salesRankings"],
        }));

        const response = await client.post(
          "/batches/products/pricing/2022-05-01/items/competitiveSummary",
          { requests },
          "pricing"
        );
        return response.data;
      },
    },
    {
      name: "spapi_pricing_get_listing_offers",
      description:
        "Get all active offers for a specific SKU, including price, condition, shipping, and seller feedback data. Rate limit: 0.5 requests/sec.",
      scope: "seller",
      apiDomain: "pricing",
      inputSchema: {
        sellerSku: z.string().describe("Seller SKU to get offers for"),
        itemCondition: z
          .enum(["New", "Used", "Collectible", "Refurbished", "Club"])
          .default("New")
          .describe("Item condition filter"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/products/pricing/v0/listings/${params.sellerSku}/offers`,
          {
            MarketplaceId: marketplaceIds[0],
            ItemCondition: params.itemCondition,
          },
          "pricing"
        );
        return response.data;
      },
    },
    {
      name: "spapi_pricing_get_item_offers",
      description:
        "Get all active offers for a specific ASIN, including price, condition, shipping, and seller feedback data. Rate limit: 0.5 requests/sec.",
      scope: "seller",
      apiDomain: "pricing",
      inputSchema: {
        asin: z.string().describe("ASIN to get offers for"),
        itemCondition: z
          .enum(["New", "Used", "Collectible", "Refurbished", "Club"])
          .default("New")
          .describe("Item condition filter"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/products/pricing/v0/items/${params.asin}/offers`,
          {
            MarketplaceId: marketplaceIds[0],
            ItemCondition: params.itemCondition,
          },
          "pricing"
        );
        return response.data;
      },
    },
  ];
}
