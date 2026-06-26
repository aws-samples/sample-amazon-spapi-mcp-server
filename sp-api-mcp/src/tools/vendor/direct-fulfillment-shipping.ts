import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorDFShippingTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_df_shipping_get_shipping_labels",
      description:
        "Get shipping labels for direct fulfillment orders. Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-df-shipping",
      inputSchema: {
        createdAfter: z.string().describe("ISO 8601 date"),
        createdBefore: z.string().optional().describe("ISO 8601 date"),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
        limit: z.number().optional(),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/vendor/directFulfillment/shipping/2021-12-28/shippingLabels",
          {
            createdAfter: params.createdAfter,
            createdBefore: params.createdBefore,
            sortOrder: params.sortOrder,
            limit: params.limit,
            nextToken: params.nextToken,
          },
          "vendor-df-shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_df_shipping_get_shipping_label",
      description:
        "Get a single shipping label by purchase order number. Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-df-shipping",
      inputSchema: {
        purchaseOrderNumber: z.string().describe("Purchase order number"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/vendor/directFulfillment/shipping/2021-12-28/shippingLabels/${params.purchaseOrderNumber}`,
          {},
          "vendor-df-shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_df_shipping_submit_shipment_confirmations",
      description:
        "Submit shipment confirmations for direct fulfillment orders. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "vendor",
      apiDomain: "vendor-df-shipping",
      inputSchema: {
        shipmentConfirmations: z.array(z.object({
          purchaseOrderNumber: z.string(),
          shipmentDetails: z.object({
            shippedDate: z.string().describe("ISO 8601 ship date"),
            shipmentStatus: z.enum(["SHIPPED", "FLOOR_DENIAL"]),
          }),
          items: z.array(z.object({
            itemSequenceNumber: z.string(),
            shippedQuantity: z.object({ amount: z.number(), unitOfMeasure: z.string() }),
          })),
        })).describe("Shipment confirmations"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/directFulfillment/shipping/2021-12-28/shipmentConfirmations",
          { shipmentConfirmations: params.shipmentConfirmations },
          "vendor-df-shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_df_shipping_get_packing_slips",
      description:
        "Get packing slips for direct fulfillment shipments. Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-df-shipping",
      inputSchema: {
        createdAfter: z.string().describe("ISO 8601 date"),
        createdBefore: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
        limit: z.number().optional(),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/vendor/directFulfillment/shipping/2021-12-28/packingSlips",
          {
            createdAfter: params.createdAfter,
            createdBefore: params.createdBefore,
            sortOrder: params.sortOrder,
            limit: params.limit,
            nextToken: params.nextToken,
          },
          "vendor-df-shipping"
        );
        return response.data;
      },
    },
  ];
}
