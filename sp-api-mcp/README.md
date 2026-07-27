# SP-API MCP Server

> **⚠️ Disclaimer:** This is a prototype/proof-of-concept and is NOT a production-level application. It is intended for local development, testing, and demonstration purposes only. Do not deploy to production environments without additional security hardening, comprehensive testing, and a full security review.

A Model Context Protocol (MCP) server that provides unified access to all Amazon Selling Partner APIs (SP-APIs). Connect any MCP-compatible AI agent to Seller Central and Vendor Central data through natural language.

## Features

- **Dual-mode operation** — Seller, Vendor, or Both account types with dynamic tool filtering
- **Full SP-API coverage** — Orders, Catalog, Pricing, Inventory, Reports, Feeds, Listings, Notifications, Vendor Orders/Shipments/Invoices, and more
- **Composite tools** — Automatic report polling, feed submission workflows
- **Rate limiting** — Built-in per-API rate limiting with queue-before-fail strategy
- **Auto-pagination** — Fetches all pages with configurable safety caps
- **Error handling** — Structured errors with categories and suggested actions
- **Retry logic** — Exponential backoff for transient failures (429, 5xx)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure

```bash
cp config.example.json config.json
# Edit config.json with your SP-API credentials
```

### 3. Build

```bash
npm run build
```

### 4. Run

```bash
# Local stdio mode (for Amazon Quick / Claude Desktop)
node dist/index.js --config ./config.json --mode local
```

### 5. Register with Amazon Quick

Settings → Capabilities → MCP → Add MCP / Skill:

- **Name:** SP-API MCP Server
- **Transport:** stdio
- **Command:** `node`
- **Args:** `["/path/to/sp-api-mcp/dist/index.js", "--config", "/path/to/config.json", "--mode", "local"]`

## Configuration

| Field | Description |
|-------|-------------|
| `account_type` | `seller`, `vendor`, or `both` — controls which tools are exposed |
| `marketplace.region` | `NA`, `EU`, or `FE` |
| `marketplace.marketplace_ids` | Array of marketplace IDs (e.g., `["ATVPDKIKX0DER"]` for US) |
| `credentials.client_id` | SP-API application client ID |
| `credentials.client_secret` | SP-API application client secret |
| `credentials.refresh_token` | LWA refresh token for the selling partner |
| `options.sandbox_mode` | `true` for sandbox testing |
| `options.auto_paginate` | `true` to auto-fetch all pages |
| `options.max_total_results` | Safety cap for pagination (default: 1000) |

## Tool Naming Convention

```
spapi_{domain}_{operation}
```

Examples:
- `spapi_orders_get_orders` — Get seller orders
- `spapi_catalog_search_items` — Search the catalog
- `spapi_vendor_orders_get_purchase_orders` — Get vendor POs
- `spapi_reports_create_and_download` — Full report lifecycle

## Available Tools (by account type)

### Seller + Shared (~30 tools in current build)
- Orders (get_orders, get_order, get_order_items, get_order_address, get_order_buyer_info)
- FBA Inventory (get_summaries)
- Pricing (get_competitive_pricing, get_listing_offers, get_item_offers)
- Finances (list_transactions)
- Sales (get_order_metrics)
- Catalog (search_items, get_item)
- Reports (create_report, get_report, get_report_document, create_and_download, get_reports)
- Feeds (create_feed_document, create_feed, get_feed, get_feed_document)
- Listings (get/put/patch/delete listings_item)
- Notifications (get/create subscriptions, get/create destinations)
- Meta (health_check, get_config, rate_limit_status)

### Vendor-Only (~6 tools in current build)
- Vendor Orders (get_purchase_orders, get_purchase_order, submit_acknowledgement)
- Vendor Shipments (submit_shipments)
- Vendor Invoices (submit_invoices)

## Development

```bash
# Run in development mode (tsx, no build step)
npm run dev -- --config ./config.example.json

# Run tests
npm test

# Lint
npm run lint
```

## Architecture

```
src/
├── index.ts              ← Entry point
├── config/               ← Configuration loading & validation
├── auth/                 ← LWA OAuth2 token management
├── clients/              ← SP-API HTTP client with rate limiting
├── tools/                ← MCP tool definitions
│   ├── meta/             ← Health check, config, rate limits
│   ├── seller/           ← Seller-only API tools
│   ├── shared/           ← Shared API tools (Seller + Vendor)
│   └── vendor/           ← Vendor-only API tools
├── transport/            ← MCP transport layer (stdio, SSE future)
└── utils/                ← Logger, helpers
```

## License

MIT
