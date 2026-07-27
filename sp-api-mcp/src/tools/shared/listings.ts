import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";
import { requireConfirmation } from "../../utils/destructive-guard.js";

export function createListingsTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_listings_get_listings_item",
      description:
        "Get details for a specific listing by seller ID and SKU. Returns product attributes, offers, fulfillment, and issues. Rate limit: 5 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "listings",
      inputSchema: {
        sellerId: z.string().describe("The seller ID (merchant ID)"),
        sku: z.string().describe("The seller SKU for the listing"),
        includedData: z
          .array(z.enum(["summaries", "attributes", "issues", "offers", "fulfillmentAvailability", "procurement"]))
          .optional()
          .describe("Data sets to include"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/listings/2021-08-01/items/${params.sellerId}/${params.sku}`,
          {
            marketplaceIds: marketplaceIds.join(","),
            includedData: (params.includedData as string[])?.join(","),
          },
          "listings"
        );
        return response.data;
      },
    },
    {
      name: "spapi_listings_put_listings_item",
      description:
        "Create or fully update a listing for a given SKU. Provide product attributes as JSON patches. Returns submission ID and validation issues if any. Rate limit: 5 requests/sec (burst of 10). NOTE: This is a write operation that modifies your listings.",
      scope: "shared",
      apiDomain: "listings",
      inputSchema: {
        sellerId: z.string().describe("The seller ID"),
        sku: z.string().describe("The seller SKU"),
        productType: z.string().describe("Product type (e.g. PRODUCT, LUGGAGE)"),
        attributes: z.record(z.unknown()).describe("Product attributes as JSON object per product type schema"),
        requirements: z
          .enum(["LISTING", "LISTING_PRODUCT_ONLY", "LISTING_OFFER_ONLY"])
          .optional()
          .describe("Which attribute requirements to enforce"),
      },
      handler: async (params) => {
        const response = await client.put(
          `/listings/2021-08-01/items/${params.sellerId}/${params.sku}`,
          {
            productType: params.productType,
            requirements: params.requirements || "LISTING",
            attributes: params.attributes,
          },
          "listings"
        );
        return response.data;
      },
    },
    {
      name: "spapi_listings_patch_listings_item",
      description:
        "Partially update a listing by applying JSON patches to specific attributes. Useful for price, quantity, or single-field updates. Rate limit: 5 requests/sec (burst of 10). NOTE: This is a write operation.",
      scope: "shared",
      apiDomain: "listings",
      inputSchema: {
        sellerId: z.string().describe("The seller ID"),
        sku: z.string().describe("The seller SKU"),
        productType: z.string().describe("Product type"),
        patches: z
          .array(
            z.object({
              op: z.enum(["add", "replace", "delete"]).describe("Patch operation"),
              path: z.string().describe("JSON path to attribute (e.g. /attributes/fulfillment_availability)"),
              value: z.unknown().optional().describe("New value (required for add/replace)"),
            })
          )
          .describe("Array of JSON patch operations"),
      },
      handler: async (params) => {
        const response = await client.patch(
          `/listings/2021-08-01/items/${params.sellerId}/${params.sku}`,
          {
            productType: params.productType,
            patches: params.patches,
          },
          "listings"
        );
        return response.data;
      },
    },
    {
      name: "spapi_listings_delete_listings_item",
      description:
        "⚠️ DESTRUCTIVE: Delete a listing for a given SKU. This permanently removes the listing from the marketplace and cannot be undone. Requires confirm: true to execute. Rate limit: 5 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "listings",
      inputSchema: {
        sellerId: z.string().describe("The seller ID"),
        sku: z.string().describe("The seller SKU to delete"),
        confirm: z.boolean().describe("Must be true to execute this destructive operation"),
      },
      handler: async (params) => {
        const guard = requireConfirmation(
          params,
          "spapi_listings_delete_listings_item",
          `Deleting listing SKU '${params.sku}' will permanently remove it from the marketplace`
        );
        if (!guard.allowed) return guard.error;

        const response = await client.delete(
          `/listings/2021-08-01/items/${params.sellerId}/${params.sku}`,
          "listings"
        );
        return response.data;
      },
    },
  ];
}
