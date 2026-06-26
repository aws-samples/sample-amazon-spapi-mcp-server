import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createSupplySourcesTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_supply_sources_get_supply_sources",
      description:
        "List seller supply sources (fulfillment locations). Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "supply-sources",
      inputSchema: {
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/supplySources/2020-07-01/supplySources",
          { nextToken: params.nextToken },
          "supply-sources"
        );
        return response.data;
      },
    },
    {
      name: "spapi_supply_sources_get_supply_source",
      description:
        "Get details of a specific supply source by ID. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "supply-sources",
      inputSchema: {
        supplySourceId: z.string().describe("Supply source ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/supplySources/2020-07-01/supplySources/${params.supplySourceId}`,
          {},
          "supply-sources"
        );
        return response.data;
      },
    },
    {
      name: "spapi_supply_sources_create_supply_source",
      description:
        "Create a new supply source (fulfillment location). Rate limit: 2 requests/sec. NOTE: Write operation.",
      scope: "seller",
      apiDomain: "supply-sources",
      inputSchema: {
        alias: z.string().describe("Display name for the supply source"),
        supplySourceCode: z.string().describe("Unique code for the supply source"),
        address: z.object({
          name: z.string(),
          addressLine1: z.string(),
          city: z.string(),
          stateOrRegion: z.string().optional(),
          postalCode: z.string(),
          countryCode: z.string(),
        }).describe("Supply source address"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/supplySources/2020-07-01/supplySources",
          {
            alias: params.alias,
            supplySourceCode: params.supplySourceCode,
            address: params.address,
          },
          "supply-sources"
        );
        return response.data;
      },
    },
  ];
}
