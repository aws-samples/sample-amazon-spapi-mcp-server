import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createNotificationsTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_notifications_get_subscriptions",
      description:
        "Get all notification subscriptions for a given notification type. Rate limit: 1 request/sec (burst of 5).",
      scope: "shared",
      apiDomain: "notifications",
      inputSchema: {
        notificationType: z
          .string()
          .describe(
            "Notification type (e.g. ANY_OFFER_CHANGED, FEED_PROCESSING_FINISHED, REPORT_PROCESSING_FINISHED, ORDER_STATUS_CHANGE)"
          ),
      },
      handler: async (params) => {
        const response = await client.get(
          `/notifications/v1/subscriptions/${params.notificationType}`,
          {},
          "notifications"
        );
        return response.data;
      },
    },
    {
      name: "spapi_notifications_create_subscription",
      description:
        "Create a notification subscription for event notifications. Requires a destination (SQS queue or EventBridge). Rate limit: 1 request/sec (burst of 5).",
      scope: "shared",
      apiDomain: "notifications",
      inputSchema: {
        notificationType: z.string().describe("Notification type to subscribe to"),
        destinationId: z.string().describe("Destination ID (from create_destination)"),
        payloadVersion: z.string().optional().describe("Payload version (default: 1.0)"),
      },
      handler: async (params) => {
        const response = await client.post(
          `/notifications/v1/subscriptions/${params.notificationType}`,
          {
            destinationId: params.destinationId,
            payloadVersion: params.payloadVersion || "1.0",
          },
          "notifications"
        );
        return response.data;
      },
    },
    {
      name: "spapi_notifications_get_destinations",
      description:
        "Get all notification destinations (SQS queues, EventBridge event buses) configured for the application. Rate limit: 1 request/sec (burst of 5).",
      scope: "shared",
      apiDomain: "notifications",
      inputSchema: {},
      handler: async () => {
        const response = await client.get(
          "/notifications/v1/destinations",
          {},
          "notifications"
        );
        return response.data;
      },
    },
    {
      name: "spapi_notifications_create_destination",
      description:
        "Create a notification destination (SQS queue or EventBridge). This is step 1 before creating subscriptions. Rate limit: 1 request/sec (burst of 5).",
      scope: "shared",
      apiDomain: "notifications",
      inputSchema: {
        name: z.string().describe("Name for the destination"),
        sqsArn: z
          .string()
          .optional()
          .describe("SQS queue ARN (provide this OR eventBridge, not both)"),
        eventBridgeRegion: z
          .string()
          .optional()
          .describe("EventBridge region (provide this OR sqsArn)"),
        eventBridgeAccountId: z
          .string()
          .optional()
          .describe("AWS account ID for EventBridge"),
      },
      handler: async (params) => {
        let resourceSpecification: Record<string, unknown>;
        if (params.sqsArn) {
          resourceSpecification = { sqs: { arn: params.sqsArn } };
        } else if (params.eventBridgeRegion) {
          resourceSpecification = {
            eventBridge: {
              region: params.eventBridgeRegion,
              accountId: params.eventBridgeAccountId,
            },
          };
        } else {
          throw new Error("Either sqsArn or eventBridgeRegion must be provided");
        }

        const response = await client.post(
          "/notifications/v1/destinations",
          {
            name: params.name,
            resourceSpecification,
          },
          "notifications"
        );
        return response.data;
      },
    },
  ];
}
