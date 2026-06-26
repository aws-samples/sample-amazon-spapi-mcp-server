import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorOrdersTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_orders_get_purchase_orders",
      description:
        "Get vendor purchase orders (POs) from Amazon. Filter by status, dates, and ordering. Returns PO numbers, items, quantities, costs, and delivery windows. Rate limit: 10 requests/sec (burst of 10).",
      scope: "vendor",
      apiDomain: "vendor-orders",
      inputSchema: {
        createdAfter: z.string().optional().describe("ISO 8601 date. POs created after this date."),
        createdBefore: z.string().optional().describe("ISO 8601 date. POs created before this date."),
        purchaseOrderState: z
          .enum(["New", "Acknowledged", "Closed"])
          .optional()
          .describe("Filter by PO state"),
        sortOrder: z.enum(["ASC", "DESC"]).optional().describe("Sort by creation date"),
        limit: z.number().optional().describe("Max results per page"),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/vendor/orders/v1/purchaseOrders",
          {
            createdAfter: params.createdAfter,
            createdBefore: params.createdBefore,
            purchaseOrderState: params.purchaseOrderState,
            sortOrder: params.sortOrder,
            limit: params.limit,
            nextToken: params.nextToken,
          },
          "vendor-orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_orders_get_purchase_order",
      description:
        "Get details for a single vendor purchase order by PO number. Includes all line items, quantities, costs, and shipping details. Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-orders",
      inputSchema: {
        purchaseOrderNumber: z.string().describe("The purchase order number"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/vendor/orders/v1/purchaseOrders/${params.purchaseOrderNumber}`,
          {},
          "vendor-orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_orders_submit_acknowledgement",
      description:
        "Submit acknowledgement for one or more vendor purchase orders. Accept or reject PO line items with expected ship/delivery dates. Rate limit: 10 requests/sec. NOTE: This is a write operation that confirms PO acceptance.",
      scope: "vendor",
      apiDomain: "vendor-orders",
      inputSchema: {
        acknowledgements: z
          .array(
            z.object({
              purchaseOrderNumber: z.string().describe("PO number being acknowledged"),
              acknowledgementDate: z.string().describe("ISO 8601 acknowledgement date"),
              items: z
                .array(
                  z.object({
                    itemSequenceNumber: z.string().describe("Item sequence number from PO"),
                    amazonProductIdentifier: z.string().optional().describe("ASIN"),
                    vendorProductIdentifier: z.string().optional().describe("Vendor product ID"),
                    orderedQuantity: z.object({
                      amount: z.number(),
                      unitOfMeasure: z.string(),
                    }),
                    acknowledgementStatus: z.object({
                      confirmationStatus: z.enum(["ACCEPTED", "REJECTED", "BACK_ORDERED"]),
                      acceptedQuantity: z.object({ amount: z.number(), unitOfMeasure: z.string() }).optional(),
                      rejectedQuantity: z.object({ amount: z.number(), unitOfMeasure: z.string() }).optional(),
                    }),
                  })
                )
                .describe("Line items being acknowledged"),
            })
          )
          .describe("Array of PO acknowledgements"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/orders/v1/acknowledgements",
          { acknowledgements: params.acknowledgements },
          "vendor-orders"
        );
        return response.data;
      },
    },
  ];
}
