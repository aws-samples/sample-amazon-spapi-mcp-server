import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { ServerConfig } from "../../config/schema.js";

export function createServicesTools(client: SpApiClient, config: ServerConfig): ToolDefinition[] {
  const marketplaceIds = config.marketplace.marketplace_ids;

  return [
    {
      name: "spapi_services_get_service_jobs",
      description:
        "Get a list of service jobs (e.g., device installation, home services) with optional filters. Rate limit: 20 requests/sec.",
      scope: "seller",
      apiDomain: "services",
      inputSchema: {
        serviceOrderIds: z.array(z.string()).optional().describe("Filter by service order IDs"),
        serviceJobStatus: z.array(z.enum([
          "NOT_SERVICED", "CANCELLED", "COMPLETED", "PENDING_SCHEDULE",
          "NOT_FULFILLABLE", "HOLD", "PAYMENT_DECLINED",
        ])).optional().describe("Filter by status"),
        createdAfter: z.string().optional().describe("ISO 8601 date"),
        createdBefore: z.string().optional().describe("ISO 8601 date"),
        pageSize: z.number().optional().describe("Results per page"),
        nextToken: z.string().optional(),
      },
      handler: async (params) => {
        const response = await client.get(
          "/service/v1/serviceJobs",
          {
            marketplaceIds: marketplaceIds.join(","),
            serviceOrderIds: (params.serviceOrderIds as string[])?.join(","),
            serviceJobStatus: (params.serviceJobStatus as string[])?.join(","),
            createdAfter: params.createdAfter,
            createdBefore: params.createdBefore,
            pageSize: params.pageSize,
            pageToken: params.nextToken,
          },
          "services"
        );
        return response.data;
      },
    },
    {
      name: "spapi_services_get_service_job_by_id",
      description:
        "Get details for a specific service job by ID. Rate limit: 20 requests/sec.",
      scope: "seller",
      apiDomain: "services",
      inputSchema: {
        serviceJobId: z.string().describe("Service job ID"),
      },
      handler: async (params) => {
        const response = await client.get(
          `/service/v1/serviceJobs/${params.serviceJobId}`,
          {},
          "services"
        );
        return response.data;
      },
    },
    {
      name: "spapi_services_cancel_service_job_by_id",
      description:
        "Cancel a service job. DESTRUCTIVE. Rate limit: 5 requests/sec.",
      scope: "seller",
      apiDomain: "services",
      inputSchema: {
        serviceJobId: z.string().describe("Service job ID to cancel"),
        cancellationReasonCode: z.string().describe("Cancellation reason code"),
      },
      handler: async (params) => {
        const response = await client.put(
          `/service/v1/serviceJobs/${params.serviceJobId}/cancellations`,
          { cancellationReasonCode: params.cancellationReasonCode },
          "services"
        );
        return response.data;
      },
    },
  ];
}
