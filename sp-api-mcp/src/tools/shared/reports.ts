import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("reports");

export function createReportsTools(
  client: SpApiClient,
  config: ServerConfig
): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;
  const pollingInterval = (config.options.report_polling_interval_seconds ?? 15) * 1000;
  const pollingTimeout = (config.options.report_polling_timeout_seconds ?? 300) * 1000;

  return [
    {
      name: "spapi_reports_create_report",
      description:
        "Request a new report. This is an async operation — use spapi_reports_get_report to check status, or use spapi_reports_get_report_document_auto which handles polling automatically. Common report types: GET_FLAT_FILE_OPEN_LISTINGS_DATA, GET_MERCHANT_LISTINGS_ALL_DATA, GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA, GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL. Rate limit: 0.0167 requests/sec.",
      scope: "shared",
      apiDomain: "reports",
      inputSchema: {
        reportType: z.string().describe("The report type ID (e.g. GET_FLAT_FILE_OPEN_LISTINGS_DATA)"),
        dataStartTime: z.string().optional().describe("ISO 8601 start date for report data"),
        dataEndTime: z.string().optional().describe("ISO 8601 end date for report data"),
        reportOptions: z.record(z.string()).optional().describe("Report-specific options as key-value pairs"),
      },
      handler: async (params) => {
        const response = await client.post(
          "/reports/2021-06-30/reports",
          {
            reportType: params.reportType,
            marketplaceIds,
            dataStartTime: params.dataStartTime,
            dataEndTime: params.dataEndTime,
            reportOptions: params.reportOptions,
          },
          "reports"
        );
        return response.data;
      },
    },
    {
      name: "spapi_reports_get_report",
      description:
        "Get the status and details of a previously requested report. Returns processing status and report document ID when complete. Rate limit: 2 requests/sec (burst of 15).",
      scope: "shared",
      apiDomain: "reports",
      inputSchema: {
        reportId: z.string().describe("The report ID returned by create_report"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/reports/2021-06-30/reports/${params.reportId}`,
          {},
          "reports"
        );
        return response.data;
      },
    },
    {
      name: "spapi_reports_get_report_document",
      description:
        "Get a pre-signed URL to download a completed report document. Use after the report status is DONE. Rate limit: 0.0167 requests/sec.",
      scope: "shared",
      apiDomain: "reports",
      inputSchema: {
        reportDocumentId: z.string().describe("The report document ID from a completed report"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/reports/2021-06-30/documents/${params.reportDocumentId}`,
          {},
          "reports"
        );
        return response.data;
      },
    },
    {
      name: "spapi_reports_create_and_download",
      description:
        "Composite tool: Creates a report, polls until completion, and returns the download URL. Handles the full async lifecycle automatically. Timeout: 5 minutes. Rate limit: follows individual API limits.",
      scope: "shared",
      apiDomain: "reports",
      inputSchema: {
        reportType: z.string().describe("The report type ID"),
        dataStartTime: z.string().optional().describe("ISO 8601 start date"),
        dataEndTime: z.string().optional().describe("ISO 8601 end date"),
        reportOptions: z.record(z.string()).optional().describe("Report-specific options"),
      },
      handler: async (params) => {
        // Step 1: Create the report
        const createResponse = await client.post(
          "/reports/2021-06-30/reports",
          {
            reportType: params.reportType,
            marketplaceIds,
            dataStartTime: params.dataStartTime,
            dataEndTime: params.dataEndTime,
            reportOptions: params.reportOptions,
          },
          "reports"
        );
        const reportId = (createResponse.data as { reportId: string }).reportId;
        logger.info(`Report created: ${reportId}, polling for completion...`);

        // Step 2: Poll until done
        const startTime = Date.now();
        let reportData: Record<string, unknown>;

        while (true) {
          if (Date.now() - startTime > pollingTimeout) {
            return {
              status: "TIMEOUT",
              reportId,
              message: `Report polling timed out after ${pollingTimeout / 1000}s. Use spapi_reports_get_report to check status manually.`,
            };
          }

          await sleep(pollingInterval);

          const statusResponse = await client.get<Record<string, unknown>>(
            `/reports/2021-06-30/reports/${reportId}`,
            {},
            "reports"
          );
          reportData = statusResponse.data;
          const status = reportData.processingStatus as string;

          if (status === "DONE") break;
          if (status === "CANCELLED" || status === "FATAL") {
            return {
              status,
              reportId,
              message: `Report processing ended with status: ${status}`,
            };
          }

          logger.info(`Report ${reportId} status: ${status}, waiting...`);
        }

        // Step 3: Get the document URL
        const docId = reportData!.reportDocumentId as string;
        const docResponse = await client.get(
          `/reports/2021-06-30/documents/${docId}`,
          {},
          "reports"
        );

        return {
          status: "DONE",
          reportId,
          reportDocumentId: docId,
          document: docResponse.data,
        };
      },
    },
    {
      name: "spapi_reports_get_reports",
      description:
        "Get a list of reports matching filters (type, status, date range). Useful for finding previously generated reports. Rate limit: 0.0222 requests/sec (burst of 10).",
      scope: "shared",
      apiDomain: "reports",
      inputSchema: {
        reportTypes: z.array(z.string()).optional().describe("Filter by report type IDs"),
        processingStatuses: z.array(z.enum(["CANCELLED", "DONE", "FATAL", "IN_PROGRESS", "IN_QUEUE"])).optional().describe("Filter by status"),
        createdSince: z.string().optional().describe("ISO 8601 date. Reports created after."),
        createdUntil: z.string().optional().describe("ISO 8601 date. Reports created before."),
        pageSize: z.number().optional().describe("Results per page (1-100, default 10)"),
        nextToken: z.string().optional().describe("Pagination token"),
      },
      handler: async (params) => {
        const response = await client.get(
          "/reports/2021-06-30/reports",
          {
            reportTypes: (params.reportTypes as string[])?.join(","),
            processingStatuses: (params.processingStatuses as string[])?.join(","),
            marketplaceIds: marketplaceIds.join(","),
            createdSince: params.createdSince,
            createdUntil: params.createdUntil,
            pageSize: params.pageSize,
            nextToken: params.nextToken,
          },
          "reports"
        );
        return response.data;
      },
    },
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
