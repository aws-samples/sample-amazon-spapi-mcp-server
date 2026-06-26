import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createShippingTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_shipping_get_rates",
      description:
        "Get shipping rates for a shipment. Provide package dimensions, weight, origin, and destination. Returns available carrier rates. Rate limit: 80 requests/sec.",
      scope: "seller",
      apiDomain: "shipping",
      inputSchema: {
        shipFrom: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrRegion: z.string(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Ship from address"),
        shipTo: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrRegion: z.string(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Ship to address"),
        packages: z.array(z.object({
          dimensions: z.object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
            unit: z.enum(["IN", "CM"]),
          }),
          weight: z.object({
            value: z.number(),
            unit: z.enum(["LB", "KG", "G", "OZ"]),
          }),
        })).describe("Package dimensions and weights"),
        channelType: z.enum(["AMAZON", "EXTERNAL"]).default("AMAZON").describe("Channel type"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/shipping/v2/shipments/rates",
          {
            shipFrom: params.shipFrom,
            shipTo: params.shipTo,
            packages: params.packages,
            channelType: params.channelType,
          },
          "shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_shipping_purchase_shipment",
      description:
        "Purchase a shipping label for a shipment using a selected rate. Returns tracking info and label. Rate limit: 80 requests/sec. NOTE: Write operation — charges your account.",
      scope: "seller",
      apiDomain: "shipping",
      inputSchema: {
        requestToken: z.string().describe("Request token from get_rates response"),
        rateId: z.string().describe("Rate ID from get_rates response"),
        requestedDocumentSpecification: z.object({
          format: z.enum(["PNG", "PDF"]).default("PDF"),
          size: z.object({ width: z.number(), height: z.number(), unit: z.enum(["IN", "CM"]) }),
          dpi: z.number().optional(),
        }).describe("Label format specification"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/shipping/v2/shipments",
          {
            requestToken: params.requestToken,
            rateId: params.rateId,
            requestedDocumentSpecification: params.requestedDocumentSpecification,
          },
          "shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_shipping_get_tracking",
      description:
        "Get tracking information for a shipment by tracking ID. Returns carrier, status, and event history. Rate limit: 80 requests/sec.",
      scope: "seller",
      apiDomain: "shipping",
      inputSchema: {
        trackingId: z.string().describe("Tracking ID from purchase_shipment"),
        carrierId: z.string().describe("Carrier ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/shipping/v2/tracking`,
          {
            trackingId: params.trackingId,
            carrierId: params.carrierId,
          },
          "shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_shipping_cancel_shipment",
      description:
        "Cancel a previously purchased shipping label. DESTRUCTIVE — cannot be undone. Rate limit: 80 requests/sec.",
      scope: "seller",
      apiDomain: "shipping",
      inputSchema: {
        shipmentId: z.string().describe("Shipment ID to cancel"),
      },
      handler: async (params) => {
        const response = await client.put(
          `/shipping/v2/shipments/${params.shipmentId}/cancel`,
          {},
          "shipping"
        );
        return response.data;
      },
    },
    {
      name: "spapi_shipping_get_shipment_documents",
      description:
        "Retrieve shipping documents (labels, customs forms) for a purchased shipment. Rate limit: 80 requests/sec.",
      scope: "seller",
      apiDomain: "shipping",
      inputSchema: {
        shipmentId: z.string().describe("Shipment ID"),
        packageClientReferenceId: z.string().describe("Package client reference ID"),
        format: z.enum(["PNG", "PDF"]).optional().describe("Document format"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/shipping/v2/shipments/${params.shipmentId}/documents`,
          {
            packageClientReferenceId: params.packageClientReferenceId,
            format: params.format,
          },
          "shipping"
        );
        return response.data;
      },
    },
  ];
}
