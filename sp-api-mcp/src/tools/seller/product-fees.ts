import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createProductFeesTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_product_fees_get_my_fees_estimate_for_asin",
      description:
        "Get fee estimates for a product by ASIN. Returns referral fees, FBA fees, closing fees, etc. based on price and fulfillment channel. Rate limit: 0.5 requests/sec (burst of 1).",
      scope: "seller",
      apiDomain: "product-fees",
      inputSchema: {
        asin: z.string().describe("ASIN to estimate fees for"),
        price: z.number().positive().describe("Item price"),
        currencyCode: z.string().default("USD").describe("ISO 4217 currency code"),
        isAmazonFulfilled: z.boolean().default(true).describe("True for FBA, false for MFN"),
        optionalFulfillmentProgram: z.enum(["FBA_CORE", "FBA_SNL", "FBA_EFN"]).optional().describe("FBA program"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/products/fees/v0/items/${params.asin}/feesEstimate`,
          {
            FeesEstimateRequest: {
              MarketplaceId: "ATVPDKIKX0DER",
              IsAmazonFulfilled: params.isAmazonFulfilled,
              PriceToEstimateFees: {
                ListingPrice: {
                  CurrencyCode: params.currencyCode,
                  Amount: params.price,
                },
              },
              Identifier: `fee-estimate-${params.asin}`,
              OptionalFulfillmentProgram: params.optionalFulfillmentProgram,
            },
          },
          "product-fees"
        );
        return response.data;
      },
    },
    {
      name: "spapi_product_fees_get_my_fees_estimates",
      description:
        "Get fee estimates for multiple products in batch (up to 20). Rate limit: 0.5 requests/sec.",
      scope: "seller",
      apiDomain: "product-fees",
      inputSchema: {
        items: z.array(z.object({
          asin: z.string().describe("ASIN"),
          price: z.number().positive().describe("Item price"),
          currencyCode: z.string().default("USD"),
          isAmazonFulfilled: z.boolean().default(true),
        })).max(20).describe("Items to estimate fees for (max 20)"),
      },
      handler: async (params) => {
        const requests = (params.items as Array<{ asin: string; price: number; currencyCode: string; isAmazonFulfilled: boolean }>).map((item) => ({
          FeesEstimateRequest: {
            MarketplaceId: "ATVPDKIKX0DER",
            IsAmazonFulfilled: item.isAmazonFulfilled,
            PriceToEstimateFees: {
              ListingPrice: {
                CurrencyCode: item.currencyCode,
                Amount: item.price,
              },
            },
            Identifier: `fee-estimate-${item.asin}`,
          },
          IdType: "ASIN",
          IdValue: item.asin,
        }));

        const response = await client.post(
          "/products/fees/v0/feesEstimate",
          requests,
          "product-fees"
        );
        return response.data;
      },
    },
  ];
}
