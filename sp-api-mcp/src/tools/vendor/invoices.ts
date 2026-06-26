import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createVendorInvoicesTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_vendor_invoices_submit_invoices",
      description:
        "Submit invoices for vendor purchase orders. Includes invoice number, dates, amounts, and line item details. Rate limit: 10 requests/sec (burst of 10). NOTE: Write operation.",
      scope: "vendor",
      apiDomain: "vendor-invoices",
      inputSchema: {
        invoices: z
          .array(
            z.object({
              invoiceType: z.enum(["Invoice", "CreditNote"]).describe("Invoice or credit note"),
              id: z.string().describe("Vendor's invoice number"),
              referenceNumber: z.string().optional().describe("Reference/PO number"),
              date: z.string().describe("ISO 8601 invoice date"),
              invoiceTotal: z.object({
                currencyCode: z.string().describe("ISO 4217 currency code"),
                amount: z.string().describe("Total invoice amount as string"),
              }),
              items: z
                .array(
                  z.object({
                    itemSequenceNumber: z.number(),
                    amazonProductIdentifier: z.string().optional(),
                    vendorProductIdentifier: z.string().optional(),
                    invoicedQuantity: z.object({ amount: z.number(), unitOfMeasure: z.string() }),
                    netCost: z.object({ currencyCode: z.string(), amount: z.string() }),
                    purchaseOrderNumber: z.string().optional(),
                  })
                )
                .describe("Invoice line items"),
            })
          )
          .describe("Array of invoices to submit"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/vendor/payments/v1/invoices",
          { invoices: params.invoices },
          "vendor-invoices"
        );
        return response.data;
      },
    },
  ];
}
