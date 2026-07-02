import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("data-kiosk");

export function createDataKioskTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const pollingInterval = (config.options.report_polling_interval_seconds ?? 15) * 1000;
  const pollingTimeout = (config.options.report_polling_timeout_seconds ?? 300) * 1000;

  return [
    {
      name: "spapi_data_kiosk_create_query",
      description:
        "Submit a GraphQL analytics query to the SP-API Data Kiosk service (no local file system access). Supports sales, traffic, inventory, and brand analytics. This is a remote API call that queues a query on Amazon's servers — async operation, use get_query to check status. Rate limit: 0.0222 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "data-kiosk",
      inputSchema: {
        query: z.string().describe("GraphQL query string (see SP-API Data Kiosk schema docs)"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/dataKiosk/2023-11-15/queries",
          { query: params.query },
          "data-kiosk"
        );
        return response.data;
      },
    },
    {
      name: "spapi_data_kiosk_get_query",
      description:
        "Get status and result of a Data Kiosk query. Returns document ID when complete. Rate limit: 2 requests/sec.",
      scope: "shared",
      apiDomain: "data-kiosk",
      inputSchema: {
        queryId: z.string().describe("Query ID from create_query"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/dataKiosk/2023-11-15/queries/${params.queryId}`,
          {},
          "data-kiosk"
        );
        return response.data;
      },
    },
    {
      name: "spapi_data_kiosk_get_queries",
      description:
        "List Data Kiosk queries with optional status/date filters. Rate limit: 0.0222 requests/sec.",
      scope: "shared",
      apiDomain: "data-kiosk",
      inputSchema: {
        processingStatuses: z.array(z.enum(["CANCELLED", "DONE", "FATAL", "IN_PROGRESS", "IN_QUEUE"])).optional(),
        createdSince: z.string().optional().describe("ISO 8601 date"),
        createdUntil: z.string().optional().describe("ISO 8601 date"),
        pageSize: z.number().optional(),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/dataKiosk/2023-11-15/queries",
          {
            processingStatuses: (params.processingStatuses as string[])?.join(","),
            createdSince: params.createdSince,
            createdUntil: params.createdUntil,
            pageSize: params.pageSize,
            paginationToken: params.nextToken,
          },
          "data-kiosk"
        );
        return response.data;
      },
    },
    {
      name: "spapi_data_kiosk_get_document",
      description:
        "Get a pre-signed URL to download Data Kiosk query results. Rate limit: 0.0167 requests/sec.",
      scope: "shared",
      apiDomain: "data-kiosk",
      inputSchema: {
        documentId: z.string().describe("Document ID from a completed query"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/dataKiosk/2023-11-15/documents/${params.documentId}`,
          {},
          "data-kiosk"
        );
        return response.data;
      },
    },
    {
      name: "spapi_data_kiosk_create_query_and_download",
      description:
        "Composite tool: Submit a GraphQL analytics query to SP-API Data Kiosk, poll until completion, and return the result document URL (no local file system access — all operations are remote API calls). Timeout: 5 minutes.",
      scope: "shared",
      apiDomain: "data-kiosk",
      inputSchema: {
        query: z.string().describe("GraphQL query string"),
      },
      handler: async (params) => {
        // Create query
        const createResponse = await client.post(
          "/dataKiosk/2023-11-15/queries",
          { query: params.query },
          "data-kiosk"
        );
        const queryId = (createResponse.data as { queryId: string }).queryId;
        logger.info(`Data Kiosk query created: ${queryId}`);

        // Poll
        const startTime = Date.now();
        let queryData: Record<string, unknown>;

        while (true) {
          if (Date.now() - startTime > pollingTimeout) {
            return {
              status: "TIMEOUT",
              queryId,
              message: `Query polling timed out after ${pollingTimeout / 1000}s.`,
            };
          }

          await new Promise((r) => setTimeout(r, pollingInterval));

          const statusResponse = await client.get<Record<string, unknown>>(
            `/dataKiosk/2023-11-15/queries/${queryId}`,
            {},
            "data-kiosk"
          );
          queryData = statusResponse.data;
          const status = queryData.processingStatus as string;

          if (status === "DONE") break;
          if (status === "CANCELLED" || status === "FATAL") {
            return { status, queryId, message: `Query ended with status: ${status}` };
          }
          logger.info(`Query ${queryId} status: ${status}`);
        }

        // Get document
        const docId = queryData!.dataDocumentId as string;
        if (!docId) {
          return { status: "DONE", queryId, message: "Query completed but no data document available (empty results)." };
        }

        const docResponse = await client.get(
          `/dataKiosk/2023-11-15/documents/${docId}`,
          {},
          "data-kiosk"
        );
        return { status: "DONE", queryId, documentId: docId, document: docResponse.data };
      },
    },
  ];
}
