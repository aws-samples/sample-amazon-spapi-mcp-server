#!/usr/bin/env node

import { parseArgs } from "node:util";
import { loadConfig } from "./config/index.js";
import { LocalCredentialProvider } from "./auth/index.js";
import { SpApiClient } from "./clients/index.js";
import { MockSpApiClient } from "./clients/index.js";
import { MockCredentialProvider } from "./auth/index.js";
import { ToolRegistry } from "./tools/registry.js";
import { startStdioServer } from "./transport/index.js";
import { setLogLevel, createLogger } from "./utils/logger.js";

// Meta tool factories
import { createHealthCheckTool, createGetConfigTool, createRateLimitStatusTool } from "./tools/meta/index.js";

// Seller tool factories
import {
  createOrdersTools,
  createFbaInventoryTools,
  createPricingTools,
  createFinancesTools,
  createSalesTools,
  createShippingTools,
  createFulfillmentInboundTools,
  createFulfillmentOutboundTools,
  createMerchantFulfillmentTools,
  createEasyShipTools,
  createMessagingTools,
  createSolicitationsTools,
  createProductFeesTools,
  createSellersTools,
  createServicesTools,
  createAwdTools,
  createSellerWalletTools,
  createTransfersTools,
  createVehiclesTools,
  createExternalFulfillmentTools,
  createFbaInboundEligibilityTools,
  createSupplySourcesTools,
  createAppIntegrationsTools,
} from "./tools/seller/index.js";

// Shared tool factories
import {
  createCatalogTools,
  createReportsTools,
  createFeedsTools,
  createListingsTools,
  createNotificationsTools,
  createDataKioskTools,
  createAPlusContentTools,
  createProductTypeDefinitionsTools,
  createTokensTools,
  createUploadsTools,
  createReplenishmentTools,
  createCustomerFeedbackTools,
  createApplicationManagementTools,
  createListingsRestrictionsTools,
} from "./tools/shared/index.js";

// Vendor tool factories
import {
  createVendorOrdersTools,
  createVendorShipmentsTools,
  createVendorInvoicesTools,
  createVendorDFOrdersTools,
  createVendorDFShippingTools,
  createVendorDFInventoryTools,
  createVendorDFPaymentsTools,
  createVendorTransactionStatusTools,
} from "./tools/vendor/index.js";

const logger = createLogger("main");

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      config: { type: "string", short: "c", default: "./config.json" },
      mode: { type: "string", short: "m", default: "local" },
      mock: { type: "boolean", default: false },
    },
  });

  // Load configuration
  const config = loadConfig(values.config!);
  setLogLevel(config.options.log_level ?? "info");

  logger.info(`Starting SP-API MCP Server v${config.version}`);
  logger.info(`Account type: ${config.account_type}`);
  logger.info(`Marketplace: ${config.marketplace.region} (${config.marketplace.marketplace_ids.join(", ")})`);
  logger.info(`Mode: ${values.mode}`);
  logger.info(`Sandbox: ${config.options.sandbox_mode}`);
  logger.info(`Mock: ${values.mock}`);

  // Initialize auth & client
  let credentialProvider;
  let apiClient;

  if (values.mock) {
    // Guard: prevent mock mode from accidentally running in production
    const nodeEnv = process.env.NODE_ENV || "";
    if (nodeEnv === "production") {
      logger.error("SECURITY: Mock mode cannot be enabled in NODE_ENV=production");
      process.exit(1);
    }
    logger.warn("⚠️  MOCK MODE — using fake data, no real API calls will be made");
    credentialProvider = new MockCredentialProvider();
    apiClient = new MockSpApiClient(config, credentialProvider);
  } else {
    credentialProvider = new LocalCredentialProvider(
      config.credentials,
      config.marketplace.endpoint
    );
    apiClient = new SpApiClient(config, credentialProvider);
  }

  // Initialize tool registry
  const registry = new ToolRegistry(config.account_type);

  // ─── Meta Tools ────────────────────────────────────────────────────────────
  registry.register(createHealthCheckTool(credentialProvider, apiClient));
  registry.register(createGetConfigTool(config, registry));
  registry.register(createRateLimitStatusTool(apiClient));

  // ─── Seller Tools ──────────────────────────────────────────────────────────
  registry.registerAll(createOrdersTools(apiClient, config));
  registry.registerAll(createFbaInventoryTools(apiClient, config));
  registry.registerAll(createPricingTools(apiClient, config));
  registry.registerAll(createFinancesTools(apiClient, config));
  registry.registerAll(createSalesTools(apiClient, config));
  registry.registerAll(createShippingTools(apiClient));
  registry.registerAll(createFulfillmentInboundTools(apiClient));
  registry.registerAll(createFulfillmentOutboundTools(apiClient));
  registry.registerAll(createMerchantFulfillmentTools(apiClient));
  registry.registerAll(createEasyShipTools(apiClient, config));
  registry.registerAll(createMessagingTools(apiClient, config));
  registry.registerAll(createSolicitationsTools(apiClient, config));
  registry.registerAll(createProductFeesTools(apiClient));
  registry.registerAll(createSellersTools(apiClient));
  registry.registerAll(createServicesTools(apiClient, config));
  registry.registerAll(createAwdTools(apiClient));
  registry.registerAll(createSellerWalletTools(apiClient));
  registry.registerAll(createTransfersTools(apiClient));
  registry.registerAll(createVehiclesTools(apiClient));
  registry.registerAll(createExternalFulfillmentTools(apiClient));
  registry.registerAll(createFbaInboundEligibilityTools(apiClient, config));
  registry.registerAll(createSupplySourcesTools(apiClient));
  registry.registerAll(createAppIntegrationsTools(apiClient));

  // ─── Shared Tools ──────────────────────────────────────────────────────────
  registry.registerAll(createCatalogTools(apiClient, config));
  registry.registerAll(createReportsTools(apiClient, config));
  registry.registerAll(createFeedsTools(apiClient, config));
  registry.registerAll(createListingsTools(apiClient, config));
  registry.registerAll(createNotificationsTools(apiClient));
  registry.registerAll(createDataKioskTools(apiClient, config));
  registry.registerAll(createAPlusContentTools(apiClient, config));
  registry.registerAll(createProductTypeDefinitionsTools(apiClient, config));
  registry.registerAll(createTokensTools(apiClient));
  registry.registerAll(createUploadsTools(apiClient, config));
  registry.registerAll(createReplenishmentTools(apiClient, config));
  registry.registerAll(createCustomerFeedbackTools(apiClient, config));
  registry.registerAll(createApplicationManagementTools(apiClient));
  registry.registerAll(createListingsRestrictionsTools(apiClient, config));

  // ─── Vendor Tools ──────────────────────────────────────────────────────────
  registry.registerAll(createVendorOrdersTools(apiClient));
  registry.registerAll(createVendorShipmentsTools(apiClient));
  registry.registerAll(createVendorInvoicesTools(apiClient));
  registry.registerAll(createVendorDFOrdersTools(apiClient));
  registry.registerAll(createVendorDFShippingTools(apiClient));
  registry.registerAll(createVendorDFInventoryTools(apiClient));
  registry.registerAll(createVendorDFPaymentsTools(apiClient));
  registry.registerAll(createVendorTransactionStatusTools(apiClient));

  logger.info(
    `Registered ${registry.getTotalCount()} total tools, ${registry.getVisibleCount()} visible for account type '${config.account_type}'`
  );

  // Start server based on mode
  if (values.mode === "local" || values.mode === "stdio") {
    await startStdioServer(registry, config.server_name, config.version);
  } else {
    logger.error(`Unknown mode: ${values.mode}. Supported: local, stdio`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
