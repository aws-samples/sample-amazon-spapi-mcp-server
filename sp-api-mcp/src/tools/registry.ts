import { AccountType } from "../config/schema.js";
import { ToolDefinition, isToolVisible, zodShapeToJsonSchema } from "./base.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("tool-registry");

/**
 * Registry that manages all SP-API MCP tools and filters them based on account type.
 */
export class ToolRegistry {
  private readonly tools: Map<string, ToolDefinition> = new Map();
  private readonly accountType: AccountType;

  constructor(accountType: AccountType) {
    this.accountType = accountType;
  }

  /** Register a single tool */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} already registered, overwriting`);
    }
    this.tools.set(tool.name, tool);
  }

  /** Register multiple tools */
  registerAll(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /** Get all tools visible to the current account type */
  getVisibleTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).filter((tool) =>
      isToolVisible(tool.scope, this.accountType)
    );
  }

  /** Get tool definitions formatted for MCP tools/list response */
  getMcpToolList(): Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> {
    return this.getVisibleTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodShapeToJsonSchema(tool.inputSchema),
    }));
  }

  /** Look up a specific tool by name (only if visible) */
  getTool(name: string): ToolDefinition | undefined {
    const tool = this.tools.get(name);
    if (!tool) return undefined;
    if (!isToolVisible(tool.scope, this.accountType)) return undefined;
    return tool;
  }

  /** Get count of visible tools */
  getVisibleCount(): number {
    return this.getVisibleTools().length;
  }

  /** Get count of all registered tools */
  getTotalCount(): number {
    return this.tools.size;
  }

  /** Get tool counts grouped by scope */
  getCountsByScope(): Record<string, number> {
    const counts: Record<string, number> = { seller: 0, vendor: 0, shared: 0 };
    for (const tool of this.getVisibleTools()) {
      counts[tool.scope]++;
    }
    return counts;
  }
}
