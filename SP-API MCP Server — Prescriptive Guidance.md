# Enabling AI-Powered Amazon Selling Partner Operations Through Model Context Protocol (MCP)

Manikanta Gona Grafsgaard (Amazon Web Services)

June 2026 ([document history](#document-history))

---

## Business overview

Amazon selling partners — both vendors and third-party sellers — manage complex daily operations across orders, inventory, pricing, fulfillment, advertising, and reporting. The Amazon Selling Partner API (SP-API) provides programmatic access to over 50 APIs covering these domains, but interacting with them requires deep technical expertise, custom integrations, and constant maintenance as APIs evolve.

The Model Context Protocol (MCP) is an open standard that defines how AI applications communicate with external tools and data sources. By wrapping the SP-API surface in an MCP server, you enable AI agents (such as Amazon Quick) to interact with Seller Central and Vendor Central data through natural language — without requiring users to understand API endpoints, authentication flows, or data schemas.

This guide provides prescriptive guidance for building and deploying an SP-API MCP server that:

- Provides unified, natural-language access to all SP-API operations
- Supports dual-mode operation (Seller, Vendor, or Both)
- Handles authentication, rate limiting, and error recovery transparently
- Scales from local development to enterprise multi-tenant production deployment

---

## Solution overview

The SP-API MCP server acts as an intelligent intermediary between AI agents and the Amazon Selling Partner API ecosystem. Rather than building point-to-point integrations for each AI use case, you build one MCP server that exposes all SP-API capabilities as structured tools that any MCP-compatible client can discover and invoke.

### Key capabilities enabled

By implementing the recommendations in this guide, you gain:

- **Natural language operations** — Users ask "What are my pending orders?" and the AI agent automatically selects and invokes the correct SP-API tool with appropriate parameters.
- **Unified seller and vendor workflows** — A single server instance handles both seller and vendor account types, dynamically filtering available operations based on the configured account mode.
- **Automated async operations** — Composite tools handle multi-step workflows (report creation → polling → download) as single operations, hiding API complexity.
- **Intelligent rate limiting** — Per-API-domain rate limiting with queue-before-fail strategy prevents throttling under normal usage patterns.
- **Enterprise-ready architecture** — Pluggable transport layer supports both local (stdio) and cloud-hosted (SSE/HTTP) deployments without code changes.

### Target audience

This guide is intended for:

- **Solution architects** designing AI-enabled selling partner integrations
- **Developers** building MCP servers for SP-API access
- **Technical program managers** evaluating MCP-based approaches for Amazon marketplace operations
- **Selling partners** seeking to leverage AI assistants for operational efficiency

### Prerequisites

- Familiarity with the Amazon Selling Partner API
- Understanding of OAuth 2.0 authentication (Login with Amazon)
- Basic knowledge of Node.js/TypeScript or Python
- An AWS account (for Phase 2 cloud deployment)

---

## Prerequisites — detailed setup

Before implementing this solution, you must satisfy the following prerequisites. This section provides step-by-step guidance for each.

### 1. Node.js (v18 or higher)

The MCP server is built with TypeScript and runs on Node.js.

**Check if installed:**
```bash
node --version
```

**If not installed or below v18:**

- **macOS (recommended — via Homebrew):**
  ```bash
  brew install node@20
  ```
- **macOS (via official installer):** Download from [nodejs.org](https://nodejs.org/) — choose the LTS version (20.x or later).
- **Windows:** Download the `.msi` installer from [nodejs.org](https://nodejs.org/).
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

**Verify after installation:**
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

---

### 2. Amazon Seller or Vendor account

You need an active Amazon selling account to access SP-API data.

**For sellers (third-party):**
1. Go to [Amazon Seller Central](https://sellercentral.amazon.com/)
2. Register for a **Professional selling plan** ($39.99/month in the US)
3. Complete account verification (identity, bank account, tax information)
4. Wait for account approval (typically 1–3 business days)

**For vendors (first-party):**
- Vendor accounts are invitation-only from Amazon
- If you already have one, sign in at [Amazon Vendor Central](https://vendorcentral.amazon.com/)

> **Note:** For testing with mock mode, no seller/vendor account is needed. You only need an account when connecting to real SP-API endpoints.

---

### 3. SP-API developer application registration

To call real SP-API endpoints, you must register as a developer and create an application.

**Step 1 — Register as a developer:**
1. Sign in to [Seller Central](https://sellercentral.amazon.com/)
2. Navigate to **Apps & Services → Develop Apps**
3. Click **Proceed to Developer Registration**
4. Fill in:
   - **Developer name:** Your company name
   - **Data access type:** Select the APIs you plan to use
   - **Use case description:** Describe your integration (e.g., "AI-powered operations assistant using MCP")
5. Accept the Developer Agreement
6. Submit — approval typically takes 1–5 business days

**Step 2 — Create an SP-API application:**
1. After developer approval, go to **Apps & Services → Develop Apps**
2. Click **Add new app client**
3. Select **SP API** as the API type
4. Choose the roles your app needs:
   - For seller tools: check relevant seller roles
   - For vendor tools: check vendor roles
5. Save — you'll receive:
   - `client_id` (LWA Client ID)
   - `client_secret` (LWA Client Secret)

**Step 3 — Self-authorize your application (for your own account):**
1. Go to **Apps & Services → Manage Your Apps**
2. Find your app and click **Authorize**
3. Click **Generate refresh token**
4. Save the `refresh_token` — this grants your app access to your own account data

> **Important:** Store these credentials securely. Never commit them to source control.

**Reference:** [SP-API Registration Guide](https://developer-docs.amazon.com/sp-api/docs/registering-as-a-developer)

---

### 4. AWS IAM credentials (optional — for STS AssumeRole)

Some SP-API operations require AWS IAM credentials for Signature Version 4 signing. This is needed if your application uses the AssumeRole method.

**If using self-authorization (recommended for single-account):**
- You do NOT need IAM credentials
- The refresh_token from Step 3 above is sufficient

**If using delegated authorization (multi-account / third-party apps):**
1. Sign in to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create an IAM user with programmatic access
3. Attach the following inline policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "sts:AssumeRole",
         "Resource": "arn:aws:iam::YOUR_ACCOUNT:role/YOUR_SP_API_ROLE"
       }
     ]
   }
   ```
4. Create the IAM role referenced above with an SP-API trust relationship
5. Save the `aws_access_key`, `aws_secret_key`, and `role_arn`

**Reference:** [SP-API IAM Policies](https://developer-docs.amazon.com/sp-api/docs/creating-and-configuring-iam-policies-and-entities)

---

### 5. Amazon Quick Desktop (for AI agent integration)

Amazon Quick Desktop is the AI assistant that connects to your MCP server.

**Installation:**
1. Go to [Amazon Quick Downloads](https://aws.amazon.com/quicksight/q/desktop/)
2. Download the macOS or Windows installer
3. Install and sign in with your AWS account credentials
4. Verify the MCP tab is available: Settings → Capabilities → MCP

**Requirements:**
- Amazon Quick Enterprise subscription (for MCP integration)
- macOS 12+ or Windows 10+

> **Alternative MCP clients:** If you don't have Amazon Quick, you can test with any MCP-compatible client:
> - [Claude Desktop](https://claude.ai/download) — add MCP server in `claude_desktop_config.json`
> - [Kiro](https://kiro.dev) — add MCP server in `.kiro/settings/mcp.json`
> - Any client supporting the [MCP stdio transport](https://modelcontextprotocol.io/docs/concepts/transports)

---

### 6. AWS account (for Phase 2 cloud deployment only)

Phase 2 deploys the MCP server to AWS for multi-user production access. Skip this if you're only doing local testing.

**If you don't have an AWS account:**
1. Go to [aws.amazon.com](https://aws.amazon.com/) → Create an AWS Account
2. Provide email, payment method, and identity verification
3. Select a support plan (Free tier is sufficient to start)

**Services used in Phase 2:**
- Amazon ECS (Fargate) — server runtime
- Amazon API Gateway — SSE endpoint
- AWS Secrets Manager — credential storage
- Amazon CloudWatch — logging
- AWS X-Ray — tracing
- AWS CDK or CloudFormation — infrastructure as code

**Required IAM permissions for deployment:**
- `ecs:*`, `ec2:*` (VPC/networking), `logs:*`, `secretsmanager:*`
- `apigateway:*`, `iam:CreateRole`, `iam:PassRole`

---

### 7. Git (for cloning the repository)

**Check if installed:**
```bash
git --version
```

**If not installed:**
- **macOS:** `xcode-select --install` (installs Git as part of Xcode command-line tools)
- **Windows:** Download from [git-scm.com](https://git-scm.com/download/win)
- **Linux:** `sudo apt-get install git`

---

### Prerequisites checklist

Use this checklist to verify you're ready to proceed:

| Prerequisite | Required For | How to Verify |
|---|---|---|
| ✅ Node.js 18+ | All phases | `node --version` |
| ✅ npm 9+ | All phases | `npm --version` |
| ✅ Git | Cloning the project | `git --version` |
| ⬜ Amazon Seller/Vendor account | Real API calls (not mock) | Can sign in to Seller/Vendor Central |
| ⬜ SP-API developer registration | Real API calls (not mock) | Have client_id + client_secret |
| ⬜ SP-API refresh token | Real API calls (not mock) | Generated via self-authorization |
| ⬜ Amazon Quick Desktop | AI agent testing | App installed, MCP tab visible |
| ⬜ AWS account | Phase 2 cloud deployment | Can sign in to AWS Console |

> **Minimum to get started with mock mode:** Only Node.js, npm, and Git are required. You can test the full MCP integration without any Amazon or AWS credentials.

---

## Architecture overview

### High-level architecture

The solution follows a three-phase deployment progression, with identical core logic across all phases:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SP-API MCP Server (Core)                              │
│                                                                              │
│  ┌─────────────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │  Tool Registry       │    │  API Client       │    │  Auth Module        │  │
│  │  • 121 tools         │    │  • Rate limiter    │    │  • LWA OAuth2       │  │
│  │  • Dynamic filtering │    │  • Retry logic     │    │  • Token refresh    │  │
│  │  • Account-type ACL  │    │  • Auto-paginate   │    │  • RDT support      │  │
│  └─────────────────────┘    └──────────────────┘    └────────────────────┘  │
│                                                                              │
│  ┌─────────────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │  Transport Layer     │    │  Error Handler    │    │  Config Validator   │  │
│  │  • stdio (local)     │    │  • 9 categories   │    │  • Zod schema       │  │
│  │  • SSE (cloud)       │    │  • Suggested acts  │    │  • Env validation   │  │
│  └─────────────────────┘    └──────────────────┘    └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Deployment phases

| Phase | Mode | Transport | Credential Store | Users | Timeline |
|-------|------|-----------|-----------------|-------|----------|
| 1 — Local | Development / PoC | stdio | Local config file | 1–5 | Weeks 1–4 |
| 2 — Cloud-hosted | Production | SSE/HTTP | AWS Secrets Manager | N | Weeks 5–8 |
| 3 — Multi-marketplace | Enterprise | SSE/HTTP | Per-tenant Secrets | N × regions | Weeks 9–12 |

### Phase 1 architecture (local deployment)

```
┌─────────────────────────────────────────────────────────────┐
│              User's Machine                                   │
│                                                              │
│  ┌────────────┐     stdio      ┌────────────────────────┐   │
│  │ AI Agent   │ ◄────────────► │ SP-API MCP Server      │   │
│  │ (Quick /   │                │ (Node.js subprocess)    │   │
│  │  Claude)   │                │  ├── 121 tools          │   │
│  └────────────┘                │  ├── LWA OAuth2         │   │
│                                │  ├── Rate limiter       │   │
│                                │  └── Mock mode          │   │
│                                └───────────┬─────────────┘   │
└────────────────────────────────────────────│─────────────────┘
                                             │ HTTPS (TLS 1.2+)
                                             ▼
                                  Amazon SP-API Endpoints
```

### Phase 2 architecture (AWS-hosted deployment)

```
┌──────────────────┐              ┌──────────────────────────────────┐
│  AI Agent        │              │        AWS Account                │
│  (Quick Desktop/ │              │                                   │
│   Quick Web)     │───SSE/HTTP──►│  API Gateway                      │
│                  │              │       │                            │
└──────────────────┘              │       ▼                            │
                                  │  ECS Fargate                       │
                                  │  ┌─────────────────────────────┐  │
                                  │  │ SP-API MCP Server            │  │
                                  │  │  ├── Same 121 tools          │  │
                                  │  │  ├── Secrets Manager auth    │  │
                                  │  │  └── Per-tenant isolation    │  │
                                  │  └──────────────┬──────────────┘  │
                                  │                 │                  │
                                  │  CloudWatch  X-Ray  Auto-scaling  │
                                  └─────────────────│─────────────────┘
                                                    │ HTTPS
                                                    ▼
                                         Amazon SP-API Endpoints
```

---

## Data available through the SP-API

The SP-API MCP server provides access to 51 APIs organized by account type:

### Seller-only APIs (29 APIs, ~63 tools)

| Domain | Key Operations | Business Value |
|--------|----------------|----------------|
| Orders | Get orders, items, buyer info, addresses | Order monitoring, fulfillment tracking |
| FBA Inventory | Inventory summaries by SKU/ASIN | Stock-out prevention, replenishment planning |
| Pricing | Competitive pricing, Buy Box status | Dynamic pricing, competitive intelligence |
| Fulfillment Inbound | Create/manage FBA shipment plans | Warehouse intake optimization |
| Fulfillment Outbound | Multi-Channel Fulfillment (MCF) | Cross-channel order fulfillment |
| Shipping | Rates, labels, tracking | Shipping cost optimization |
| Finances | Transactions, fees, settlements | Revenue reconciliation, fee analysis |
| Sales | Aggregated order metrics | Performance dashboards, trend analysis |

### Vendor-only APIs (9 APIs, ~16 tools)

| Domain | Key Operations | Business Value |
|--------|----------------|----------------|
| Vendor Orders | Purchase orders, acknowledgements | PO automation, acceptance workflows |
| Vendor Shipments | ASN submission | Ship-to-Amazon logistics |
| Vendor Invoices | Invoice submission | Accounts receivable automation |
| Direct Fulfillment | DF orders, shipping, inventory | Drop-ship operations |

### Shared APIs (13 APIs, ~42 tools)

| Domain | Key Operations | Business Value |
|--------|----------------|----------------|
| Catalog Items | Search, get item details | Product research, catalog management |
| Reports | Create, poll, download reports | Automated reporting pipelines |
| Feeds | Submit listing/pricing/inventory feeds | Bulk operations |
| Data Kiosk | GraphQL analytics queries | Advanced analytics, brand insights |
| Listings | Create, update, delete listings | Listing lifecycle management |
| A+ Content | Create/edit enhanced content | Brand storytelling, conversion optimization |
| Notifications | Subscribe to event streams | Real-time operational awareness |

---

## Implementation strategy

### Step 1: Clone the repository

```bash
# Clone from code.aws.dev
git clone git@ssh.code.aws.dev:personal_projects/alias_m/mggona/amazon_selling_partner_mcp_server.git

# Navigate into the project
cd amazon_selling_partner_mcp_server/sp-api-mcp
```

> **Note:** If you don't have SSH access to code.aws.dev, ensure your Midway-signed SSH key is configured. Run `mwinit -s --fido2` to authenticate, then retry the clone.

### Step 2: Install dependencies and build

```bash
# Install Node.js dependencies
npm install

# Build the TypeScript project
npm run build
```

Verify the build succeeded:
```bash
ls dist/index.js   # Should show the compiled entry point
```

### Step 3: Configure the server

For **mock mode testing** (no credentials needed):
```bash
# The example config is ready to use — no edits required
cat config.example.json
```

For **real SP-API access**, create your own config:
```bash
cp config.example.json config.json
```

Edit `config.json` with your credentials:

```json
{
  "server_name": "sp-api-mcp",
  "version": "1.0.0",
  "account_type": "seller",
  "marketplace": {
    "region": "NA",
    "marketplace_ids": ["ATVPDKIKX0DER"],
    "endpoint": "https://sellingpartnerapi-na.amazon.com"
  },
  "credentials": {
    "client_id": "amzn1.application-oa2-client.YOUR_ID",
    "client_secret": "YOUR_SECRET",
    "refresh_token": "Atzr|YOUR_TOKEN"
  },
  "options": {
    "sandbox_mode": true,
    "auto_paginate": true,
    "max_total_results": 1000,
    "log_level": "info"
  }
}
```

> **Security:** Never commit `config.json` to version control. It's in `.gitignore` by default.

### Step 4: Validate with mock mode

Test without credentials to verify the MCP protocol and tool discovery work:

```bash
# Start server in mock mode
node dist/index.js --config ./config.example.json --mode local --mock
```

Or run a quick smoke test via pipe:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
| node dist/index.js --config ./config.example.json --mode local --mock 2>/dev/null
```

You should see a valid MCP handshake response confirming the server is operational.

### Step 5: Register with Amazon Quick Desktop

1. Open Amazon Quick Desktop
2. Go to **Settings → Capabilities → MCP tab**
3. Click **+ Add MCP** → select **Local**
4. Configure:

   | Field | Value |
   |-------|-------|
   | **Name** | `SP-API MCP Server` |
   | **Command** | `node` |
   | **Arguments** | `/path/to/sp-api-mcp/dist/index.js --config /path/to/sp-api-mcp/config.example.json --mode local --mock` |
   | **Timeout** | `30` |

   > **Important:** Use paths without spaces. If your project folder has spaces, create a symlink: `ln -sfn "/path/with spaces/sp-api-mcp" ~/sp-api-mcp` and use `~/sp-api-mcp/...` in the arguments.

5. Click **+ Add MCP** to save
6. Verify the server shows **105 tools** (seller mode) or **121 tools** (both mode)

### Step 6: Connect to SP-API sandbox

Switch from mock mode to sandbox:
1. Obtain SP-API developer credentials (client_id, client_secret, refresh_token)
2. Set `"sandbox_mode": true` in config.json
3. Remove `--mock` from the server arguments in Quick settings
4. Test against sandbox endpoints which return canned responses without affecting production

### Step 7: Enable production access

Set `"sandbox_mode": false` and test with real selling partner data. The server handles:
- Automatic token refresh (5 minutes before expiry)
- Rate limiting per API domain (queue-before-fail)
- Exponential backoff on transient errors (429, 5xx)
- Structured error responses with suggested recovery actions

---

## Connecting to Amazon Quick

### Amazon Quick Desktop (local mode — stdio)

The MCP server runs as a local subprocess on the user's machine. Amazon Quick spawns it and communicates via standard input/output.

| Setting | Value |
|---------|-------|
| Connection type | Local |
| Command | `node` |
| Arguments | `/path/to/dist/index.js --config /path/to/config.json --mode local` |

### Amazon Quick Web (remote mode — SSE/HTTP)

For the web version of Amazon Quick, the server must be deployed to a publicly-reachable endpoint:

1. Navigate to Connectors → Create for your team → Model Context Protocol (MCP)
2. Enter the server endpoint URL and authentication details
3. Quick discovers tools and registers them as actions

**Constraints:**
- 60-second timeout per operation (composite tools with polling must be split)
- HTTP streaming preferred over Server-Sent Events
- OAuth 2.0 required for authentication (supports Dynamic Client Registration)
- Tool list is static after initial discovery

---

## AI agent interaction patterns

Once connected, users interact with SP-API data through natural language:

### Order management
```
User: "Show me my unshipped orders from this week"
Agent: → spapi_orders_get_orders (orderStatuses=["Unshipped"], createdAfter=7d ago)
```

### Inventory monitoring
```
User: "Which SKUs have less than 50 units in stock?"
Agent: → spapi_fba_inventory_get_summaries → filter fulfillableQuantity < 50
```

### Pricing intelligence
```
User: "Am I winning the Buy Box for ASIN B08N5WRWNW?"
Agent: → spapi_pricing_get_competitive_pricing (asins=["B08N5WRWNW"])
```

### Vendor operations
```
User: "Accept all new purchase orders received today"
Agent: → spapi_vendor_orders_get_purchase_orders (purchaseOrderState="New")
       → spapi_vendor_orders_submit_acknowledgement (for each PO)
```

### Automated reporting
```
User: "Generate my weekly inventory health report"
Agent: → spapi_reports_create_and_download (reportType="GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA")
       → returns parsed report data
```

---

## Example responses from Amazon Quick

The following examples show what you see in Amazon Quick Desktop when interacting with the SP-API MCP server. These use mock mode data to illustrate the experience.

### Example 1: "Show me my recent orders"

**What Quick does:** Calls `spapi_orders_get_orders` with date filter

**Response in Quick:**

> Here are your recent orders:
>
> | Order ID | Date | Status | Channel | Total |
> |----------|------|--------|---------|-------|
> | 111-1234567-1234567 | Jun 20, 2026 | Shipped | FBA | $49.99 |
> | 111-7654321-7654321 | Jun 19, 2026 | Unshipped | MFN | $129.95 |
> | 111-9999999-0000001 | Jun 18, 2026 | Shipped | FBA | $24.99 |
>
> You have **3 orders** in the last 7 days. 2 shipped, 1 still unshipped (MFN — needs fulfillment).

---

### Example 2: "What's my FBA inventory?"

**What Quick does:** Calls `spapi_fba_inventory_get_summaries`

**Response in Quick:**

> Here's your current FBA inventory:
>
> | SKU | Product | Fulfillable | Inbound | Reserved |
> |-----|---------|-------------|---------|----------|
> | SKU-WIDGET-001 | Premium Widget Pro - Blue | 150 | 50 working, 25 shipped | 10 |
> | SKU-GADGET-002 | Gadget Accessory Pack | 320 | 0 working, 100 shipped | 5 |
>
> Both SKUs are well-stocked. SKU-WIDGET-001 has 75 units inbound (50 in working status + 25 shipped to FC).

---

### Example 3: "Am I winning the Buy Box for ASIN B08N5WRWNW?"

**What Quick does:** Calls `spapi_pricing_get_competitive_pricing` with the ASIN

**Response in Quick:**

> **Buy Box Status for B08N5WRWNW (Premium Widget Pro - Blue):**
>
> ✅ **Yes, you're winning the Buy Box**
>
> - Your price: **$19.99** (New)
> - Number of competing offers: **5**
> - Landed price: $19.99
>
> You're the current Buy Box winner. There are 4 other sellers competing on this ASIN.

---

### Example 4: "Show me the items in order 111-1234567-1234567"

**What Quick does:** Calls `spapi_orders_get_order_items` with the order ID

**Response in Quick:**

> **Order 111-1234567-1234567 — Line Items:**
>
> | # | ASIN | Product | Qty | Price | Tax |
> |---|------|---------|-----|-------|-----|
> | 1 | B08N5WRWNW | Premium Widget Pro - Blue | 2 | $39.98 | $3.60 |
> | 2 | B09K3LXYZ1 | Gadget Accessory Pack | 1 | $10.01 | $0.90 |
>
> **Total:** $49.99 + $4.50 tax = **$54.49**

---

### Example 5: "What are my sales metrics this week?"

**What Quick does:** Calls `spapi_sales_get_order_metrics` with weekly interval

**Response in Quick:**

> **Sales Summary (Jun 15–22, 2026):**
>
> | Metric | Value |
> |--------|-------|
> | Total Revenue | **$1,151.50** |
> | Units Ordered | 47 |
> | Orders | 38 |
> | Avg. Unit Price | $24.50 |
>
> Revenue is tracking well this week — 38 orders with an average cart value of ~$30.

---

### Example 6: "Show me my financial transactions from June"

**What Quick does:** Calls `spapi_finances_list_transactions` with date range

**Response in Quick:**

> **Financial Transactions (June 2026):**
>
> | Date | Type | Description | Amount |
> |------|------|-------------|--------|
> | Jun 20 | Order | Order payment: 111-1234567-1234567 | +$49.99 |
> | Jun 19 | Refund | Refund: 111-5555555-5555555 | -$24.99 |
> | Jun 18 | Fee | FBA fee | -$3.75 |
>
> **Net:** +$21.25 across 3 transactions shown.

---

### Example 7: "Show me pending vendor purchase orders" (Vendor mode)

**What Quick does:** Calls `spapi_vendor_orders_get_purchase_orders` with status filter

**Response in Quick:**

> **Pending Vendor Purchase Orders:**
>
> | PO Number | Date | Status | Items | Total Units |
> |-----------|------|--------|-------|-------------|
> | PO-2026-001234 | Jun 18, 2026 | New | B08N5WRWNW | 500 @ $5.00/ea |
> | PO-2026-001235 | Jun 15, 2026 | Acknowledged | B09K3LXYZ1 | 200 @ $8.50/ea |
>
> You have **1 new PO** that needs acknowledgement (PO-2026-001234 for 500 units). Would you like me to accept it?

---

### Example 8: "Check the server health"

**What Quick does:** Calls `spapi_health_check`

**Response in Quick:**

> **SP-API MCP Server Health:**
>
> | Component | Status |
> |-----------|--------|
> | Server | ✅ Healthy |
> | Authentication | ✅ Valid (expires in 3600s) |
> | Rate Limits | All clear — no queued requests |
>
> Everything is operational. Token is valid for another 60 minutes.

---

### Example 9: "Search the catalog for wireless earbuds"

**What Quick does:** Calls `spapi_catalog_search_items` with keywords

**Response in Quick:**

> **Catalog Search Results for "wireless earbuds":**
>
> | ASIN | Product | Brand | Type |
> |------|---------|-------|------|
> | B08N5WRWNW | Premium Widget Pro - Blue | WidgetCo | WIDGET |
> | B09K3LXYZ1 | Gadget Accessory Pack | GadgetCorp | ACCESSORY |
>
> Found 2 matching items. Want me to get detailed info for any of these ASINs?

---

### Example 10: Error handling — "Show me vendor purchase orders" (in Seller mode)

**What Quick does:** Tries to call `spapi_vendor_orders_get_purchase_orders` but account is configured as seller-only

**Response in Quick:**

> ⚠️ **Tool not available for your account type**
>
> The vendor purchase orders tool is only available for vendor or "both" account types. Your current configuration is set to **seller** mode.
>
> **To fix:** Update your config.json to `"account_type": "both"` if you have both seller and vendor accounts, or switch to a vendor-configured MCP server.
>
> You can check your current configuration by asking me "What's my account type?"

---

## Security considerations

### Authentication and credential management

- LWA OAuth 2.0 with automatic token refresh (proactive, 5 minutes before expiry)
- Race-condition-safe token refresh using promise coalescing
- Credentials never logged, returned in tool responses, or exposed via meta-tools
- Restricted Data Tokens (RDT) gated — PII access requires explicit configuration
- TLS 1.2+ enforced for all SP-API communication

### Input validation

- All tool inputs validated via Zod schemas before API invocation
- Path parameters validated against expected formats (Order IDs, ASINs, SKUs)
- No dynamic code execution (`eval`, `exec`) anywhere in the codebase
- URL parameters safely encoded via axios (no string concatenation)

### Access control

- Account-type filtering ensures vendor tools are inaccessible in seller mode and vice versa
- Mock mode blocked in production (`NODE_ENV=production` guard)
- Error responses sanitized — only safe fields returned (error codes, request IDs)

### Dependency security

- All dependencies pinned with version ranges limited to patch updates
- Zero known vulnerabilities in dependency tree (verified via `npm audit`)
- Minimal dependency footprint (5 production dependencies)

---

## Cost considerations

### Phase 1 (local deployment)

| Component | Cost |
|-----------|------|
| MCP server | $0 (runs locally) |
| SP-API access | Free (included with seller/vendor account) |
| AI agent (Quick Desktop) | Included with Amazon Quick subscription |

### Phase 2 (AWS-hosted deployment)

| AWS Service | Purpose | Estimated Monthly Cost |
|-------------|---------|----------------------|
| ECS Fargate | MCP server runtime | $30–60 per tenant |
| API Gateway | SSE endpoint | ~$3.50 per million requests |
| Secrets Manager | Per-tenant credentials | $0.40 per secret |
| CloudWatch | Logging and metrics | $5–10 |
| X-Ray | Distributed tracing | ~$5 per 100K traces |

---

## Continuously improving and optimizing

### Monitoring and observability

- Track tool invocation frequency to identify high-value operations
- Monitor rate limit headroom per API domain
- Alert on authentication failures (potential credential rotation needed)
- Measure p95 latency per tool to identify degradation

### Extending coverage

- New SP-API versions can be added without architectural changes
- Each API maps to a tool file; adding a new API is a single-file addition
- Schema definitions auto-generate from SP-API OpenAPI models (future)

### Performance optimization

- Consider caching for read-heavy, slowly-changing data (catalog items, product types)
- Implement report result caching with TTL for frequently-requested reports
- Use Data Kiosk for aggregated analytics instead of per-order API calls

---

## Resources

- [Amazon Selling Partner API documentation](https://developer-docs.amazon.com/sp-api/docs/welcome)
- [SP-API models (GitHub)](https://github.com/amzn/selling-partner-api-models)
- [Model Context Protocol specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Amazon Quick MCP integration docs](https://docs.aws.amazon.com/quick/latest/userguide/mcp-integration.html)
- [AWS Prescriptive Guidance: Enabling business reporting for selling partners](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-gen-ai-selling-partner-api/introduction.html)

---

## Document history

| Date | Description |
|------|-------------|
| June 2026 | Initial publication — Phase 1 implementation with 121 tools, mock mode, security hardening |

---

*© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.*
