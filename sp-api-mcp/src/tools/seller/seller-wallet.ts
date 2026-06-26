import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createSellerWalletTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_seller_wallet_get_account",
      description:
        "Get Seller Wallet account details including balance and account status. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "seller-wallet",
      inputSchema: {},
      handler: async () => {
        const response = await client.get(
          "/sellerWallet/2024-03-01/account",
          {},
          "seller-wallet"
        );
        return response.data;
      },
    },
    {
      name: "spapi_seller_wallet_list_transactions",
      description:
        "List Seller Wallet transactions (deposits, withdrawals, transfers). Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "seller-wallet",
      inputSchema: {
        startDate: z.string().optional().describe("ISO 8601 start date"),
        endDate: z.string().optional().describe("ISO 8601 end date"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/sellerWallet/2024-03-01/transactions",
          {
            startDate: params.startDate,
            endDate: params.endDate,
            nextToken: params.nextToken,
          },
          "seller-wallet"
        );
        return response.data;
      },
    },
  ];
}
