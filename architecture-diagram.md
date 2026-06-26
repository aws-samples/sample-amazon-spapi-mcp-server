# SP-API MCP Server — Architecture Diagrams

---

## V1 — Local Deployment (Current Build)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│  V1 — LOCAL MODE (Phase 1)                                User's Machine                │
│                                                                                         │
│                                                                                         │
│   ┌──────────────┐         ┌──────────────┐       ┌──────────────────────────────────┐  │
│   │              │         │              │       │        SP-API MCP Server          │  │
│   │   Selling    │────────►│    Vendor    │       │                                  │  │
│   │   Partner    │  Auth   │    Central   │       │  ┌────────────────────────────┐  │  │
│   │   (User)     │         │   / Seller   │       │  │     MCP Protocol Layer     │  │  │
│   │              │         │    Central   │       │  │     (stdio transport)       │  │  │
│   └──────────────┘         └──────┬───────┘       │  └─────────────┬──────────────┘  │  │
│                                   │               │                │                  │  │
│                                   │               │  ┌─────────────▼──────────────┐  │  │
│                                   │               │  │      Tool Registry         │  │  │
│   ┌──────────────────────────┐    │               │  │  ┌─────┐┌──────┐┌──────┐  │  │  │
│   │                          │    │               │  │  │Sellr││Vendor││Shared│  │  │  │
│   │     Amazon Quick         │    │               │  │  │ 63  ││  16  ││  42  │  │  │  │
│   │     Desktop              │◄───┼── stdio ─────►│  │  └─────┘└──────┘└──────┘  │  │  │
│   │                          │    │               │  │       121 tools total       │  │  │
│   │  "Show me my orders"     │    │               │  └────────────────────────────┘  │  │
│   │  "Check inventory"       │    │               │                │                  │  │
│   │  "Get vendor POs"        │    │               │  ┌─────────────▼──────────────┐  │  │
│   │                          │    │               │  │       API Client           │  │  │
│   └──────────────────────────┘    │               │  │  • Rate Limiter            │  │  │
│                                   │               │  │  • Retry (3x backoff)      │  │  │
│                                   │               │  │  • Auto-pagination         │  │  │
│                                   │               │  │  • TLS 1.2+ enforced       │  │  │
│                                   │               │  └─────────────┬──────────────┘  │  │
│                                   │               │                │                  │  │
│                                   │               │  ┌─────────────▼──────────────┐  │  │
│                                   │               │  │       Auth Module          │  │  │
│                                   │               │  │  • LWA OAuth2              │  │  │
│                                   │               │  │  • Token auto-refresh      │  │  │
│                                   │               │  │  • RDT for PII             │  │  │
│                                   │               │  │  • Race-condition safe     │  │  │
│                                   │               │  └─────────────┬──────────────┘  │  │
│                                   │               │                │                  │  │
│                                   │               └────────────────┼──────────────────┘  │
│                                   │                                │                     │
└───────────────────────────────────┼────────────────────────────────┼─────────────────────┘
                                    │                                │
                                    │                                │ HTTPS
                                    │                                ▼
                                    │               ┌──────────────────────────────────┐
                                    │               │                                  │
                                    └──────────────►│      Amazon SP-API Endpoints     │
                                                    │                                  │
                                                    │  • sellingpartnerapi-na.amazon   │
                                                    │  • sellingpartnerapi-eu.amazon   │
                                                    │  • sellingpartnerapi-fe.amazon   │
                                                    │                                  │
                                                    │  51 APIs │ 121 Operations        │
                                                    │                                  │
                                                    └──────────────────────────────────┘
```

---

## V2 — AWS Cloud Deployment (Phase 2 — Planned)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│  V2 — AWS-HOSTED MODE (Phase 2)                                                        │
│                                                                                         │
│                                                                                         │
│   ┌──────────────┐                          ┌────────────────────────────────────────┐  │
│   │              │                          │              AWS Account               │  │
│   │   Selling    │                          │                                        │  │
│   │   Partner    │         ┌────────────┐   │  ┌─────────┐    ┌──────────────────┐  │  │
│   │   (User)     │────────►│  Amazon    │   │  │   API   │    │  SP-API MCP      │  │  │
│   │              │         │  Quick     │   │  │ Gateway  │    │  Server (ECS     │  │  │
│   └──────────────┘         │  Desktop   │───┼─►│  (SSE/  │───►│  Fargate)        │  │  │
│                            │    or      │   │  │  HTTP)   │    │                  │  │  │
│                            │  Quick Web │   │  └─────────┘    │  Same 121 tools  │  │  │
│                            └────────────┘   │                  │  Same core logic  │  │  │
│                                             │                  └────────┬─────────┘  │  │
│                                             │                           │             │  │
│                                             │          ┌────────────────┼──────────┐  │  │
│                                             │          │                │          │  │  │
│   ┌──────────────┐                          │  ┌───────▼──────┐ ┌──────▼───────┐  │  │  │
│   │              │                          │  │   Secrets     │ │  CloudWatch  │  │  │  │
│   │  Additional  │                          │  │   Manager     │ │  + X-Ray     │  │  │  │
│   │  Quick Users │──── SSE/HTTP ────────────┼─►│  (per-tenant  │ │  (logging &  │  │  │  │
│   │  (Multi-     │                          │  │  credentials) │ │   tracing)   │  │  │  │
│   │   tenant)    │                          │  └───────────────┘ └──────────────┘  │  │  │
│   │              │                          │                                        │  │  │
│   └──────────────┘                          │  ┌───────────────┐ ┌──────────────┐  │  │  │
│                                             │  │  Auto-scaling  │ │     WAF      │  │  │  │
│                                             │  │  (connections) │ │  (optional)  │  │  │  │
│                                             │  └───────────────┘ └──────────────┘  │  │  │
│                                             │                                        │  │  │
│                                             └────────────────────────┬───────────────┘  │  │
│                                                                      │                  │
└──────────────────────────────────────────────────────────────────────┼──────────────────┘
                                                                       │
                                                                       │ HTTPS
                                                                       ▼
                                                      ┌──────────────────────────────────┐
                                                      │                                  │
                                                      │      Amazon SP-API Endpoints     │
                                                      │                                  │
                                                      │  • Orders, Inventory, Pricing    │
                                                      │  • Reports, Feeds, Data Kiosk    │
                                                      │  • Vendor Orders, Shipments      │
                                                      │  • Catalog, Listings, A+         │
                                                      │  • Notifications, Finances       │
                                                      │                                  │
                                                      └──────────────────────────────────┘
```

---

## Data Flow — Single Request Lifecycle

```
┌─────────┐    Natural     ┌──────────┐    JSON-RPC     ┌──────────────┐     HTTPS      ┌─────────┐
│         │   Language     │          │   (MCP stdio)   │              │   (TLS 1.2+)   │         │
│  User   │───────────────►│  Amazon  │────────────────►│  SP-API MCP  │───────────────►│  SP-API │
│         │                │  Quick   │                 │  Server       │                │  Amazon │
│         │◄───────────────│          │◄────────────────│              │◄───────────────│         │
│         │   Formatted    │          │   Tool result   │              │   JSON resp    │         │
│         │   answer       │          │   (JSON)        │              │                │         │
└─────────┘                └──────────┘                 └──────────────┘                └─────────┘

Example:
  User: "What's my FBA inventory for SKU-WIDGET-001?"
    → Quick selects: spapi_fba_inventory_get_summaries
    → MCP Server: GET /fba/inventory/v1/summaries?sellerSkus=SKU-WIDGET-001
    → SP-API returns: { fulfillableQuantity: 150, inbound: 50, reserved: 10 }
    → Quick formats: "SKU-WIDGET-001 has 150 fulfillable units, 50 inbound, 10 reserved"
```

---

## Component Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                    SP-API MCP Server                            │
│                                                                │
│  src/                                                          │
│  ├── index.ts ─────────────── Entry point & CLI args           │
│  │                                                             │
│  ├── transport/                                                │
│  │   └── stdio.ts ────────── MCP JSON-RPC over stdin/stdout    │
│  │                                                             │
│  ├── config/                                                   │
│  │   ├── schema.ts ──────── Zod validation schemas             │
│  │   └── loader.ts ──────── JSON config file loader            │
│  │                                                             │
│  ├── auth/                                                     │
│  │   ├── interface.ts ───── CredentialProvider contract         │
│  │   ├── local-provider.ts  LWA OAuth2 + token refresh         │
│  │   └── mock-provider.ts   Fake tokens for testing            │
│  │                                                             │
│  ├── clients/                                                  │
│  │   ├── sp-api-client.ts   HTTP client + rate limiter         │
│  │   ├── mock-client.ts ─── Returns fake data (no network)     │
│  │   ├── mock-data.ts ───── Realistic mock responses           │
│  │   └── errors.ts ──────── Error taxonomy (9 categories)      │
│  │                                                             │
│  ├── tools/                                                    │
│  │   ├── registry.ts ────── Dynamic tool filtering by acct     │
│  │   ├── base.ts ────────── Tool interface + JSON Schema gen   │
│  │   ├── meta/ ──────────── health_check, get_config, rate_lim │
│  │   ├── seller/ (23 files)  63 seller tools                   │
│  │   ├── shared/ (14 files)  42 shared tools                   │
│  │   └── vendor/ (8 files)   16 vendor tools                   │
│  │                                                             │
│  └── utils/                                                    │
│      ├── logger.ts ──────── Pino (stderr, not stdout)          │
│      └── validators.ts ──── ID format validators               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## V1 vs V2 Comparison

```
                    V1 (Local)                          V2 (Cloud)
                ┌──────────────────┐             ┌──────────────────────┐
  Transport     │  stdio           │             │  SSE / HTTP Stream   │
  Deployment    │  User's machine  │             │  ECS Fargate         │
  Users         │  1 (developer)   │             │  N (multi-tenant)    │
  Credentials   │  config.json     │             │  Secrets Manager     │
  Monitoring    │  stderr logs     │             │  CloudWatch + X-Ray  │
  Scaling       │  Single process  │             │  Auto-scaling        │
  Cost          │  $0              │             │  ~$30-60/mo/tenant   │
                └────────┬─────────┘             └──────────┬───────────┘
                         │                                  │
                         │        ┌──────────────┐          │
                         └───────►│  Same Core   │◄─────────┘
                                  │  121 Tools   │
                                  │  Same Auth   │
                                  │  Same Logic  │
                                  └──────────────┘
```
