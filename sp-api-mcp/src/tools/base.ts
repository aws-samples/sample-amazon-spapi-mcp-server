import { z, ZodRawShape } from "zod";
import { AccountType } from "../config/schema.js";

export type ToolScope = "seller" | "vendor" | "shared";

export interface ToolDefinition {
  /** MCP tool name (e.g. spapi_orders_get_orders) */
  name: string;
  /** Human-readable description for the AI agent */
  description: string;
  /** Which account types can use this tool */
  scope: ToolScope;
  /** API domain for rate limiting (e.g. "orders", "catalog") */
  apiDomain: string;
  /** Zod schema for input parameters */
  inputSchema: ZodRawShape;
  /** The handler function */
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Determines if a tool should be exposed based on account type and tool scope.
 */
export function isToolVisible(toolScope: ToolScope, accountType: AccountType): boolean {
  switch (accountType) {
    case "both":
      return true;
    case "seller":
      return toolScope === "seller" || toolScope === "shared";
    case "vendor":
      return toolScope === "vendor" || toolScope === "shared";
  }
}

/**
 * Converts a Zod schema shape to a JSON Schema object for MCP tool registration.
 */
export function zodShapeToJsonSchema(shape: ZodRawShape): Record<string, unknown> {
  const schema = z.object(shape);
  return zodToJsonSchema(schema);
}

function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // Simple recursive JSON schema generator for common Zod types
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value as z.ZodTypeAny);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  if (schema instanceof z.ZodString) {
    return { type: "string", description: schema.description };
  }

  if (schema instanceof z.ZodNumber) {
    return { type: "number", description: schema.description };
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean", description: schema.description };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(schema.element),
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: schema.options,
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(schema.unwrap());
  }

  if (schema instanceof z.ZodDefault) {
    const inner = zodToJsonSchema(schema.removeDefault());
    return { ...inner, default: schema._def.defaultValue() };
  }

  return { type: "string" };
}
