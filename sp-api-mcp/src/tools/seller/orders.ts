import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createOrdersTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_orders_get_orders",
      description:
        "Get a list of orders based on criteria such as date range, status, and fulfillment channel. Returns order summaries with IDs, dates, amounts, and status. Rate limit: 0.0167 requests/sec (1 per minute burst of 20).",
      scope: "seller",
      apiDomain: "orders",
      inputSchema: {
        createdAfter: z.string().optional().describe("ISO 8601 date. Orders created after this date."),
        createdBefore: z.string().optional().describe("ISO 8601 date. Orders created before this date."),
        lastUpdatedAfter: z.string().optional().describe("ISO 8601 date. Orders updated after this date."),
        lastUpdatedBefore: z.string().optional().describe("ISO 8601 date. Orders updated before this date."),
        orderStatuses: z
          .array(z.string())
          .optional()
          .describe("Filter by status: Pending, Unshipped, PartiallyShipped, Shipped, Canceled, Unfulfillable"),
        fulfillmentChannels: z
          .array(z.string())
          .optional()
          .describe("MFN (seller-fulfilled) or AFN (Amazon-fulfilled)"),
        maxResultsPerPage: z.number().optional().describe("Max results per page (1-100, default 100)"),
        nextToken: z.string().optional().describe("Pagination token from previous response"),
      },
      handler: async (params) => {
        const response = await client.get("/orders/v0/orders", {
          MarketplaceIds: marketplaceIds.join(","),
          CreatedAfter: params.createdAfter,
          CreatedBefore: params.createdBefore,
          LastUpdatedAfter: params.lastUpdatedAfter,
          LastUpdatedBefore: params.lastUpdatedBefore,
          OrderStatuses: (params.orderStatuses as string[])?.join(","),
          FulfillmentChannels: (params.fulfillmentChannels as string[])?.join(","),
          MaxResultsPerPage: params.maxResultsPerPage,
          NextToken: params.nextToken,
        }, "orders");
        return response.data;
      },
    },
    {
      name: "spapi_orders_get_order",
      description:
        "Get detailed information for a single order by order ID. Includes shipping address, payment info, and order totals. Rate limit: 0.5 requests/sec (burst of 30).",
      scope: "seller",
      apiDomain: "orders",
      inputSchema: {
        orderId: z.string().describe("Amazon order ID (e.g. 111-1234567-1234567)"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/orders/v0/orders/${params.orderId}`,
          {},
          "orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_orders_get_order_items",
      description:
        "Get line items for a specific order including ASINs, quantities, prices, and fulfillment info. Rate limit: 0.5 requests/sec (burst of 30).",
      scope: "seller",
      apiDomain: "orders",
      inputSchema: {
        orderId: z.string().describe("Amazon order ID"),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/orders/v0/orders/${params.orderId}/orderItems`,
          { NextToken: params.nextToken },
          "orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_orders_get_order_address",
      description:
        "Get the shipping address for an order. Requires Restricted Data Token (RDT) for PII fields. Rate limit: 0.5 requests/sec.",
      scope: "seller",
      apiDomain: "orders",
      inputSchema: {
        orderId: z.string().describe("Amazon order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/orders/v0/orders/${params.orderId}/address`,
          {},
          "orders"
        );
        return response.data;
      },
    },
    {
      name: "spapi_orders_get_order_buyer_info",
      description:
        "Get buyer information (name, email) for an order. Requires Restricted Data Token (RDT). Rate limit: 0.5 requests/sec.",
      scope: "seller",
      apiDomain: "orders",
      inputSchema: {
        orderId: z.string().describe("Amazon order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/orders/v0/orders/${params.orderId}/buyerInfo`,
          {},
          "orders"
        );
        return response.data;
      },
    },
  ];
}
