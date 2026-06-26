import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createFulfillmentOutboundTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_mcf_get_fulfillment_preview",
      description:
        "Get a fulfillment preview for Multi-Channel Fulfillment (MCF). Shows available shipping options, estimated delivery dates, and fees for fulfilling an order from FBA inventory. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-outbound",
      inputSchema: {
        address: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrRegion: z.string().optional(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Destination address"),
        items: z.array(z.object({
          sellerSku: z.string(),
          quantity: z.number().int().positive(),
          sellerFulfillmentOrderItemId: z.string(),
        })).describe("Items to fulfill"),
        shippingSpeedCategories: z.array(z.enum(["Standard", "Expedited", "Priority"])).optional(),
      },
      handler: async (params) => {
        const response = await client.post(
          "/fba/outbound/2020-07-01/fulfillmentOrders/preview",
          {
            address: params.address,
            items: params.items,
            shippingSpeedCategories: params.shippingSpeedCategories,
          },
          "fulfillment-outbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_mcf_create_fulfillment_order",
      description:
        "Create a Multi-Channel Fulfillment order to ship inventory from FBA to a customer. Rate limit: 2 requests/sec. NOTE: Write operation — creates a real fulfillment order.",
      scope: "seller",
      apiDomain: "fulfillment-outbound",
      inputSchema: {
        sellerFulfillmentOrderId: z.string().describe("Your unique order reference"),
        displayableOrderId: z.string().describe("Order ID shown to customer"),
        displayableOrderDate: z.string().describe("ISO 8601 order date"),
        displayableOrderComment: z.string().optional().describe("Comment shown to customer"),
        shippingSpeedCategory: z.enum(["Standard", "Expedited", "Priority"]).describe("Shipping speed"),
        destinationAddress: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrRegion: z.string().optional(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Shipping address"),
        items: z.array(z.object({
          sellerSku: z.string(),
          sellerFulfillmentOrderItemId: z.string(),
          quantity: z.number().int().positive(),
        })).describe("Items to fulfill"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/fba/outbound/2020-07-01/fulfillmentOrders",
          params,
          "fulfillment-outbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_mcf_get_fulfillment_order",
      description:
        "Get status and details of an existing MCF fulfillment order. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-outbound",
      inputSchema: {
        sellerFulfillmentOrderId: z.string().describe("Your fulfillment order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/fba/outbound/2020-07-01/fulfillmentOrders/${params.sellerFulfillmentOrderId}`,
          {},
          "fulfillment-outbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_mcf_list_fulfillment_orders",
      description:
        "List MCF fulfillment orders with optional date filter. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-outbound",
      inputSchema: {
        queryStartDate: z.string().optional().describe("ISO 8601 start date filter"),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/fba/outbound/2020-07-01/fulfillmentOrders",
          {
            queryStartDate: params.queryStartDate,
            nextToken: params.nextToken,
          },
          "fulfillment-outbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_mcf_cancel_fulfillment_order",
      description:
        "Cancel an MCF fulfillment order. Only works if order has not shipped. DESTRUCTIVE. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-outbound",
      inputSchema: {
        sellerFulfillmentOrderId: z.string().describe("Fulfillment order ID to cancel"),
      },
      handler: async (params) => {
        const response = await client.put(
          `/fba/outbound/2020-07-01/fulfillmentOrders/${params.sellerFulfillmentOrderId}/cancel`,
          {},
          "fulfillment-outbound"
        );
        return response.data;
      },
    },
  ];
}
