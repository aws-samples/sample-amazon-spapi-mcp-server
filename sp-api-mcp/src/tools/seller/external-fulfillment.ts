import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createExternalFulfillmentTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_external_fulfillment_inventory_get_inventory",
      description:
        "Get external fulfillment inventory levels by location. Shows inventory across non-Amazon channels. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "external-fulfillment",
      inputSchema: {
        locationId: z.string().optional().describe("Filter by location ID"),
        sku: z.string().optional().describe("Filter by SKU"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/externalFulfillment/inventory/2024-09-11/locations",
          {
            locationId: params.locationId,
            sku: params.sku,
            nextToken: params.nextToken,
          },
          "external-fulfillment"
        );
        return response.data;
      },
    },
    {
      name: "spapi_external_fulfillment_shipping_get_orders",
      description:
        "Get external fulfillment shipping orders that need processing. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "external-fulfillment",
      inputSchema: {
        status: z.enum(["PENDING", "SHIPPED", "CANCELLED"]).optional().describe("Filter by status"),
        createdAfter: z.string().optional().describe("ISO 8601 date"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/externalFulfillment/shipping/2024-09-11/orders",
          {
            status: params.status,
            createdAfter: params.createdAfter,
            nextToken: params.nextToken,
          },
          "external-fulfillment"
        );
        return response.data;
      },
    },
    {
      name: "spapi_external_fulfillment_returns_get_returns",
      description:
        "Get return information for external fulfillment orders. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "external-fulfillment",
      inputSchema: {
        status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional().describe("Filter by status"),
        createdAfter: z.string().optional().describe("ISO 8601 date"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/externalFulfillment/returns/2024-09-11/returns",
          {
            status: params.status,
            createdAfter: params.createdAfter,
            nextToken: params.nextToken,
          },
          "external-fulfillment"
        );
        return response.data;
      },
    },
  ];
}
