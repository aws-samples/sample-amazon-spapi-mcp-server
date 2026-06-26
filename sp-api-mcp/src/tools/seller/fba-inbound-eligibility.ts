import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createFbaInboundEligibilityTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_fba_inbound_eligibility_get_item_eligibility_preview",
      description:
        "Check if an item is eligible for FBA inbound. Returns eligibility status and any ineligibility reasons. Rate limit: 1 request/sec.",
      scope: "seller",
      apiDomain: "fba-inbound-eligibility",
      inputSchema: {
        asin: z.string().describe("ASIN to check eligibility for"),
        program: z.enum(["INBOUND", "COMMINGLING"]).default("INBOUND").describe("FBA program type"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/fba/inbound/v1/eligibility/itemPreview",
          {
            asin: params.asin,
            program: params.program,
            marketplaceIds: marketplaceIds.join(","),
          },
          "fba-inbound-eligibility"
        );
        return response.data;
      },
    },
  ];
}
