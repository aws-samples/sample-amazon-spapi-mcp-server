import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createMerchantFulfillmentTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_merchant_fulfillment_get_eligible_shipment_services",
      description:
        "Get eligible shipping services for a seller-fulfilled (MFN) order. Returns available carriers, rates, and delivery estimates. Rate limit: 1 request/sec (burst of 1).",
      scope: "seller",
      apiDomain: "merchant-fulfillment",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
        itemList: z.array(z.object({
          orderItemId: z.string(),
          quantity: z.number().int().positive(),
        })).describe("Order items to ship"),
        shipFromAddress: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrProvinceCode: z.string(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Ship from address"),
        packageDimensions: z.object({
          length: z.number(),
          width: z.number(),
          height: z.number(),
          unit: z.enum(["inches", "centimeters"]),
        }).describe("Package dimensions"),
        weight: z.object({
          value: z.number(),
          unit: z.enum(["oz", "g"]),
        }).describe("Package weight"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/mfn/v0/eligibleShippingServices",
          {
            shipmentRequestDetails: {
              amazonOrderId: params.amazonOrderId,
              itemList: params.itemList,
              shipFromAddress: params.shipFromAddress,
              packageDimensions: params.packageDimensions,
              weight: params.weight,
            },
          },
          "merchant-fulfillment"
        );
        return response.data;
      },
    },
    {
      name: "spapi_merchant_fulfillment_create_shipment",
      description:
        "Create a shipment and purchase a shipping label for a seller-fulfilled order. Rate limit: 1 request/sec. NOTE: Write operation — charges your account.",
      scope: "seller",
      apiDomain: "merchant-fulfillment",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
        shippingServiceId: z.string().describe("Service ID from get_eligible_shipment_services"),
        itemList: z.array(z.object({
          orderItemId: z.string(),
          quantity: z.number().int().positive(),
        })).describe("Items to ship"),
        shipFromAddress: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrProvinceCode: z.string(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Ship from address"),
        packageDimensions: z.object({
          length: z.number(),
          width: z.number(),
          height: z.number(),
          unit: z.enum(["inches", "centimeters"]),
        }).describe("Package dimensions"),
        weight: z.object({
          value: z.number(),
          unit: z.enum(["oz", "g"]),
        }).describe("Package weight"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/mfn/v0/shipments",
          {
            shipmentRequestDetails: {
              amazonOrderId: params.amazonOrderId,
              itemList: params.itemList,
              shipFromAddress: params.shipFromAddress,
              packageDimensions: params.packageDimensions,
              weight: params.weight,
            },
            shippingServiceId: params.shippingServiceId,
          },
          "merchant-fulfillment"
        );
        return response.data;
      },
    },
    {
      name: "spapi_merchant_fulfillment_get_shipment",
      description:
        "Get details and tracking for an existing merchant fulfillment shipment. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "merchant-fulfillment",
      inputSchema: {
        shipmentId: z.string().describe("Shipment ID from create_shipment"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/mfn/v0/shipments/${params.shipmentId}`,
          {},
          "merchant-fulfillment"
        );
        return response.data;
      },
    },
    {
      name: "spapi_merchant_fulfillment_cancel_shipment",
      description:
        "Cancel a merchant fulfillment shipment. DESTRUCTIVE. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "merchant-fulfillment",
      inputSchema: {
        shipmentId: z.string().describe("Shipment ID to cancel"),
      },
      handler: async (params) => {
        const response = await client.delete(
          `/mfn/v0/shipments/${params.shipmentId}`,
          "merchant-fulfillment"
        );
        return response.data;
      },
    },
  ];
}
