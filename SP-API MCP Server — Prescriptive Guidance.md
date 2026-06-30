# Enabling Agentic AI for Amazon Sellers and Vendors with Model Context Protocol (MCP)

Manikanta Gona Grafsgaard (Amazon Web Services)

June 2026 ([document history](#document-history))

---

## What this guide helps you do

This guide walks you through connecting Amazon Quick (an AI-powered assistant) to your Amazon Seller Central or Vendor Central account — so you can manage your Amazon business by asking questions in plain English instead of navigating complex dashboards or writing code.

By the end of this guide, you will:

1. Have a working MCP server running on your machine
2. See it connected to Amazon Quick Desktop with 105+ seller tools (or 121 for both seller + vendor)
3. Ask natural-language questions and receive real-time data from your Amazon account

**Time to complete:** 30–45 minutes (includes build time and Amazon Quick configuration).

---

## Who should read this

| Role | What you'll get from this guide |
|------|--------------------------------|
| **Solution Architect** | Understand the architecture, evaluate fit for your organization, run a working demo |
| **Business Stakeholder** | See what the experience looks like in Amazon Quick, understand business value |
| **Developer** | Clone, build, and extend the MCP server for your specific use cases |
| **Selling Partner** | Connect your Seller/Vendor Central data to an AI assistant for daily operations |

---

## Business overview

Amazon selling partners — both vendors (1P) and third-party sellers (3P) — manage complex daily operations spanning order management, inventory planning, pricing strategy, fulfillment logistics, and financial reconciliation. The Amazon Selling Partner API (SP-API) provides programmatic access to over 50 APIs covering these domains, but interacting with them today requires:

- Deep technical expertise in REST APIs and OAuth2 authentication
- Custom-built integrations for each operational workflow
- Constant maintenance as APIs evolve across versions
- Per-API rate limit management to avoid throttling
- Separate tooling for sellers vs. vendors

This creates a gap: **the people who need the data (operations managers, brand managers, finance teams) cannot access it without developer support.**

---

## Solution overview

The SP-API MCP Server bridges this gap by providing an **agentic AI interface** to all Amazon selling partner data. Using the Model Context Protocol (MCP) — an open standard for AI-to-tool communication — the server enables AI agents like Amazon Quick to autonomously discover, select, and invoke the correct SP-API operation based on a natural language request.

Rather than building point-to-point integrations for each use case, you deploy one MCP server that exposes all 51 SP-APIs (121 operations) as structured tools. Any MCP-compatible AI client can instantly discover and use them.

### How it works (simplified)

```
Selling Partner ──► Amazon Quick ──► SP-API MCP Server ──► Amazon SP-API
  (asks question)     (AI agent)       (tool execution)      (returns data)
```

1. User asks a business question in natural language
2. The AI agent reasons about which SP-API operation to call and what parameters to use
3. The MCP server executes the API call with proper auth, rate limiting, and error handling
4. Results are returned to the user in a formatted, actionable response

---

## Business outcomes

### For sellers (3P)

| Outcome | How |
|---------|-----|
| **Faster operational decisions** | Get order status, inventory levels, and pricing data in seconds — not minutes of dashboard navigation |
| **Reduced stock-outs** | Ask "Which SKUs are running low?" instead of manually checking inventory reports |
| **Optimized pricing** | Instantly check Buy Box status and competitive offers across your catalog |
| **Automated reporting** | Generate and download SP-API reports through conversation — no scripts needed |
| **Fulfillment visibility** | Track FBA shipments, MCF orders, and merchant-fulfilled packages in one place |
| **Financial clarity** | Ask for transactions, fees, and settlements without navigating the Payments dashboard |

### For vendors (1P)

| Outcome | How |
|---------|-----|
| **PO processing speed** | View, acknowledge, and manage purchase orders conversationally |
| **Shipment automation** | Submit ASNs and track shipment confirmations without EDI expertise |
| **Invoice management** | Submit invoices and check payment status through natural language |
| **Direct fulfillment ops** | Manage drop-ship orders, shipping labels, and packing slips in one interface |
| **Transaction visibility** | Check async operation status across all vendor workflows |

### For organizations operating both (1P + 3P)

| Outcome | How |
|---------|-----|
| **Unified view** | One interface for both Seller Central and Vendor Central data |
| **Role-based access** | Configure as "seller", "vendor", or "both" — tools filter automatically |
| **Cross-functional collaboration** | Non-technical team members can self-serve data that previously required developer support |

### Quantified impact (estimated)

| Metric | Before (manual) | After (MCP + Quick) |
|--------|----------------|---------------------|
| Time to answer an operational question | 3–10 minutes | 5–10 seconds |
| Custom scripts maintained per team | 10–30 | 0 (server handles all APIs) |
| Developer hours on reporting automation/month | 40–80 hrs | 2–4 hrs (maintenance only) |
| API error rate (429 / throttling) | 5–15% | <1% (built-in rate limiting) |
| Onboarding time for new team member | Days (learn APIs) | Minutes (ask questions) |

---

## Key capabilities

| Capability | What it means for you |
|------------|----------------------|
| **121 tools across 51 APIs** | Every SP-API operation is accessible — orders, inventory, pricing, reports, feeds, vendor POs, shipments, catalog, listings, A+ content, Data Kiosk, and more |
| **Dual-mode (Seller / Vendor / Both)** | Configure once — only relevant tools appear. Vendors don't see seller tools and vice versa |
| **Composite tools** | Multi-step workflows happen automatically: create report → poll until done → return parsed data. One question, full lifecycle. |
| **Intelligent rate limiting** | Requests queue instead of failing. You never see "429 Too Many Requests" errors. |
| **Auto-pagination** | Large result sets (hundreds of orders) fetched automatically with a configurable safety cap |
| **Security hardened** | TLS 1.2+, credentials never exposed, race-safe auth, sanitized errors, zero dependency vulnerabilities |

---

## What is MCP and why does it matter?

**Model Context Protocol (MCP)** is an open standard that lets AI assistants (like Amazon Quick, Claude, or Kiro) connect to external tools and data sources. Think of it as a universal adapter between AI and APIs.

**Without MCP:** You need custom code, scripts, or manual dashboard navigation to get data from Amazon's Selling Partner API (SP-API).

**With MCP:** You ask Amazon Quick "What are my unshipped orders?" and it automatically calls the right API, handles authentication, manages rate limits, and returns the answer in seconds.

The SP-API MCP server wraps **all 51 Amazon SP-APIs** (121 operations) into this single interface.

---

## What you'll need (prerequisites)

All of the following are required before you begin:

| # | Requirement | How to get it | Verification |
|---|-------------|---------------|--------------|
| 1 | **Node.js 18+** | [nodejs.org](https://nodejs.org/) → download LTS. Mac: `brew install node@20` | `node --version` → v18+ |
| 2 | **Git** | Mac: `xcode-select --install`. Windows: [git-scm.com](https://git-scm.com/) | `git --version` |
| 3 | **Amazon Seller or Vendor account** | [Seller Central](https://sellercentral.amazon.com/) (Professional plan, $39.99/mo) or existing Vendor Central | Can sign in to Seller/Vendor Central |
| 4 | **SP-API developer registration** | Seller Central → Apps & Services → Develop Apps → Register (1–5 days approval) | Developer status shows "Approved" |
| 5 | **SP-API application credentials** | Create app → get `client_id` + `client_secret` | Have both values saved |
| 6 | **SP-API refresh token** | Manage Your Apps → Authorize → Generate refresh token | Have `Atzr\|...` token saved |
| 7 | **Amazon Quick Desktop** | [Download here](https://aws.amazon.com/quicksight/q/desktop/) — requires Amazon Quick Enterprise subscription | App installed, MCP tab visible in Settings |

> **Don't have SP-API credentials yet?** Follow the detailed walkthrough in [Appendix A: SP-API credential setup](#appendix-a-sp-api-credential-setup) to obtain your `client_id`, `client_secret`, and `refresh_token`.

---

## Step-by-step: Get it running

### Step 1 — Clone the project

Open your Terminal (Mac) or Command Prompt (Windows) and run:

```bash
git clone git@ssh.code.aws.dev:personal_projects/alias_m/mggona/amazon_selling_partner_mcp_server.git
cd amazon_selling_partner_mcp_server/sp-api-mcp
```

> **If clone fails with "Permission denied":** This repo requires Midway-signed SSH keys. Run `mwinit -s --fido2` to authenticate, then retry. For external access, contact the repository owner.

### Step 2 — Install and build

```bash
npm install
npm run build
```

This takes about 30 seconds. When done, verify:

```bash
ls dist/index.js
```

If you see the file listed, you're ready.

### Step 3 — Configure your credentials

Create your config file:

```bash
cp config.example.json config.json
```

Edit `config.json` with your SP-API credentials:

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
    "client_id": "amzn1.application-oa2-client.YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "refresh_token": "Atzr|YOUR_REFRESH_TOKEN"
  },
  "options": {
    "sandbox_mode": false,
    "auto_paginate": true,
    "max_total_results": 1000,
    "log_level": "info"
  }
}
```

**Configuration options:**
- `account_type`: Set to `"seller"`, `"vendor"`, or `"both"` depending on your account
- `marketplace_ids`: Use the correct ID for your marketplace (see [Marketplace IDs reference](#marketplace-ids-reference))
- `sandbox_mode`: Set to `true` to test against SP-API sandbox without affecting production data

> **Security:** `config.json` is in `.gitignore` — it will never be committed to version control.

### Step 4 — Verify the server connects to SP-API

Test the server starts and can authenticate:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"spapi_health_check","arguments":{}}}' \
| node dist/index.js --config ./config.json --mode local 2>/dev/null
```

You should see:
- A valid MCP handshake response
- Health check showing `"valid": true` — confirming your credentials work

If you see `"valid": false` or an auth error, double-check your `client_id`, `client_secret`, and `refresh_token` in config.json.

### Step 5 — Create a space-free path

Amazon Quick Desktop has trouble with folder paths that contain spaces. Create a shortcut:

```bash
ln -sfn "$(pwd)" ~/sp-api-mcp
```

Verify:
```bash
ls ~/sp-api-mcp/dist/index.js
```

### Step 6 — Connect to Amazon Quick Desktop

1. Open **Amazon Quick Desktop**
2. Click **Settings** (gear icon) → **Capabilities** → **MCP** tab
3. Click **+ Add MCP**
4. Select **Local** connection type
5. Fill in:

| Field | What to enter |
|-------|---------------|
| **Name** | `SP-API MCP Server` |
| **Command** | `node` |
| **Arguments** | `~/sp-api-mcp/dist/index.js --config ~/sp-api-mcp/config.json --mode local` |
| **Description** | `Amazon Selling Partner API — orders, inventory, pricing, reports, vendor POs` |
| **Timeout** | `30` |

> **If `~/` doesn't work**, use the full path: `/Users/YOUR_USERNAME/sp-api-mcp/dist/index.js --config /Users/YOUR_USERNAME/sp-api-mcp/config.json --mode local`

6. Click **+ Add MCP** to save

### Step 7 — Verify tools appear

After saving, you should see:

```
SP-API MCP Server
105 tools • Connected       (if account_type = "seller")
121 tools • Connected       (if account_type = "both")
```

If you see **0 tools**:
- Use the full absolute path (not `~/`)
- Ensure Node.js is accessible: run `which node` and use that full path as the Command field
- Try using `bash` as the command with `~/sp-api-mcp/start-server.sh` as the argument

### Step 8 — Start asking questions about your business

Open a new chat in Amazon Quick and try:

```
Show me my recent orders
```

Quick will call the SP-API through your MCP server and return your **real Seller Central data**.

---

## What the experience looks like

The following examples show what appears in Amazon Quick when you ask questions about your selling partner data. The actual values will reflect your real account data.

---

### "Show me my recent orders"

Quick calls `spapi_orders_get_orders` and responds:

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

### "What's my FBA inventory?"

Quick calls `spapi_fba_inventory_get_summaries` and responds:

> | SKU | Product | Fulfillable | Inbound | Reserved |
> |-----|---------|-------------|---------|----------|
> | SKU-WIDGET-001 | Premium Widget Pro - Blue | 150 | 75 | 10 |
> | SKU-GADGET-002 | Gadget Accessory Pack | 320 | 100 | 5 |
>
> Both SKUs are well-stocked. SKU-WIDGET-001 has 75 units inbound to FBA fulfillment centers.

---

### "Am I winning the Buy Box for ASIN B08N5WRWNW?"

Quick calls `spapi_pricing_get_competitive_pricing` and responds:

> ✅ **Yes, you're winning the Buy Box**
>
> - Your price: **$19.99** (New condition)
> - Competing offers: 5 other sellers
> - Landed price: $19.99
>
> You're the current Buy Box winner with 4 other sellers competing on this ASIN.

---

### "Show me items in order 111-1234567-1234567"

Quick calls `spapi_orders_get_order_items` and responds:

> **Order 111-1234567-1234567 — Line Items:**
>
> | ASIN | Product | Qty | Price | Tax |
> |------|---------|-----|-------|-----|
> | B08N5WRWNW | Premium Widget Pro - Blue | 2 | $39.98 | $3.60 |
> | B09K3LXYZ1 | Gadget Accessory Pack | 1 | $10.01 | $0.90 |
>
> **Order total:** $49.99 + $4.50 tax

---

### "What are my sales metrics this week?"

Quick calls `spapi_sales_get_order_metrics` and responds:

> **Sales Summary (Jun 15–22, 2026):**
>
> - Total Revenue: **$1,151.50**
> - Units Ordered: 47
> - Orders: 38
> - Avg. Unit Price: $24.50
>
> Tracking well — 38 orders with ~$30 average cart value.

---

### "Show me my financial transactions from June"

Quick calls `spapi_finances_list_transactions` and responds:

> | Date | Type | Description | Amount |
> |------|------|-------------|--------|
> | Jun 20 | Order | Payment: 111-1234567-1234567 | +$49.99 |
> | Jun 19 | Refund | Refund: 111-5555555-5555555 | -$24.99 |
> | Jun 18 | Fee | FBA fee | -$3.75 |
>
> **Net:** +$21.25 across 3 transactions.

---

### "Show me pending vendor purchase orders" (Vendor mode)

Quick calls `spapi_vendor_orders_get_purchase_orders` and responds:

> | PO Number | Date | Status | Item | Units | Cost |
> |-----------|------|--------|------|-------|------|
> | PO-2026-001234 | Jun 18 | New | B08N5WRWNW | 500 | $5.00/ea |
> | PO-2026-001235 | Jun 15 | Acknowledged | B09K3LXYZ1 | 200 | $8.50/ea |
>
> **1 new PO needs acknowledgement** (PO-2026-001234 for 500 units). Want me to accept it?

---

### "Check the server health"

Quick calls `spapi_health_check` and responds:

> | Component | Status |
> |-----------|--------|
> | Server | ✅ Healthy |
> | Authentication | ✅ Valid (expires in 60 min) |
> | Rate Limits | ✅ All clear |
>
> Everything operational.

---

### "Search the catalog for widgets"

Quick calls `spapi_catalog_search_items` and responds:

> | ASIN | Product | Brand |
> |------|---------|-------|
> | B08N5WRWNW | Premium Widget Pro - Blue | WidgetCo |
> | B09K3LXYZ1 | Gadget Accessory Pack | GadgetCorp |
>
> Found 2 items. Want details on either?

---

### Error example: "Show me vendor POs" (when configured as seller-only)

Quick recognizes the tool isn't available and responds:

> ⚠️ **Not available for your account type**
>
> Vendor purchase order tools require `account_type: "vendor"` or `"both"`. You're configured as **seller** only.
>
> To fix: update config.json or ask "What's my current account type?" for details.

---

## How it works (architecture)

```
┌────────────┐          ┌─────────────────────────────────────────────────┐
│            │  stdio   │            SP-API MCP Server                     │
│  Amazon    │◄────────►│                                                 │
│  Quick     │ JSON-RPC │  Tool Registry ──► API Client ──► Auth Module   │
│  Desktop   │          │  (121 tools)       (rate limit)   (OAuth2)      │
│            │          │                    (retry 3x)     (auto-refresh)│
└────────────┘          └──────────────────────┬──────────────────────────┘
                                               │ HTTPS (TLS 1.2+)
                                               ▼
                                    Amazon SP-API Endpoints
                                    (51 APIs, 3 regions)
```

**What happens when you ask a question:**

1. You type a question in Amazon Quick ("What are my unshipped orders?")
2. Quick's AI model decides which MCP tool to call (`spapi_orders_get_orders`) and what parameters to pass (`orderStatuses=["Unshipped"]`)
3. Quick sends a JSON-RPC request to the MCP server over stdio
4. The MCP server validates inputs, checks rate limits, calls SP-API with proper authentication
5. SP-API returns data → server formats it → returns to Quick
6. Quick's AI formats the raw data into a readable answer for you

All of this happens in 2–5 seconds.

---

---

## Marketplace IDs reference

Use these marketplace IDs in your config depending on where you sell:

| Marketplace | ID | Region |
|-------------|-----|--------|
| United States | ATVPDKIKX0DER | NA |
| Canada | A2EUQ1WTGCTBG2 | NA |
| Mexico | A1AM78C64UM0Y8 | NA |
| United Kingdom | A1F83G8C2ARO7P | EU |
| Germany | A1PA6795UKMFR9 | EU |
| France | A13V1IB3VIYZZH | EU |
| Italy | APJ6JRA9NG5V4 | EU |
| Spain | A1RKKUPIHCS9HS | EU |
| Japan | A1VC38T7YXB528 | FE |
| Australia | A39IBJ37TRP1C6 | FE |
| India | A21TJRUUN4KGV | EU |

---

## Security summary

| Concern | How it's handled |
|---------|-----------------|
| Credentials in logs? | Never — logged to stderr only, credentials masked |
| Token expiry? | Auto-refreshed 5 minutes before expiry, race-condition safe |
| Rate limiting? | Per-API queue-before-fail — requests wait instead of erroring |
| TLS? | TLS 1.2+ explicitly enforced (not just defaulted) |
| Mock mode in production? | Not applicable — server requires valid credentials to operate |
| Dependencies? | Zero known vulnerabilities (npm audit clean) |
| Input validation? | All parameters validated via Zod schemas before API calls |
| PII access? | Restricted Data Tokens required — PII not returned by default |

---

## Cost

| What | Cost |
|------|------|
| MCP server (runs on your laptop) | $0 |
| SP-API access | Free with seller/vendor account |
| Amazon Quick Desktop | Included with Enterprise subscription |
| **Total for Phase 1** | **$0 incremental** |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **0 tools after adding to Quick** | Use full absolute path (no `~/` or spaces). Try `/Users/yourname/sp-api-mcp/dist/index.js` |
| **"command not found: node"** | Quick can't find node. Use full path: run `which node` and use that as the Command field |
| **Build fails** | Ensure Node.js 18+. Run `node --version` to check. |
| **Permission denied on clone** | Need Midway SSH auth: `mwinit -s --fido2` |
| **Vendor tools not showing** | Config has `"account_type": "seller"`. Change to `"both"` to see all 121 tools |
| **"Tool not found" error** | Tool is filtered by account type. Ask "What's my account type?" to verify |
| **Server starts but Quick doesn't connect** | Toggle the MCP server off/on in Quick settings. Or restart Quick. |

---

## What's next

| Phase | What | When |
|-------|------|------|
| ✅ Phase 1 | Local MCP server with real SP-API data, Quick Desktop integration | Done |
| Phase 2 | Multi-account support (multiple seller/vendor accounts in one server) | Next |
| Phase 3 | AWS cloud deployment (ECS Fargate, multi-user, Quick Web support) | Future |
| Phase 4 | Multi-marketplace aggregation ("inventory across all regions") | Future |

---

## Resources

| Resource | Link |
|----------|------|
| Amazon Selling Partner API docs | [developer-docs.amazon.com/sp-api](https://developer-docs.amazon.com/sp-api/docs/welcome) |
| SP-API models (OpenAPI specs) | [github.com/amzn/selling-partner-api-models](https://github.com/amzn/selling-partner-api-models) |
| Model Context Protocol spec | [modelcontextprotocol.io](https://modelcontextprotocol.io/) |
| MCP TypeScript SDK | [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| Amazon Quick MCP integration | [docs.aws.amazon.com/quick/.../mcp-integration](https://docs.aws.amazon.com/quick/latest/userguide/mcp-integration.html) |
| AWS Prescriptive Guidance: SP-API + GenAI | [docs.aws.amazon.com/prescriptive-guidance/.../introduction](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-gen-ai-selling-partner-api/introduction.html) |

---

## Appendix A: SP-API credential setup

This appendix walks you through getting the three credentials needed for real data access: `client_id`, `client_secret`, and `refresh_token`.

### A.1 — Register as an SP-API developer

1. Sign in to [Seller Central](https://sellercentral.amazon.com/) with your selling account
2. Go to **Apps & Services → Develop Apps**
3. Click **Proceed to Developer Registration**
4. Fill in:
   - **Developer name:** Your company name
   - **Data access type:** Select all APIs you plan to use
   - **Use case:** "AI-powered operations assistant using Model Context Protocol"
5. Accept the Marketplace Developer Agreement
6. Submit — approval takes 1–5 business days

### A.2 — Create an SP-API application

After developer approval:

1. Go to **Apps & Services → Develop Apps**
2. Click **Add new app client**
3. Select **SP API**
4. Name it (e.g., "SP-API MCP Server")
5. Choose IAM ARN (if using AWS role-based auth) or skip for self-authorization
6. Select required API roles (Orders, Inventory, Pricing, etc.)
7. Save — you receive:
   - **LWA Client ID** (`client_id`): looks like `amzn1.application-oa2-client.xxxxxxx`
   - **LWA Client Secret** (`client_secret`): a long alphanumeric string

### A.3 — Generate a refresh token (self-authorization)

This grants your own app access to your own account data:

1. Go to **Apps & Services → Manage Your Apps**
2. Find your app → click **Authorize**
3. On the authorization page, click **Generate refresh token**
4. Copy the token — it looks like `Atzr|IwEBIxxxxxxxxxxx...`

> **Store securely.** This token grants full access to your selling partner data. Treat it like a password.

### A.4 — Which endpoint to use

| Your marketplaces | Region | Endpoint |
|-------------------|--------|----------|
| US, Canada, Mexico, Brazil | NA | `https://sellingpartnerapi-na.amazon.com` |
| UK, Germany, France, Italy, Spain, etc. | EU | `https://sellingpartnerapi-eu.amazon.com` |
| Japan, Australia, Singapore | FE | `https://sellingpartnerapi-fe.amazon.com` |

### A.5 — Verify it works

After adding credentials to `config.json`, verify the connection works:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"spapi_health_check","arguments":{}}}' \
| node ~/sp-api-mcp/dist/index.js --config ~/sp-api-mcp/config.json --mode local 2>/dev/null
```

If health check returns `"valid": true`, your credentials are working and you're ready to use real data in Amazon Quick.

---

## Document history

| Date | Description |
|------|-------------|
| June 2026 | Initial publication — Phase 1 with 121 tools, security hardening, Amazon Quick Desktop integration |

---

*© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.*
