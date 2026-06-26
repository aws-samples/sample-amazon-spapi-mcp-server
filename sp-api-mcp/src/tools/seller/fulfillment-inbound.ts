import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createFulfillmentInboundTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_fba_inbound_create_inbound_plan",
      description:
        "Create an inbound plan for sending inventory to Amazon FBA. Specify items, quantities, and source address. Rate limit: 2 requests/sec (burst of 2).",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        destinationMarketplaces: z.array(z.string()).describe("Marketplace IDs for destination"),
        items: z.array(z.object({
          msku: z.string().describe("Merchant SKU"),
          quantity: z.number().int().positive().describe("Quantity to ship"),
          prepOwner: z.enum(["AMAZON", "SELLER"]).optional(),
          labelOwner: z.enum(["AMAZON", "SELLER"]).optional(),
        })).describe("Items to include in inbound plan"),
        sourceAddress: z.object({
          name: z.string(),
          addressLine1: z.string(),
          addressLine2: z.string().optional(),
          city: z.string(),
          stateOrProvince: z.string(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Source/ship-from address"),
        name: z.string().optional().describe("Plan name"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/inbound/fba/2024-03-20/inboundPlans",
          {
            destinationMarketplaces: params.destinationMarketplaces,
            items: params.items,
            sourceAddress: params.sourceAddress,
            name: params.name,
          },
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_fba_inbound_get_inbound_plan",
      description:
        "Get details of an existing FBA inbound plan including status, items, and shipments. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        inboundPlanId: z.string().describe("Inbound plan ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/inbound/fba/2024-03-20/inboundPlans/${params.inboundPlanId}`,
          {},
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_fba_inbound_list_inbound_plans",
      description:
        "List FBA inbound plans with optional filters for status and date. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        status: z.enum(["ACTIVE", "VOIDED", "SHIPPED", "ERRORED"]).optional().describe("Filter by plan status"),
        pageSize: z.number().optional().describe("Results per page (default 10)"),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/inbound/fba/2024-03-20/inboundPlans",
          {
            status: params.status,
            pageSize: params.pageSize,
            paginationToken: params.nextToken,
          },
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_fba_inbound_list_inbound_plan_items",
      description:
        "List items within an FBA inbound plan. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        inboundPlanId: z.string().describe("Inbound plan ID"),
        pageSize: z.number().optional(),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          `/inbound/fba/2024-03-20/inboundPlans/${params.inboundPlanId}/items`,
          { pageSize: params.pageSize, paginationToken: params.nextToken },
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_fba_inbound_generate_shipment_content_update_previews",
      description:
        "Generate content update previews for an inbound shipment (e.g., box content changes). Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        inboundPlanId: z.string().describe("Inbound plan ID"),
        shipmentId: z.string().describe("Shipment ID within the plan"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/inbound/fba/2024-03-20/inboundPlans/${params.inboundPlanId}/shipments/${params.shipmentId}/contentUpdatePreviews`,
          {},
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_fba_inbound_confirm_shipment_content_update_preview",
      description:
        "Confirm a shipment content update preview. Rate limit: 2 requests/sec. NOTE: Write operation.",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        inboundPlanId: z.string().describe("Inbound plan ID"),
        shipmentId: z.string().describe("Shipment ID"),
        contentUpdatePreviewId: z.string().describe("Content update preview ID"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/inbound/fba/2024-03-20/inboundPlans/${params.inboundPlanId}/shipments/${params.shipmentId}/contentUpdatePreviews/${params.contentUpdatePreviewId}/confirmation`,
          {},
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
    {
      name: "spapi_fba_inbound_get_shipment",
      description:
        "Get details for a specific shipment within an inbound plan. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "fulfillment-inbound",
      inputSchema: {
        inboundPlanId: z.string().describe("Inbound plan ID"),
        shipmentId: z.string().describe("Shipment ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/inbound/fba/2024-03-20/inboundPlans/${params.inboundPlanId}/shipments/${params.shipmentId}`,
          {},
          "fulfillment-inbound"
        );
        return response.data;
      },
    },
  ];
}
