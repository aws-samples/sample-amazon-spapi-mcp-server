import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorDFInventoryTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_df_inventory_submit_inventory_update",
      description:
        "Submit inventory stock level updates for direct fulfillment items. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "vendor",
      apiDomain: "vendor-df-inventory",
      inputSchema: {
        inventory: z.object({
          sellingParty: z.object({
            partyId: z.string().describe("Vendor party ID"),
          }),
          isFullUpdate: z.boolean().describe("True for full inventory replace, false for delta"),
          items: z.array(z.object({
            buyerProductIdentifier: z.string().optional().describe("Amazon's product identifier"),
            vendorProductIdentifier: z.string().optional().describe("Vendor's product identifier"),
            availableQuantity: z.object({
              amount: z.number(),
              unitOfMeasure: z.string(),
            }),
            isObsolete: z.boolean().optional().describe("True if item is discontinued"),
          })),
        }).describe("Inventory update payload"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/directFulfillment/inventory/v1/warehouses",
          { inventory: params.inventory },
          "vendor-df-inventory"
        );
        return response.data;
      },
    },
  ];
}
