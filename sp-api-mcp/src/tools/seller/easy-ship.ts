import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createEasyShipTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_easy_ship_list_handover_slots",
      description:
        "Get available handover time slots for Easy Ship orders (IN/JP). Returns slot IDs, dates, and times for package pickup. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "easy-ship",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
        packageDimensions: z.object({
          length: z.number(),
          width: z.number(),
          height: z.number(),
          unit: z.enum(["Cm"]).default("Cm"),
        }).describe("Package dimensions"),
        packageWeight: z.object({
          value: z.number(),
          unit: z.enum(["G", "Kg"]).default("G"),
        }).describe("Package weight"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/easyShip/2022-03-23/timeSlot",
          {
            amazonOrderId: params.amazonOrderId,
            marketplaceId: marketplaceIds[0],
            packageDimensions: params.packageDimensions,
            packageWeight: params.packageWeight,
          },
          "easy-ship"
        );
        return response.data;
      },
    },
    {
      name: "spapi_easy_ship_create_scheduled_package",
      description:
        "Schedule an Easy Ship package for pickup at a specific time slot. Rate limit: 1 request/sec. NOTE: Write operation.",
      scope: "seller",
      apiDomain: "easy-ship",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
        slotId: z.string().describe("Time slot ID from list_handover_slots"),
        packageDimensions: z.object({
          length: z.number(),
          width: z.number(),
          height: z.number(),
          unit: z.enum(["Cm"]).default("Cm"),
        }).describe("Package dimensions"),
        packageWeight: z.object({
          value: z.number(),
          unit: z.enum(["G", "Kg"]).default("G"),
        }).describe("Package weight"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/easyShip/2022-03-23/package",
          {
            amazonOrderId: params.amazonOrderId,
            marketplaceId: marketplaceIds[0],
            packageDetails: {
              packageTimeSlot: { slotId: params.slotId },
              packageDimensions: params.packageDimensions,
              packageWeight: params.packageWeight,
            },
          },
          "easy-ship"
        );
        return response.data;
      },
    },
    {
      name: "spapi_easy_ship_get_scheduled_package",
      description:
        "Get details of a scheduled Easy Ship package by order ID. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "easy-ship",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/easyShip/2022-03-23/package",
          {
            amazonOrderId: params.amazonOrderId,
            marketplaceId: marketplaceIds[0],
          },
          "easy-ship"
        );
        return response.data;
      },
    },
    {
      name: "spapi_easy_ship_update_scheduled_packages",
      description:
        "Update time slot for a scheduled Easy Ship package. Rate limit: 1 request/sec. NOTE: Write operation.",
      scope: "seller",
      apiDomain: "easy-ship",
      inputSchema: {
        amazonOrderId: z.string().describe("Amazon order ID"),
        slotId: z.string().describe("New time slot ID"),
      },
      handler: async (params) => {
        const response = await client.patch(
          "/easyShip/2022-03-23/package",
          {
            amazonOrderId: params.amazonOrderId,
            marketplaceId: marketplaceIds[0],
            packageDetails: {
              packageTimeSlot: { slotId: params.slotId },
            },
          },
          "easy-ship"
        );
        return response.data;
      },
    },
  ];
}
