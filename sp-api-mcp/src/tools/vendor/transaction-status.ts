import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorTransactionStatusTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_transaction_get_status",
      description:
        "Get the status of an asynchronous vendor transaction (e.g., after submitting acknowledgements, shipments, or invoices). Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-transaction-status",
      inputSchema: {
        transactionId: z.string().describe("Transaction ID returned from a POST operation"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/vendor/transactions/v1/transactions/${params.transactionId}`,
          {},
          "vendor-transaction-status"
        );
        return response.data;
      },
    },
    {
      name: "spapi_vendor_df_transaction_get_status",
      description:
        "Get the status of an asynchronous direct fulfillment vendor transaction. Rate limit: 10 requests/sec.",
      scope: "vendor",
      apiDomain: "vendor-df-transaction-status",
      inputSchema: {
        transactionId: z.string().describe("Transaction ID returned from a DF POST operation"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/vendor/directFulfillment/transactions/2021-12-28/transactions/${params.transactionId}`,
          {},
          "vendor-df-transaction-status"
        );
        return response.data;
      },
    },
  ];
}
