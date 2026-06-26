import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createSellersTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_sellers_get_marketplace_participations",
      description:
        "Get a list of marketplaces and participation details for the seller account. Shows which marketplaces you're registered in and your participation status. Rate limit: 0.016 requests/sec (burst of 15).",
      scope: "seller",
      apiDomain: "sellers",
      inputSchema: {},
      handler: async () => {
        const response = await client.get(
          "/sellers/v1/marketplaceParticipations",
          {},
          "sellers"
        );
        return response.data;
      },
    },
    {
      name: "spapi_sellers_get_account",
      description:
        "Get seller account information including business name, address, and marketplace registrations. Rate limit: 0.016 requests/sec.",
      scope: "seller",
      apiDomain: "sellers",
      inputSchema: {},
      handler: async () => {
        const response = await client.get(
          "/sellers/v1/account",
          {},
          "sellers"
        );
        return response.data;
      },
    },
  ];
}
