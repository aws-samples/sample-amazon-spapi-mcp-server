import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorDFOrdersTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_df_orders_get_orders",
      description:
        "Get vendor direct fulfillment orders (drop-ship POs). Rate limit: 10 requests/sec (burst of 10).",
      scope: "vendor",
      apiDomain: "vendor-df-orders",
      inputSchema: {
        createdAfter: z.string().describe("ISO 8601 date. Orders created after."),
        createdBefore: z.string().optional().describe("ISO 8601 date. Orders created before."),
        status: z.enum(["NEW", "SHIPPED", "ACCEPTED", "CANCELLED"]).optional().describe("Filter by status"),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
        limit: z.number().optional(),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/vendor/directFulfillment/orders/2021-12-28/purchaseOrders",
          {
            createdAfter: params.createdAfter,
            createdBefore: params.createdBefore,
            status: params.status,
            sortOrder: params.sortOrder,
            limit: params.limit,
            nextToken: params.nextToken,
          },
          "vendor-df-orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_df_orders_get_order",
      description:
        "Get a single direct fulfillment order by purchase order number. Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-df-orders",
      inputSchema: {
        purchaseOrderNumber: z.string().describe("Purchase order number"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/vendor/directFulfillment/orders/2021-12-28/purchaseOrders/${params.purchaseOrderNumber}`,
          {},
          "vendor-df-orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_df_orders_submit_acknowledgement",
      description:
        "Submit acknowledgement for direct fulfillment orders. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "vendor",
      apiDomain: "vendor-df-orders",
      inputSchema: {
        orderAcknowledgements: z.array(z.object({
          purchaseOrderNumber: z.string(),
          acknowledgementDate: z.string().describe("ISO 8601 date"),
          acknowledgementStatus: z.object({
            code: z.enum(["ACCEPTED", "REJECTED"]),
          }),
          itemAcknowledgements: z.array(z.object({
            itemSequenceNumber: z.string(),
            buyerProductIdentifier: z.string().optional(),
            vendorProductIdentifier: z.string().optional(),
            acknowledgedQuantity: z.object({
              amount: z.number(),
              unitOfMeasure: z.string(),
            }),
          })),
        })).describe("Order acknowledgements"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/directFulfillment/orders/2021-12-28/acknowledgements",
          { orderAcknowledgements: params.orderAcknowledgements },
          "vendor-df-orders"
        );
        return response.data;
      },
    },
  ];
}
