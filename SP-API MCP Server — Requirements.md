# SP-API MCP Server — Full Requirements Document

## 1. Executive Summary

**Objective:** Build a Model Context Protocol (MCP) server that provides a unified interface to all Amazon Selling Partner APIs (SP-APIs), enabling Amazon Quick (or any MCP-compatible AI agent) to interact with Seller Central and Vendor Central data through natural language.

**Key Design Principle:** The MCP server supports **dual-mode operation** — users specify whether they are connecting as a **Seller** or **Vendor** (or both), and the server dynamically exposes only the relevant API tools for that account type.

---

## 2. Scope & API Coverage

### 2.1 Seller-Only APIs (29 APIs)

| API | Current Version | Description |
|-----|----------------|-------------|
| Amazon Warehousing & Distribution | v2024-05-09 | Inbound orders, inventory tracking in AWD DCs |
| App Integrations | v2024-04-01 | Send notifications to selling partners |
| Delivery by Amazon | v2021-12-28 | Shipment invoicing (Brazil only) |
| Easy Ship | v2022-03-23 | Schedule/manage Easy Ship packages |
| External Fulfillment Inventory | v2024-09-11 | Location-level inventory across channels |
| External Fulfillment Returns | v2024-09-11 | Return information retrieval |
| External Fulfillment Shipping | v2024-09-11 | Order retrieval and processing |
| FBA Inbound Eligibility | v1 | Item eligibility previews for FBA |
| FBA Inventory | v1 | Real-time FBA inventory availability |
| Finances | v2024-06-19 | Financial transactions and payments |
| Fulfillment Inbound | v2024-03-20 | Create/update inbound shipments |
| Fulfillment Outbound | v2020-07-01 | Multi-Channel Fulfillment (MCF) |
| Invoices | v2024-06-19 | Brazilian FBA invoice retrieval |
| Listings Restrictions | v2021-08-01 | Check listing restrictions |
| Merchant Fulfillment | v0 | Buy Shipping for MFN orders |
| Messaging | v1 | Send messages to buyers |
| Orders | v2026-01-01 | Order retrieval and management |
| Product Fees | v0 | Fee estimates for products |
| Product Pricing | v2022-05-01 | Pricing and competitive offer data |
| Sales | v1 | Aggregated order metrics |
| Seller Wallet | v2024-03-01 | Wallet account details and transfers |
| Sellers | v1 | Account and marketplace info |
| Services | v1 | Service orders and resources |
| Shipment Invoicing | v0 | FBA shipment invoices (Brazil) |
| Shipping | v2 | Rates, create/cancel/track shipments |
| Solicitations | v1 | Send review/feedback solicitations |
| Supply Sources | v2020-07-01 | Manage seller supply sources |
| Transfers | v2024-06-01 | Initiate payouts (EU marketplaces) |
| Vehicles | v2024-11-01 | Vehicle compatibility data |

### 2.2 Vendor-Only APIs (9 APIs)

| API | Current Version | Description |
|-----|----------------|-------------|
| Vendor Direct Fulfillment Inventory | v1 | Exchange inventory stock levels |
| Vendor Direct Fulfillment Orders | v2021-12-28 | Receive POs, send acknowledgments |
| Vendor Direct Fulfillment Payments | v1 | Exchange payment documents |
| Vendor Direct Fulfillment Sandbox | v2021-10-28 | Test data access |
| Vendor Direct Fulfillment Shipping | v2021-12-28 | Shipping data access |
| Vendor Direct Fulfillment Transaction Status | v2021-12-28 | Transaction status |
| Vendor Invoices | v1 | Vendor payment data |
| Vendor Orders | v1 | Vendor order/PO data |
| Vendor Shipments | v1 | Retail shipping data |
| Vendor Transaction Status | v1 | Async POST transaction status |

### 2.3 Shared APIs (Seller + Vendor) (13 APIs)

| API | Current Version | Description |
|-----|----------------|-------------|
| A+ Content Management | 2020-11-01 | Create/edit A+ content |
| Application Management | v2023-11-30 | Rotate client secrets |
| Catalog Items | v2022-04-01 | Catalog item details and search |
| Customer Feedback | 2024-06-01 | Review and return insights |
| Data Kiosk | v2023-11-15 | GraphQL queries for analytics |
| Feeds | v2021-06-30 | Upload data (listings, inventory, prices) |
| Listings Items | v2021-08-01 | Create/update/manage listings |
| Notifications | v1 | Subscribe to event notifications |
| Product Type Definitions | v2020-09-01 | Product attribute requirements |
| Replenishment | v2022-11-07 | Subscribe & Save metrics |
| Reports | v2021-06-30 | Retrieve reports (inventory, orders, etc.) |
| Tokens | v2021-03-01 | Restricted Data Tokens for PII |
| Uploads | v2020-11-01 | File uploads for other operations |

---

## 3. Architecture

### 3.1 High-Level Architecture

#### Phase 1: Local Deployment (Dev / PoC / Testing)

```
┌─────────────────────────────────────────────────────────────┐
│              User's Machine (Amazon Quick Desktop)            │
│                                                              │
│  ┌────────────┐     stdio      ┌────────────────────────┐   │
│  │ AI Agent   │ ◄────────────► │ SP-API MCP Server      │   │
│  │ (Claude)   │                │ (local subprocess)      │   │
│  └────────────┘                │  ├── Auth (local conf)  │   │
│                                │  ├── Tool Registry      │   │
│                                │  └── API Client         │   │
│                                └───────────┬─────────────┘   │
└────────────────────────────────────────────│─────────────────┘
                                             │ HTTPS
                                             ▼
                                  Amazon SP-API Endpoints
```

- MCP server runs as a **local subprocess** on the user's machine
- Amazon Quick spawns it via `stdio` transport
- Credentials stored in local config file or OS keychain
- Zero AWS infrastructure cost for the MCP server itself
- Best for: development, testing, demos, single-user scenarios

#### Phase 2: AWS-Hosted Deployment (Production / Multi-User / Enterprise)

```
┌──────────────────┐              ┌──────────────────────────────────┐
│  Amazon Quick    │              │        AWS Account                │
│  (User Machine)  │              │                                   │
│                  │───SSE/HTTP──►│  API Gateway (WebSocket/SSE)      │
│                  │              │       │                            │
└──────────────────┘              │       ▼                            │
                                  │  ECS Fargate / Lambda              │
                                  │  ┌─────────────────────────────┐  │
                                  │  │ SP-API MCP Server            │  │
                                  │  │  ├── Auth (Secrets Manager)  │  │
                                  │  │  ├── Tool Registry           │  │
                                  │  │  └── API Client              │  │
                                  │  └──────────────┬──────────────┘  │
                                  │                 │                  │
                                  │  CloudWatch ◄───┘  X-Ray          │
                                  └─────────────────│─────────────────┘
                                                    │ HTTPS
                                                    ▼
                                         Amazon SP-API Endpoints
```

- MCP server runs in **ECS Fargate** (long-lived) or **Lambda** (on-demand)
- Connects to Quick via **SSE (Server-Sent Events)** over HTTPS
- Credentials centralized in **AWS Secrets Manager** (per-tenant)
- Multi-user support with tenant isolation
- Full observability via CloudWatch + X-Ray
- Best for: production, enterprise, multi-tenant SaaS

#### Deployment Progression Strategy

| Milestone | Mode | Transport | Credentials | Users |
|-----------|------|-----------|-------------|-------|
| PoC (Week 1–2) | Local | stdio | Config file | 1 (developer) |
| MVP (Week 3–5) | Local | stdio | OS Keychain | 1–5 (pilot users) |
| Production (Week 8+) | AWS-hosted | SSE | Secrets Manager | N (enterprise) |

**Key design principle:** The core logic (tools, auth module, API clients) is **identical** between local and hosted modes. Only the transport layer and credential provider are swapped:

```
sp-api-mcp/
├── src/
│   ├── transport/
│   │   ├── stdio.ts            ← Local mode (Amazon Quick subprocess)
│   │   └── sse.ts              ← Remote mode (AWS-hosted via API Gateway)
│   ├── auth/
│   │   ├── interface.ts        ← Common credential interface
│   │   ├── local-provider.ts   ← Reads from config file / OS keychain
│   │   └── aws-provider.ts     ← Reads from Secrets Manager
│   ├── tools/                   ← Same in both modes
│   ├── clients/                 ← Same in both modes
│   └── index.ts                 ← Entry point (picks transport via --mode flag)
```

### 3.2 Component Diagram (Core — Shared Across Deployments)

```
SP-API MCP Server
├── Transport Layer
│   ├── stdio (local mode — Amazon Quick Desktop)
│   └── SSE/HTTP (remote mode — optional)
│
├── Configuration & Auth Module
│   ├── Account Type Selection (Seller / Vendor / Both)
│   ├── LWA OAuth2 Token Management
│   ├── Credential Store (client_id, client_secret, refresh_token)
│   ├── Marketplace Selection (NA / EU / FE)
│   └── Role-Based API Filtering
│
├── Tool Registry (Dynamic)
│   ├── Shared Tools (always exposed)
│   ├── Seller Tools (exposed when account_type = seller | both)
│   └── Vendor Tools (exposed when account_type = vendor | both)
│
├── API Client Layer
│   ├── Rate Limiter (per-API usage plan enforcement)
│   ├── Request Builder (auth headers, endpoint routing)
│   ├── Response Parser (JSON → structured MCP responses)
│   └── Error Handler (retry logic, throttle backoff)
│
└── Utility Modules
    ├── RDT (Restricted Data Token) Manager
    ├── Report Poller (async report retrieval)
    ├── Feed Submitter (async feed processing)
    └── Notification Subscriber (SQS/EventBridge setup)
```

---

## 4. Functional Requirements

### 4.1 Account Configuration (FR-01)

| ID | Requirement |
|----|-------------|
| FR-01.1 | User MUST be able to specify account type: `seller`, `vendor`, or `both` |
| FR-01.2 | When `seller` is selected, only Seller + Shared API tools are exposed |
| FR-01.3 | When `vendor` is selected, only Vendor + Shared API tools are exposed |
| FR-01.4 | When `both` is selected, all API tools are exposed |
| FR-01.5 | User MUST be able to specify marketplace region (NA, EU, FE) and specific marketplace IDs |
| FR-01.6 | Configuration MUST be storable in a JSON config file for persistence |

### 4.2 Authentication & Authorization (FR-02)

| ID | Requirement |
|----|-------------|
| FR-02.1 | Support LWA (Login with Amazon) OAuth 2.0 flow for token acquisition |
| FR-02.2 | Automatic refresh token rotation before expiry |
| FR-02.3 | Support multiple SP-API application credentials (dev/prod) |
| FR-02.4 | Credentials stored securely (encrypted at rest or OS keychain) |
| FR-02.5 | Support Restricted Data Tokens (RDT) for PII-sensitive operations |
| FR-02.6 | Support grantless operations (Notifications, Application Management) |
| FR-02.7 | Support vendor group authorization for multi-account vendors |

### 4.3 Dynamic Tool Exposure (FR-03)

| ID | Requirement |
|----|-------------|
| FR-03.1 | MCP `tools/list` response MUST only include tools relevant to the configured account type |
| FR-03.2 | Each SP-API operation MUST map to one MCP tool with clear naming convention |
| FR-03.3 | Tool descriptions MUST include: purpose, required parameters, optional parameters, and rate limits |
| FR-03.4 | Tools MUST be grouped by API domain (e.g., `spapi_orders_get_orders`, `spapi_vendor_orders_get_purchase_orders`) |
| FR-03.5 | A `spapi_get_config` meta-tool MUST be exposed showing current account type, marketplace, and available API groups |
| FR-03.6 | Tool descriptions MUST support lazy-loading to avoid exceeding AI agent context window limits (return summaries in `tools/list`, full schema on `tools/call`) |

### 4.4 API Operations (FR-04)

| ID | Requirement |
|----|-------------|
| FR-04.1 | All current-version GET operations → read-only MCP tools |
| FR-04.2 | All current-version POST/PUT/PATCH/DELETE operations → write MCP tools (with mandatory confirmation prompts for destructive operations: delete listing, cancel order, cancel shipment) |
| FR-04.3 | Async operations (Reports, Feeds, Data Kiosk) → composite tools that handle polling |
| FR-04.4 | Report tools: `request_report` → poll status → `get_report_document` → return parsed content |
| FR-04.5 | Feed tools: accept structured data → create feed document → submit → poll → return result |
| FR-04.6 | Data Kiosk: accept GraphQL query → create query → poll → retrieve results |
| FR-04.7 | Notification tools: create destination + subscription in one composite operation |

### 4.5 Rate Limiting & Throttling (FR-05)

| ID | Requirement |
|----|-------------|
| FR-05.1 | Implement per-API rate limiting per SP-API usage plans |
| FR-05.2 | Exponential backoff on 429 (Too Many Requests) responses |
| FR-05.3 | Expose current rate limit status via `spapi_rate_limit_status` tool |
| FR-05.4 | Queue requests when approaching rate limits rather than failing immediately |

### 4.6 Pagination (FR-05B)

| ID | Requirement |
|----|-------------|
| FR-05B.1 | Auto-pagination MUST have a configurable `max_total_results` safety cap (default: 1000) to prevent runaway fetches |
| FR-05B.2 | Each paginated page counts as a separate API call for rate-limiting purposes |
| FR-05B.3 | Pagination MUST be interruptible — the agent can request "next page" rather than fetching all at once |

### 4.7 Error Handling (FR-06)

| ID | Requirement |
|----|-------------|
| FR-06.1 | Map SP-API error codes to human-readable MCP error messages |
| FR-06.2 | Retry transient errors (5xx, network timeouts) up to 3 times with backoff |
| FR-06.3 | Return structured error objects with: code, message, details, suggested_action |
| FR-06.4 | Handle token expiration transparently (refresh and retry) |

### 4.8 Error Taxonomy (FR-07)

| Error Category | HTTP Codes | Suggested Action |
|---------------|-----------|-----------------|
| `auth_failure` | 401, 403 | Check credentials, re-authenticate |
| `rate_limited` | 429 | Wait and retry (auto-handled by queue) |
| `validation_error` | 400 | Fix request parameters per error details |
| `not_found` | 404 | Verify resource ID/ASIN exists |
| `api_error` | 500, 502, 503 | Retry automatically (up to 3x) |
| `timeout` | 504, network timeout | Retry with longer timeout |
| `quota_exceeded` | 429 (usage plan) | Wait for quota reset or request increase |
| `deprecated` | 410 | Update to newer API version |
| `sandbox_only` | 400 | Operation not available in sandbox mode |

---

## 5. Non-Functional Requirements

### 5.1 Performance (NFR-01)

| ID | Requirement |
|----|-------------|
| NFR-01.1 | Tool response time ≤ 5s for simple GET operations |
| NFR-01.2 | Async operations (reports, feeds) MUST return intermediate status within 2s |
| NFR-01.3 | Support concurrent tool calls (parallel requests to different APIs) |
| NFR-01.4 | Connection pooling for HTTP clients |

### 5.2 Security (NFR-02)

| ID | Requirement |
|----|-------------|
| NFR-02.1 | No credentials logged or returned in tool responses |
| NFR-02.2 | TLS 1.2+ for all SP-API communications |
| NFR-02.3 | PII fields masked in logs unless explicitly requested via RDT |
| NFR-02.4 | Configuration file with credentials MUST be file-permission restricted (600) |

### 5.3 Reliability (NFR-03)

| ID | Requirement |
|----|-------------|
| NFR-03.1 | Graceful degradation: if one API is down, other tools remain functional |
| NFR-03.2 | Health check tool (`spapi_health_check`) to verify connectivity and auth status |
| NFR-03.3 | Token refresh must not interrupt in-flight requests |

### 5.4 Extensibility (NFR-04)

| ID | Requirement |
|----|-------------|
| NFR-04.1 | New SP-API versions can be added via configuration (model swap) without code changes |
| NFR-04.2 | Plugin architecture for custom post-processing (e.g., transform raw report CSV into structured data) |
| NFR-04.3 | Support for sandbox mode for testing |

---

## 6. MCP Tool Naming Convention

```
spapi_{domain}_{operation}
```

**Examples:**

| Tool Name | Maps To |
|-----------|---------|
| `spapi_orders_get_orders` | Orders API → getOrders |
| `spapi_orders_get_order_items` | Orders API → getOrderItems |
| `spapi_catalog_search_items` | Catalog Items API → searchCatalogItems |
| `spapi_vendor_orders_get_purchase_orders` | Vendor Orders API → getPurchaseOrders |
| `spapi_vendor_df_orders_get_orders` | Vendor DF Orders → getOrders |
| `spapi_reports_create_report` | Reports API → createReport |
| `spapi_reports_get_report_document` | Reports API → getReportDocument |
| `spapi_feeds_create_feed` | Feeds API → createFeed |
| `spapi_data_kiosk_create_query` | Data Kiosk → createQuery |
| `spapi_notifications_subscribe` | Notifications → createSubscription |
| `spapi_pricing_get_competitive_pricing` | Product Pricing → getCompetitiveSummary |
| `spapi_fba_inventory_get_summaries` | FBA Inventory → getInventorySummaries |

---

## 7. Configuration Schema

```json
{
  "server_name": "sp-api-mcp",
  "version": "1.0.0",
  "account_type": "seller | vendor | both",
  "marketplace": {
    "region": "NA | EU | FE",
    "marketplace_ids": ["ATVPDKIKX0DER"],
    "endpoint": "https://sellingpartnerapi-na.amazon.com"
  },
  "credentials": {
    "client_id": "amzn1.application-oa2-client.xxx",
    "client_secret": "$KEYCHAIN:sp-api-client-secret",
    "refresh_token": "$KEYCHAIN:sp-api-refresh-token",
    "aws_access_key": "$KEYCHAIN:sp-api-aws-access-key",
    "aws_secret_key": "$KEYCHAIN:sp-api-aws-secret-key",
    "role_arn": "arn:aws:iam::xxx:role/sp-api-role"
  },
  "options": {
    "sandbox_mode": false,
    "auto_paginate": true,
    "max_page_results": 100,
    "report_polling_interval_seconds": 15,
    "report_polling_timeout_seconds": 300,
    "enable_rdt_for_pii": true,
    "max_total_results": 1000,
    "log_level": "info"
  },
  "enabled_api_groups": [
    "orders",
    "catalog",
    "pricing",
    "reports",
    "feeds",
    "fba_inventory",
    "notifications"
  ]
}
```

---

## 8. Amazon Quick Integration

### 8.1 Local Mode Registration (Dev/Testing)

To connect the local MCP server to Amazon Quick:

1. **Navigate to:** Settings → Capabilities → MCP tab
2. **Click:** "+ Add MCP / Skill"
3. **Configure:**
   - **Name:** `SP-API MCP Server`
   - **Transport:** `stdio`
   - **Command:** `node /path/to/sp-api-mcp/dist/index.js` (or `python -m sp_api_mcp`)
   - **Args:** `["--config", "/path/to/config.json", "--mode", "local"]`
   - **Env:** (optional overrides)

### 8.2 Remote/Hosted Mode Registration (Production)

1. **Navigate to:** Settings → Capabilities → MCP tab
2. **Click:** "+ Add MCP / Skill"
3. **Configure:**
   - **Name:** `SP-API MCP Server (Production)`
   - **Transport:** `sse`
   - **URL:** `https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/mcp`
   - **Headers:** `{"Authorization": "Bearer <user-token>"}`

### 8.3 User Experience in Amazon Quick

Once connected (either mode), users can interact naturally:

> **User:** "Show me my top 10 orders from last week"
> **Quick:** Calls `spapi_orders_get_orders` with date filters → returns formatted table

> **User:** "What's the inventory status for ASIN B08N5WRWNW?"
> **Quick:** Calls `spapi_fba_inventory_get_summaries` → returns fulfillable, inbound, reserved quantities

> **User:** "Get my vendor purchase orders that are pending"
> **Quick:** Calls `spapi_vendor_orders_get_purchase_orders` with status=PENDING → returns PO list

> **User:** "Generate a sales report for June 2026"
> **Quick:** Calls `spapi_reports_create_report` → polls → retrieves → parses → chart

> **User:** "Every morning, check for new vendor POs and summarize them"
> **Quick:** Creates a scheduled agent that runs `spapi_vendor_orders_get_purchase_orders` daily

---

## 9. Technology Stack (Recommended)

| Component | Option A (TypeScript) | Option B (Python) |
|-----------|----------------------|-------------------|
| Language | TypeScript/Node.js | Python 3.11+ |
| MCP SDK | `@modelcontextprotocol/sdk` | `mcp` (Python SDK) |
| HTTP Client | `axios` / `node-fetch` | `httpx` (async) |
| Auth | Custom LWA OAuth2 client | `python-amazon-sp-api` or custom |
| Config | `dotenv` + JSON schema | `pydantic` + `.env` |
| Rate Limiter | `bottleneck` | `aiolimiter` |
| Logging | `pino` | `structlog` |
| Testing | `jest` + `nock` | `pytest` + `respx` |

---

## 10. Tool Count Estimate

| Account Type | Estimated Tools |
|--------------|-----------------|
| Seller only | ~85–100 tools |
| Vendor only | ~40–50 tools |
| Both | ~120–140 tools |
| + Meta tools (config, health, rate limits) | +5 tools |

---

## 11. Implementation Phases

### Phase 1: Full MCP Server Build (Local Deployment)

Build the complete MCP server with all SP-APIs, running locally via `stdio` transport.

- MCP server scaffold with `stdio` transport
- LWA OAuth2 token management (auto-refresh, STS AssumeRole, SigV4 signing)
- Account type filtering logic (Seller / Vendor / Both)
- **All Seller APIs** — Orders, Catalog, Pricing, Inventory, Reports, Feeds, Listings, Finances, Fulfillment Inbound/Outbound, Shipping, Notifications, Sales, Messaging, Solicitations, etc.
- **All Vendor APIs** — Vendor Orders, Shipments, Invoices, Transaction Status, Direct Fulfillment (Orders, Shipping, Inventory, Payments)
- **All Shared APIs** — A+ Content, Data Kiosk (GraphQL), Catalog Items, Feeds, Reports, Notifications, Listings, Product Type Definitions, Tokens, Uploads, Replenishment
- Async operation handlers (report polling, feed submission, Data Kiosk GraphQL)
- Rate limiting + error handling + retry logic (exponential backoff)
- Composite/workflow tools (e.g., "create listing end-to-end", PO → ACK → ASN → Invoice)
- RDT (Restricted Data Tokens) for PII access
- Sandbox mode for testing
- OS Keychain credential storage
- Auto-pagination for large result sets
- Register and test with Amazon Quick locally
- Comprehensive test suite (unit + integration against sandbox)
- User documentation and setup guide
- Security audit + performance optimization

### Phase 2: Scalability — AWS-Hosted Deployment

Move from local to cloud-hosted for multi-user, enterprise-grade operation.

- Add SSE transport layer (same core code, swap transport module)
- Deploy to ECS Fargate (or Lambda for cost savings)
- API Gateway for SSE endpoint
- Secrets Manager for credential storage (per-tenant)
- Multi-user/tenant isolation
- Auto-scaling policies (based on active connections)
- CloudWatch logging + X-Ray tracing
- Infrastructure as Code (CDK or CloudFormation)
- WAF (optional) for IP filtering / rate limiting
- Zero-downtime rolling deployments
- Performance testing under load (50+ concurrent users)

### Phase 3: Multi-Marketplace Expansion

Support multiple marketplace regions simultaneously (NA + EU + FE) from a single MCP server instance.

- Support multiple simultaneous marketplace regions (NA + EU + FE)
- Per-marketplace credential sets (different seller/vendor accounts per region)
- Marketplace-aware tool routing (user specifies target marketplace per request, or sets a default)
- Cross-marketplace aggregation tools (e.g., "show inventory across all regions")
- Region-specific API handling (e.g., Easy Ship = IN/JP, Delivery by Amazon = BR)
- Multi-marketplace reporting (consolidated reports across regions)
- Marketplace ID validation and endpoint routing
- Currency/locale handling in responses
- Time zone awareness for date-range queries
- Independent rate limiting per marketplace

---

## 12. Acceptance Criteria (Per Phase)

### Phase 1: Full MCP Server Build — Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-1.1 | MCP server starts via `stdio` and responds to `initialize` handshake | Run `echo '{"jsonrpc":"2.0","method":"initialize",...}' \| node dist/index.js` — verify valid MCP response |
| AC-1.2 | `tools/list` returns only Seller+Shared tools when `account_type=seller` | Set config to `seller`, call `tools/list`, confirm no `spapi_vendor_*` tools present |
| AC-1.3 | `tools/list` returns only Vendor+Shared tools when `account_type=vendor` | Set config to `vendor`, call `tools/list`, confirm no seller-specific tools |
| AC-1.4 | `tools/list` returns all tools when `account_type=both` | Set config to `both`, call `tools/list`, confirm full set (≥120 tools) |
| AC-1.5 | LWA token exchange succeeds with valid `refresh_token` | Call any tool → verify no auth errors, access token acquired |
| AC-1.6 | Token auto-refreshes before expiry without user intervention | Wait 55+ minutes, call tool again → no 401 error |
| AC-1.7 | `spapi_orders_get_orders` returns valid order data | Call with `createdAfter` = 7 days ago → verify JSON response with order list |
| AC-1.8 | `spapi_catalog_search_items` returns catalog results | Call with keyword → verify items returned with ASINs |
| AC-1.9 | `spapi_fba_inventory_get_summaries` returns inventory data | Call with marketplace → verify fulfillable/inbound quantities |
| AC-1.10 | `spapi_reports_create_report` + polling returns parsed report | Request `GET_FLAT_FILE_OPEN_LISTINGS_DATA` → verify polling completes and data returned |
| AC-1.11 | `spapi_pricing_get_competitive_pricing` returns pricing data | Call with ASIN → verify buybox price, offer count |
| AC-1.12 | `spapi_feeds_create_feed` submits and returns result | Submit a `POST_FLAT_FILE_LISTINGS_DATA` feed → verify accepted + processing result |
| AC-1.13 | `spapi_listings_put_listings_item` creates/updates a listing | Submit listing patch → verify 200 response or structured validation errors |
| AC-1.14 | `spapi_finances_get_transactions` returns financial events | Call with date range → verify transaction data returned |
| AC-1.15 | `spapi_vendor_orders_get_purchase_orders` returns PO list | Call with `createdAfter` → verify PO data with items, quantities |
| AC-1.16 | `spapi_vendor_orders_submit_acknowledgement` accepts PO ACK | Submit ACK for a PO → verify 202 accepted |
| AC-1.17 | `spapi_vendor_shipments_submit_shipments` creates ASN | Submit shipment confirmation → verify 202 accepted |
| AC-1.18 | `spapi_vendor_invoices_submit_invoices` submits invoice | Submit vendor invoice → verify 202 accepted |
| AC-1.19 | `spapi_data_kiosk_create_query` accepts GraphQL and returns data | Submit vendor analytics query → verify results returned |
| AC-1.20 | Data Kiosk polling handles long-running queries (up to 5min) | Submit complex query → verify polling waits and returns |
| AC-1.21 | PO → ACK → ASN → Invoice composite workflow works end-to-end | Run full vendor procurement cycle without manual intervention |
| AC-1.22 | Composite report tool auto-parses CSV/TSV into structured JSON | Request inventory report → verify JSON output (not raw TSV) |
| AC-1.23 | Notification destination creation (SQS) via composite tool | Call `spapi_notifications_setup` → verify SQS queue + subscription created |
| AC-1.24 | RDT retrieves PII when explicitly requested | Call `get_order` with `dataElements=buyerInfo` → verify PII fields present |
| AC-1.25 | RDT is NOT used unless explicitly configured | Default config → verify buyer PII fields are masked/absent |
| AC-1.26 | Sandbox mode returns mock data without hitting production | Set `sandbox_mode: true` → verify sandbox endpoint used |
| AC-1.27 | Rate limiter prevents 429 errors under normal usage | Run 50 sequential calls to Orders API → zero 429 responses |
| AC-1.28 | Rate limiter queues requests when approaching limit | Burst 20 rapid calls → verify queuing (no errors) |
| AC-1.29 | Exponential backoff retries on 5xx errors | Mock 503 → verify retry up to 3 times with increasing delay |
| AC-1.30 | Auto-pagination fetches all pages for large result sets | Call `get_orders` returning 200+ orders → verify all pages fetched |
| AC-1.31 | Error responses include `code`, `message`, `suggested_action` | Trigger each error type → verify structured error object |
| AC-1.32 | Invalid credentials return clear error (not crash) | Provide bad `refresh_token` → verify structured error message |
| AC-1.33 | `spapi_health_check` returns auth + connectivity summary | Call → verify token validity and endpoint reachability |
| AC-1.34 | `spapi_rate_limit_status` shows current usage per API | Call → verify per-API remaining quota displayed |
| AC-1.35 | OS Keychain integration stores/retrieves credentials | Configure keychain mode → verify no plaintext on disk |
| AC-1.36 | Server registers in Amazon Quick and tools appear | Add to Settings → MCP → verify tools in agent capabilities |
| AC-1.37 | NL query in Quick resolves to correct tool | Ask "show my orders from this week" → confirm correct tool called |
| AC-1.38 | Quick scheduled agent can run SP-API tools on a cron | Create schedule "daily PO check" → verify runs at time |
| AC-1.39 | Tool chaining: Orders → Inventory → Flag at-risk items | Ask "which orders have low inventory?" → verify multi-tool chain |
| AC-1.40 | Unit test coverage ≥ 80% on core modules | Run `jest --coverage` or `pytest --cov` → verify ≥ 80% |
| AC-1.41 | Integration tests pass against SP-API sandbox | Run integration suite → all green |
| AC-1.42 | README: install → configure → register → first query in <15 min | New user follows README → working in < 15 minutes |
| AC-1.43 | No credential or PII leakage in any log output | Audit all log statements → verify masking |
| AC-1.44 | p95 latency < 5s for synchronous GET tools | Load test 100 calls → measure p95 |
| AC-1.45 | Async tools (reports) complete within 5 minutes | Request 5 report types → all return within 300s |
| AC-1.46 | Security audit passes (no high/critical vulnerabilities) | Run `npm audit` / `safety check` → zero findings |

### Phase 2: Scalability (AWS-Hosted) — Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-2.1 | MCP server deploys to ECS Fargate via CDK/CloudFormation | Run `cdk deploy` → verify ECS task running |
| AC-2.2 | SSE transport endpoint accessible via API Gateway | Connect from Quick via SSE URL → verify MCP handshake |
| AC-2.3 | Credentials read from Secrets Manager (not local file) | Verify no plaintext creds in container/task definition |
| AC-2.4 | Multi-tenant: User A can't access User B's data | Two tenant configs → verify isolated credential usage |
| AC-2.5 | Amazon Quick connects via remote SSE URL and tools work | Register SSE endpoint in Quick → call a tool → verify results |
| AC-2.6 | CloudWatch logs capture all requests (no credentials) | Check log group → verify secrets masked |
| AC-2.7 | X-Ray traces show end-to-end latency | Check X-Ray → verify trace from Gateway → ECS → SP-API |
| AC-2.8 | Auto-scaling triggers on connection count threshold | Simulate 10+ connections → verify new task spawns |
| AC-2.9 | Deployment takes < 10 minutes from `cdk deploy` | Time deployment → verify ≤ 10min |
| AC-2.10 | Container health check passes and recovers from crash | Kill task → verify ECS restarts within 60s |
| AC-2.11 | WAF blocks unauthorized IPs (if enabled) | Request from non-whitelisted IP → verify 403 |
| AC-2.12 | Same results in local vs. hosted mode | Run test suite against both → compare outputs |
| AC-2.13 | Handles 50+ concurrent users without degradation | Load test 50 connections → p95 < 8s |
| AC-2.14 | Zero-downtime deployments via rolling ECS update | Deploy new version → verify no dropped connections |

### Phase 3: Multi-Marketplace Expansion — Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-3.1 | Server supports multiple marketplace configs simultaneously | Configure NA + EU + FE → verify all three accessible |
| AC-3.2 | User can specify target marketplace per tool call | Call `spapi_orders_get_orders` with `marketplace=EU` → verify EU endpoint |
| AC-3.3 | Default marketplace applies when none specified | Set default=NA → call without param → verify NA used |
| AC-3.4 | Per-marketplace credentials stored and used correctly | NA uses cred A, EU uses cred B → verify isolation |
| AC-3.5 | Cross-marketplace aggregation returns combined results | Call `spapi_inventory_get_all_regions` → verify NA+EU+FE merged |
| AC-3.6 | Region-specific APIs only exposed for valid marketplaces | Easy Ship tools only when IN/JP configured |
| AC-3.7 | Marketplace ID validation rejects invalid IDs | Pass fake marketplace ID → verify structured error |
| AC-3.8 | Currency/locale correctly reflected in responses | EU → EUR amounts; NA → USD |
| AC-3.9 | Date-range queries respect marketplace time zones | JP "today" → verify JST date used |
| AC-3.10 | Multi-marketplace reporting consolidates across regions | "Sales report all regions" → verify combined with region labels |
| AC-3.11 | Rate limiting is independent per marketplace | Hit NA rate limit → verify EU calls still succeed |
| AC-3.12 | Marketplace switcher shows active regions and status | Call `spapi_get_config` → verify all marketplaces listed with health |

---

## 13. AWS Infrastructure (Production Deployment)

### Required AWS Services

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| ECS Fargate | MCP server runtime | ~$30–60/mo per tenant container |
| API Gateway (WebSocket/HTTP) | SSE transport endpoint | ~$3.50/million requests |
| Secrets Manager | Per-tenant SP-API credentials | $0.40/secret/month |
| CloudWatch | Logging & metrics | ~$5–10/mo |
| X-Ray | Distributed tracing | ~$5/100K traces |
| WAF (optional) | Rate limiting & IP filtering | ~$5/mo + $0.60/million requests |
| Route 53 (optional) | Custom domain | $0.50/zone |

### Infrastructure as Code

A CDK or CloudFormation template will provision:
- VPC + private subnets (MCP server doesn't need public access)
- ECS Cluster + Fargate Task Definition
- API Gateway with WebSocket/SSE routes
- IAM roles (execution role, task role)
- Secrets Manager entries (templated per tenant)
- CloudWatch Log Groups + Alarms
- Auto-scaling policies (based on active connections)

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SP-API rate limits hit frequently | Tool failures, degraded UX | Implement intelligent queuing + caching for read operations |
| Token expiration during long operations | Failed requests | Proactive refresh 5min before expiry |
| Large API surface → maintenance burden | Stale tools | Auto-generate tool definitions from SP-API Swagger/OpenAPI models |
| PII exposure through agent responses | Compliance violation | RDT gating + PII field masking in tool outputs |
| SP-API deprecation of versions | Breaking changes | Version pinning + deprecation monitoring via release notes |
| Amazon Quick context window limits | Tool descriptions too large with 140+ tools | Lazy-load tool descriptions; group by domain |

---

## 15. Success Criteria

- [ ] User can configure Seller or Vendor mode and see only relevant tools
- [ ] All current-version SP-API operations are accessible as MCP tools
- [ ] Async operations (Reports, Feeds, Data Kiosk) work end-to-end through composite tools
- [ ] Rate limiting prevents API throttling under normal usage
- [ ] Authentication is seamless (auto-refresh, no manual token management)
- [ ] Server registers and functions correctly in Amazon Quick (Settings → MCP)
- [ ] Natural language queries to Amazon Quick correctly route to appropriate SP-API tools
- [ ] < 5s response time for synchronous operations
- [ ] Error messages are actionable and human-readable

---

## 16. Open Questions

1. **Credential management:** Should we use OS keychain (macOS Keychain / Windows Credential Manager) or encrypted config file? → *Resolved: OS keychain is the default; plaintext config is dev-only with `$KEYCHAIN:` references in production.*
2. **Multi-account support:** Should one MCP server instance support multiple seller/vendor accounts simultaneously?
3. **Caching strategy:** Should we cache catalog/pricing data locally for faster repeated queries?
4. **Report parsing:** Should the MCP server auto-parse report content (CSV/TSV/JSON) or return raw? → *Resolved: Auto-parse by default (AC-1.22); raw available via option.*
5. **Webhook/notification receiver:** Should the MCP server include a listener for real-time SP-API notifications?
6. **Approval workflow:** → *Resolved: Destructive operations (delete listing, cancel order, cancel shipment) enforce a confirmation step (FR-04.2).*
7. **Technology choice:** TypeScript or Python? (Recommend TypeScript for tighter MCP SDK integration and Amazon Quick ecosystem alignment.)
8. **API versioning:** When SP-API releases a new version, should the server support both old and new simultaneously, or auto-migrate?

---

*Document Version: 1.1*  
*Created: June 22, 2026*  
*Last Updated: June 22, 2026*  
*Author: Manikanta Gona Grafsgaard*  
*Source Reference: [SP-API Models](https://developer-docs.amazon.com/sp-api/docs/sp-api-models)*
