import { z } from "zod";

export const AccountType = z.enum(["seller", "vendor", "both"]);
export type AccountType = z.infer<typeof AccountType>;

export const MarketplaceRegion = z.enum(["NA", "EU", "FE"]);
export type MarketplaceRegion = z.infer<typeof MarketplaceRegion>;

export const MarketplaceConfig = z.object({
  region: MarketplaceRegion,
  marketplace_ids: z.array(z.string()).min(1),
  endpoint: z.string().url(),
});
export type MarketplaceConfig = z.infer<typeof MarketplaceConfig>;

export const CredentialsConfig = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  refresh_token: z.string(),
  aws_access_key: z.string().optional(),
  aws_secret_key: z.string().optional(),
  role_arn: z.string().optional(),
});
export type CredentialsConfig = z.infer<typeof CredentialsConfig>;

export const OptionsConfig = z.object({
  sandbox_mode: z.boolean().default(false),
  auto_paginate: z.boolean().default(true),
  max_page_results: z.number().int().positive().default(100),
  max_total_results: z.number().int().positive().default(1000),
  report_polling_interval_seconds: z.number().positive().default(15),
  report_polling_timeout_seconds: z.number().positive().default(300),
  enable_rdt_for_pii: z.boolean().default(true),
  log_level: z.enum(["debug", "info", "warn", "error"]).default("info"),
});
export type OptionsConfig = z.infer<typeof OptionsConfig>;

export const ServerConfig = z.object({
  server_name: z.string().default("sp-api-mcp"),
  version: z.string().default("1.0.0"),
  account_type: AccountType,
  marketplace: MarketplaceConfig,
  credentials: CredentialsConfig,
  options: OptionsConfig.partial().default({}),
  enabled_api_groups: z.array(z.string()).optional(),
});
export type ServerConfig = z.infer<typeof ServerConfig>;

/** SP-API endpoint URLs by region */
export const REGION_ENDPOINTS: Record<MarketplaceRegion, string> = {
  NA: "https://sellingpartnerapi-na.amazon.com",
  EU: "https://sellingpartnerapi-eu.amazon.com",
  FE: "https://sellingpartnerapi-fe.amazon.com",
};

/** Sandbox endpoint URLs by region */
export const SANDBOX_ENDPOINTS: Record<MarketplaceRegion, string> = {
  NA: "https://sandbox.sellingpartnerapi-na.amazon.com",
  EU: "https://sandbox.sellingpartnerapi-eu.amazon.com",
  FE: "https://sandbox.sellingpartnerapi-fe.amazon.com",
};

/** LWA token endpoint */
export const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
