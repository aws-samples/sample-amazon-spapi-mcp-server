import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorDFPaymentsTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_df_payments_submit_invoices",
      description:
        "Submit invoices for direct fulfillment orders. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "vendor",
      apiDomain: "vendor-df-payments",
      inputSchema: {
        invoices: z.array(z.object({
          invoiceNumber: z.string().describe("Vendor invoice number"),
          invoiceDate: z.string().describe("ISO 8601 invoice date"),
          referenceNumber: z.string().optional().describe("PO reference"),
          invoiceTotal: z.object({
            currencyCode: z.string(),
            amount: z.string(),
          }),
          lineItems: z.array(z.object({
            itemSequenceNumber: z.number(),
            buyerProductIdentifier: z.string().optional(),
            vendorProductIdentifier: z.string().optional(),
            invoicedQuantity: z.object({ amount: z.number(), unitOfMeasure: z.string() }),
            netCost: z.object({ currencyCode: z.string(), amount: z.string() }),
          })),
        })).describe("Invoices to submit"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/directFulfillment/payments/v1/invoices",
          { invoices: params.invoices },
          "vendor-df-payments"
        );
        return response.data;
      },
    },
  ];
}
