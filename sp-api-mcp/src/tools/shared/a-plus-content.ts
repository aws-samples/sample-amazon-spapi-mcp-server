import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createAPlusContentTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceId = config.marketplace.marketplace_ids[0];

  return [
    {
      name: "spapi_aplus_search_content_documents",
      description:
        "Search A+ Content documents for the selling partner. Returns content reference keys and metadata. Rate limit: 10 requests/sec.",
      scope: "shared",
      apiDomain: "a-plus-content",
      inputSchema: {
        pageToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/aplus/2020-11-01/contentDocuments",
          {
            marketplaceId,
            pageToken: params.pageToken,
          },
          "a-plus-content"
        );
        return response.data;
      },
    },
    {
      name: "spapi_aplus_get_content_document",
      description:
        "Get details of an A+ Content document by content reference key. Returns modules, ASINs, and approval status. Rate limit: 10 requests/sec.",
      scope: "shared",
      apiDomain: "a-plus-content",
      inputSchema: {
        contentReferenceKey: z.string().describe("Content reference key"),
        includedDataSet: z.array(z.enum(["CONTENTS", "METADATA"])).optional().describe("Data to include"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/aplus/2020-11-01/contentDocuments/${params.contentReferenceKey}`,
          {
            marketplaceId,
            includedDataSet: (params.includedDataSet as string[])?.join(","),
          },
          "a-plus-content"
        );
        return response.data;
      },
    },
    {
      name: "spapi_aplus_create_content_document",
      description:
        "Create a new A+ Content document with content modules. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "shared",
      apiDomain: "a-plus-content",
      inputSchema: {
        contentDocument: z.object({
          name: z.string().describe("Content document name"),
          contentType: z.enum(["EMC", "EBC"]).describe("Enhanced Marketing Content or Enhanced Brand Content"),
          contentModuleList: z.array(z.object({
            contentModuleType: z.string().describe("Module type (e.g., STANDARD_IMAGE_TEXT_OVERLAY)"),
            standardImageTextOverlay: z.unknown().optional(),
            standardComparisonTable: z.unknown().optional(),
          })).describe("Content modules"),
        }).describe("Content document body"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/aplus/2020-11-01/contentDocuments",
          {
            contentDocument: params.contentDocument,
            marketplaceId,
          },
          "a-plus-content"
        );
        return response.data;
      },
    },
    {
      name: "spapi_aplus_update_content_document",
      description:
        "Update an existing A+ Content document. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "shared",
      apiDomain: "a-plus-content",
      inputSchema: {
        contentReferenceKey: z.string().describe("Content reference key to update"),
        contentDocument: z.object({
          name: z.string(),
          contentType: z.enum(["EMC", "EBC"]),
          contentModuleList: z.array(z.unknown()),
        }).describe("Updated content document"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/aplus/2020-11-01/contentDocuments/${params.contentReferenceKey}`,
          {
            contentDocument: params.contentDocument,
            marketplaceId,
          },
          "a-plus-content"
        );
        return response.data;
      },
    },
    {
      name: "spapi_aplus_submit_content_for_approval",
      description:
        "Submit an A+ Content document for approval. Rate limit: 10 requests/sec. NOTE: Write operation.",
      scope: "shared",
      apiDomain: "a-plus-content",
      inputSchema: {
        contentReferenceKey: z.string().describe("Content reference key to submit"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/aplus/2020-11-01/contentDocuments/${params.contentReferenceKey}/approvalSubmissions`,
          { marketplaceId },
          "a-plus-content"
        );
        return response.data;
      },
    },
  ];
}
