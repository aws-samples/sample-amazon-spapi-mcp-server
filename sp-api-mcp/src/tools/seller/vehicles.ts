import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVehiclesTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vehicles_search_vehicles",
      description:
        "Search for vehicles by make, model, year, or other attributes. Returns vehicle compatibility data for automotive parts. Rate limit: 5 requests/sec.",
      scope: "seller",
      apiDomain: "vehicles",
      inputSchema: {
        make: z.string().optional().describe("Vehicle make (e.g., Toyota)"),
        model: z.string().optional().describe("Vehicle model (e.g., Camry)"),
        year: z.string().optional().describe("Vehicle year"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/vehicles/2024-11-01/vehicles",
          {
            make: params.make,
            model: params.model,
            year: params.year,
            nextToken: params.nextToken,
          },
          "vehicles"
        );
        return response.data;
      },
    },
  ];
}
