import { z } from "zod";
import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";
import { requireConfirmation } from "../../utils/destructive-guard.js";

export function createApplicationManagementTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_application_rotate_client_secret",
      description:
        "⚠️ DESTRUCTIVE: Credential rotation — Rotates the client secret for an SP-API application. This permanently invalidates the current secret after a short grace period. All systems using the old secret will lose access. Requires confirm: true to execute. Rate limit: 0.0167 requests/sec.",
      scope: "shared",
      apiDomain: "application-management",
      inputSchema: {
        confirm: z.boolean().describe("Must be true to execute this destructive operation"),
      },
      handler: async (params) => {
        const guard = requireConfirmation(
          params,
          "spapi_application_rotate_client_secret",
          "Rotating client secret will permanently invalidate the current secret. All systems using it will lose access until updated."
        );
        if (!guard.allowed) return guard.error;

        const response = await client.post(
          "/applications/2023-11-30/clientSecret",
          {},
          "application-management"
        );
        return response.data;
      },
    },
  ];
}
