import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createAwdTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_awd_list_inbound_orders",
      description:
        "List Amazon Warehousing & Distribution (AWD) inbound orders. AWD is a long-term storage program. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "awd",
      inputSchema: {
        status: z.enum(["DRAFT", "CONFIRMED", "CLOSED", "CANCELLED"]).optional().describe("Filter by order status"),
        createdAfter: z.string().optional().describe("ISO 8601 date"),
        createdBefore: z.string().optional().describe("ISO 8601 date"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/awd/2024-05-09/inboundOrders",
          {
            status: params.status,
            createdAfter: params.createdAfter,
            createdBefore: params.createdBefore,
            nextToken: params.nextToken,
          },
          "awd"
        );
        return response.data;
      },
    },
    {
      name: "spapi_awd_get_inbound_order",
      description:
        "Get details of an AWD inbound order. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "awd",
      inputSchema: {
        orderId: z.string().describe("AWD inbound order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/awd/2024-05-09/inboundOrders/${params.orderId}`,
          {},
          "awd"
        );
        return response.data;
      },
    },
    {
      name: "spapi_awd_list_inventory",
      description:
        "List inventory stored in AWD fulfillment centers. Shows SKU-level quantities. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "awd",
      inputSchema: {
        sku: z.string().optional().describe("Filter by SKU"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/awd/2024-05-09/inventory",
          { sku: params.sku, nextToken: params.nextToken },
          "awd"
        );
        return response.data;
      },
    },
  ];
}
