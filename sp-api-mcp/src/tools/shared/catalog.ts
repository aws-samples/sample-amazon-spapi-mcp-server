import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createCatalogTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_catalog_search_items",
      description:
        "Search the Amazon catalog by keywords, identifiers, or brand. Returns items with ASINs, titles, images, and product details. Rate limit: 2 requests/sec (burst of 2).",
      scope: "shared",
      apiDomain: "catalog",
      inputSchema: {
        keywords: z.array(z.string()).optional().describe("Search keywords"),
        identifiers: z.array(z.string()).optional().describe("Product identifiers (ASIN, UPC, EAN, ISBN)"),
        identifiersType: z
          .enum(["ASIN", "EAN", "GTIN", "ISBN", "JAN", "MINSAN", "SKU", "UPC"])
          .optional()
          .describe("Type of identifiers provided"),
        brandNames: z.array(z.string()).optional().describe("Filter by brand name"),
        classificationIds: z.array(z.string()).optional().describe("Filter by browse node IDs"),
        includedData: z
          .array(z.enum(["identifiers", "images", "productTypes", "salesRanks", "summaries", "dimensions", "relationships"]))
          .optional()
          .describe("Data to include in response"),
        pageSize: z.number().optional().describe("Results per page (1-20, default 10)"),
        pageToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/catalog/2022-04-01/items",
          {
            marketplaceIds: marketplaceIds.join(","),
            keywords: (params.keywords as string[])?.join(","),
            identifiers: (params.identifiers as string[])?.join(","),
            identifiersType: params.identifiersType,
            brandNames: (params.brandNames as string[])?.join(","),
            classificationIds: (params.classificationIds as string[])?.join(","),
            includedData: (params.includedData as string[])?.join(","),
            pageSize: params.pageSize,
            pageToken: params.pageToken,
          },
          "catalog"
        );
        return response.data;
      },
    },
    {
      name: "spapi_catalog_get_item",
      description:
        "Get detailed information for a single catalog item by ASIN, including title, description, images, dimensions, and classifications. Rate limit: 2 requests/sec (burst of 2).",
      scope: "shared",
      apiDomain: "catalog",
      inputSchema: {
        asin: z.string().describe("The ASIN of the catalog item"),
        includedData: z
          .array(z.enum(["attributes", "dimensions", "identifiers", "images", "productTypes", "relationships", "salesRanks", "summaries", "vendorDetails"]))
          .optional()
          .describe("Data to include in response"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/catalog/2022-04-01/items/${params.asin}`,
          {
            marketplaceIds: marketplaceIds.join(","),
            includedData: (params.includedData as string[])?.join(","),
          },
          "catalog"
        );
        return response.data;
      },
    },
  ];
}
