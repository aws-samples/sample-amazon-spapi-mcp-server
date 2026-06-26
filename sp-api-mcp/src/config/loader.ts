import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ServerConfig } from "./schema.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("config");

/**
 * Loads and validates the server configuration from a JSON file.
 * Supports $KEYCHAIN: prefixed values (resolved at auth layer).
 */
export function loadConfig(configPath: string): ServerConfig {
  const absolutePath = resolve(configPath);
  logger.info(`Loading configuration from: ${absolutePath}`);

  let raw: string;
  try {
    raw = readFileSync(absolutePath, "utf-8");
  } catch (err) {
    throw new Error(
      `Failed to read config file at ${absolutePath}: ${(err as Error).message}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid JSON in config file: ${(err as Error).message}`
    );
  }

  const result = ServerConfig.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  logger.info(
    `Configuration loaded: account_type=${result.data.account_type}, region=${result.data.marketplace.region}`
  );
  return result.data;
}
