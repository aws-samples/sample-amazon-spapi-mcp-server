import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorShipmentsTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_shipments_submit_shipments",
      description:
        "Submit shipment confirmations (ASNs) to Amazon for vendor shipments. Includes carrier info, tracking, ship dates, and item details. Rate limit: 10 requests/sec (burst of 10). NOTE: Write operation.",
      scope: "vendor",
      apiDomain: "vendor-shipments",
      inputSchema: {
        shipmentConfirmations: z
          .array(
            z.object({
              purchaseOrderNumber: z.string().describe("PO number"),
              shipmentConfirmationType: z.enum(["Original", "Replace"]).describe("Confirmation type"),
              shipmentConfirmationDate: z.string().describe("ISO 8601 shipment date"),
              shippedItems: z
                .array(
                  z.object({
                    itemSequenceNumber: z.string(),
                    shippedQuantity: z.object({ amount: z.number(), unitOfMeasure: z.string() }),
                  })
                )
                .describe("Items being shipped"),
              cartonReferenceDetails: z
                .array(
                  z.object({
                    cartonCount: z.number().optional(),
                    cartonReferenceNumbers: z.array(z.string()).optional(),
                  })
                )
                .optional(),
            })
          )
          .describe("Array of shipment confirmations"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/shipping/v1/shipmentConfirmations",
          { shipmentConfirmations: params.shipmentConfirmations },
          "vendor-shipments"
        );
        return response.data;
      },
    },
  ];
}
