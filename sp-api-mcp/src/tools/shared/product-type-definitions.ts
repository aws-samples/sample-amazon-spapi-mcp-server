import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createProductTypeDefinitionsTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_product_types_search_definitions",
      description:
        "Search for product type definitions available in a marketplace. Returns product type names and their requirements context. Rate limit: 5 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "product-type-definitions",
      inputSchema: {
        keywords: z.array(z.string()).optional().describe("Search keywords for product types"),
        itemName: z.string().optional().describe("Product name to find matching product type"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/definitions/2020-09-01/productTypes",
          {
            marketplaceIds: marketplaceIds.join(","),
            keywords: (params.keywords as string[])?.join(","),
            itemName: params.itemName,
          },
          "product-type-definitions"
        );
        return response.data;
      },
    },
    {
      name: "spapi_product_types_get_definition",
      description:
        "Get the full definition (JSON Schema) for a product type. Shows all required and optional attributes for listing creation. Rate limit: 5 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "product-type-definitions",
      inputSchema: {
        productType: z.string().describe("Product type name (e.g., LUGGAGE, SHIRT)"),
        requirements: z.enum(["LISTING", "LISTING_PRODUCT_ONLY", "LISTING_OFFER_ONLY"]).optional().describe("Requirements scope"),
        locale: z.string().optional().describe("Locale for attribute labels (e.g., en_US)"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/definitions/2020-09-01/productTypes/${params.productType}`,
          {
            marketplaceIds: marketplaceIds.join(","),
            requirements: params.requirements,
            locale: params.locale,
          },
          "product-type-definitions"
        );
        return response.data;
      },
    },
  ];
}
