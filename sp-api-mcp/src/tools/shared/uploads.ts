import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createUploadsTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_uploads_create_upload_destination",
      description:
        "Create an upload destination (pre-signed URL) for uploading files used by other API operations (e.g., feed documents, message attachments). Rate limit: 10 requests/sec.",
      scope: "shared",
      apiDomain: "uploads",
      inputSchema: {
        resource: z.string().describe("Resource path requiring the upload (e.g., /messaging/v1/orders/{orderId}/messages)"),
        contentType: z.string().describe("MIME type of the file to upload (e.g., application/pdf)"),
        contentMD5: z.string().optional().describe("MD5 hash of the content (for integrity check)"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/uploads/2020-11-01/uploadDestinations",
          {
            marketplaceIds,
            contentType: params.contentType,
            contentMD5: params.contentMD5,
            resource: params.resource,
          },
          "uploads"
        );
        return response.data;
      },
    },
  ];
}
