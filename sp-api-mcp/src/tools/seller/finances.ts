import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createFinancesTools(
  client: SpApiClient,
  _config: ServerConfig
): ToolDefinition[] {
  return [
    {
      name: "spapi_finances_list_transactions",
      description:
        "List financial transactions for the seller account, including order charges, refunds, fees, and adjustments. Rate limit: 0.5 requests/sec (burst of 10).",
      scope: "seller",
      apiDomain: "finances",
      inputSchema: {
        postedAfter: z.string().describe("ISO 8601 date. Transactions posted after this date."),
        postedBefore: z.string().optional().describe("ISO 8601 date. Transactions posted before this date."),
        marketplaceId: z.string().optional().describe("Filter by marketplace ID"),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/finances/2024-06-19/transactions",
          {
            postedAfter: params.postedAfter,
            postedBefore: params.postedBefore,
            marketplaceId: params.marketplaceId,
            nextToken: params.nextToken,
          },
          "finances"
        );
        return response.data;
      },
    },
  ];
}
