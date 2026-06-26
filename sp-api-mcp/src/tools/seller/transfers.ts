import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createTransfersTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_transfers_initiate_payout",
      description:
        "Initiate a payout/transfer to your bank account (EU marketplaces). Rate limit: 1 request/sec. NOTE: Write operation — initiates a real money transfer.",
      scope: "seller",
      apiDomain: "transfers",
      inputSchema: {
        amount: z.object({
          currencyCode: z.string().describe("ISO 4217 currency code"),
          value: z.string().describe("Amount as string"),
        }).describe("Transfer amount"),
        paymentMethodId: z.string().optional().describe("Payment method ID (uses default if not specified)"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/transfers/2024-06-01/payouts",
          {
            amount: params.amount,
            paymentMethodId: params.paymentMethodId,
          },
          "transfers"
        );
        return response.data;
      },
    },
    {
      name: "spapi_transfers_get_payment_methods",
      description:
        "Get available payment methods for payouts. Rate limit: 2 requests/sec.",
      scope: "seller",
      apiDomain: "transfers",
      inputSchema: {},
      handler: async () => {
        const response = await client.get(
          "/transfers/2024-06-01/paymentMethods",
          {},
          "transfers"
        );
        return response.data;
      },
    },
  ];
}
