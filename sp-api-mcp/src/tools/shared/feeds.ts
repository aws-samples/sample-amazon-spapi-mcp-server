import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createFeedsTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_feeds_create_feed_document",
      description:
        "Create a feed document and get a pre-signed URL for uploading feed content. This is step 1 of feed submission. Rate limit: 0.5 requests/sec (burst of 15).",
      scope: "shared",
      apiDomain: "feeds",
      inputSchema: {
        contentType: z
          .enum([
            "text/xml; charset=UTF-8",
            "text/tab-separated-values; charset=UTF-8",
            "application/json",
          ])
          .describe("Content type of the feed document"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/feeds/2021-06-30/documents",
          { contentType: params.contentType },
          "feeds"
        );
        return response.data;
      },
    },
    {
      name: "spapi_feeds_create_feed",
      description:
        "Submit a feed for processing. Requires a feed document ID (from create_feed_document). Common feed types: POST_FLAT_FILE_LISTINGS_DATA, POST_PRODUCT_DATA, POST_INVENTORY_AVAILABILITY_DATA, POST_PRODUCT_PRICING_DATA. Rate limit: 0.5 requests/sec (burst of 15).",
      scope: "shared",
      apiDomain: "feeds",
      inputSchema: {
        feedType: z.string().describe("Feed type ID (e.g. POST_FLAT_FILE_LISTINGS_DATA)"),
        inputFeedDocumentId: z.string().describe("Feed document ID from create_feed_document"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/feeds/2021-06-30/feeds",
          {
            feedType: params.feedType,
            marketplaceIds,
            inputFeedDocumentId: params.inputFeedDocumentId,
          },
          "feeds"
        );
        return response.data;
      },
    },
    {
      name: "spapi_feeds_get_feed",
      description:
        "Get the status and details of a submitted feed. Returns processing status and result document ID when complete. Rate limit: 2 requests/sec (burst of 15).",
      scope: "shared",
      apiDomain: "feeds",
      inputSchema: {
        feedId: z.string().describe("The feed ID returned by create_feed"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/feeds/2021-06-30/feeds/${params.feedId}`,
          {},
          "feeds"
        );
        return response.data;
      },
    },
    {
      name: "spapi_feeds_get_feed_document",
      description:
        "Get a pre-signed URL to download the feed processing result document. Use after feed status is DONE. Rate limit: 0.0222 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "feeds",
      inputSchema: {
        feedDocumentId: z.string().describe("The result feed document ID from a completed feed"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/feeds/2021-06-30/documents/${params.feedDocumentId}`,
          {},
          "feeds"
        );
        return response.data;
      },
    },
  ];
}
