# SP-API MCP Server — 1-Pager & PR/FAQ

---

## Press Release

### Enabling Agentic AI for Amazon Sellers and Vendors with Model Context Protocol (MCP)

**SEATTLE — June 2026** — Today we announce the SP-API MCP Server, an open-source Model Context Protocol server that gives AI agents direct access to all 51 Amazon Selling Partner APIs through natural language. Amazon sellers and vendors can now ask questions like "Show me my unshipped orders," "What's my FBA inventory for SKU-WIDGET-001?" or "Accept all new purchase orders" — and the AI agent autonomously selects the correct API, handles authentication, manages rate limits, and returns structured results.

The SP-API MCP Server eliminates the need for sellers and vendors to build custom API integrations, write code, or understand complex authentication flows. By connecting to Amazon Quick Desktop, users interact with their Seller Central and Vendor Central data conversationally — the same way they'd ask a colleague for a status update.

**"Managing our Amazon business used to require switching between dozens of Seller Central screens and writing custom scripts for every reporting need,"** said a pilot user. **"Now I just ask Quick a question and get the answer instantly. It's like having a developer on staff who knows every Amazon API."**

The server supports dual-mode operation — sellers see 105 tools covering orders, inventory, pricing, fulfillment, shipping, and reporting; vendors see 58 tools covering purchase orders, shipments, invoices, and direct fulfillment; businesses operating as both get all 121 tools. Account-type filtering happens automatically based on configuration.

Key capabilities include:
- **121 tools** spanning all SP-API operations (orders, inventory, catalog, pricing, reports, feeds, listings, notifications, vendor POs, shipments, invoices, Data Kiosk GraphQL, A+ content, and more)
- **Composite tools** that handle multi-step workflows automatically (create report → poll until done → return results)
- **Per-API rate limiting** that queues requests instead of failing, preventing throttling
- **Automatic token refresh** with race-condition-safe OAuth2 management
- **Mock mode** for testing without credentials — teams can validate integrations before going live
- **Security hardened** — TLS 1.2+, sanitized errors, credentials never exposed, pinned dependencies with zero known vulnerabilities

The SP-API MCP Server is available today as a local deployment (Phase 1) and will expand to AWS-hosted multi-tenant deployment and multi-marketplace support in subsequent phases.

---

## What We Built (Current State)

| Dimension | Details |
|-----------|---------|
| **Tool Count** | 121 MCP tools (63 seller, 16 vendor, 42 shared) |
| **API Coverage** | All 51 SP-APIs (29 seller-only, 9 vendor-only, 13 shared) |
| **Language** | TypeScript / Node.js |
| **MCP SDK** | @modelcontextprotocol/sdk v1.29 |
| **Transport** | stdio (local mode) |
| **Auth** | LWA OAuth2 with auto-refresh, RDT for PII |
| **Rate Limiting** | Per-API-domain via Bottleneck (queue-before-fail) |
| **Error Handling** | 9-category taxonomy with suggested recovery actions |
| **Testing** | Mock mode (--mock flag) returns realistic fake data |
| **Security** | TLS 1.2+ enforced, race-safe token refresh, sanitized errors, zero npm vulnerabilities |
| **Client** | Amazon Quick Desktop (local stdio connection) |
| **Config** | JSON config with Zod schema validation |

---

## Phased Roadmap

### Phase 1 — Local MCP Server ✅ (Complete)

**What:** Full MCP server running as a local Node.js subprocess connected to Amazon Quick Desktop via stdio.

**Delivered:**
- All 121 tools across 51 SP-APIs
- LWA OAuth2 authentication with automatic token refresh
- Per-API rate limiting with queue-before-fail
- Exponential backoff retry (3x) on transient errors
- Auto-pagination with configurable safety cap (max 1,000 results)
- Composite tools for async operations (Reports, Feeds, Data Kiosk)
- Account-type filtering (seller/vendor/both)
- Mock mode for credential-free testing
- Security hardened (TLS 1.2+, error sanitization, input validators)
- Amazon Quick Desktop integration (local stdio)

**Who uses it:** Individual sellers/vendors, developers, solution architects testing the concept.

---

### Phase 2 — Multi-Account Support (Next)

**What:** Single MCP server instance supports multiple named accounts (different seller/vendor accounts, different marketplaces) simultaneously.

**Planned:**
- Config holds array of named accounts with independent credentials
- Every tool accepts optional `account` parameter to target a specific account
- Default account with `spapi_switch_account` meta-tool
- `spapi_list_accounts` shows all configured accounts and their health
- Cross-account composite tools (`spapi_global_get_product_summary`) that query all accounts in parallel
- Per-account rate limiting (separate quotas per account)
- Per-account token management (independent refresh lifecycles)

**Who uses it:** Vendors with multiple account relationships (e.g., different brands or regions), agencies managing multiple seller accounts.

---

### Phase 3 — AWS Cloud Deployment (Production)

**What:** Move from local subprocess to cloud-hosted MCP server accessible via SSE/HTTP, supporting multi-tenant enterprise usage.

**Planned:**
- SSE transport layer (same core logic, swapped transport module)
- Deployed to ECS Fargate behind API Gateway
- Per-tenant credentials in AWS Secrets Manager
- OAuth 2.0 authentication for Amazon Quick Web integration
- CloudWatch logging + X-Ray distributed tracing
- Auto-scaling based on active connection count
- Zero-downtime rolling deployments
- WAF for IP filtering / rate limiting (optional)
- Infrastructure as Code (CDK)

**Who uses it:** Enterprise teams, multi-user organizations, ISVs building on SP-API.

---

### Phase 4 — Multi-Marketplace Expansion (Enterprise)

**What:** Support multiple marketplace regions simultaneously (NA + EU + FE) from a single MCP server instance.

**Planned:**
- Multiple simultaneous marketplace regions per account
- Cross-marketplace aggregation tools ("Show inventory across all regions")
- Marketplace-aware tool routing (user specifies target per request, or uses default)
- Region-specific API handling (Easy Ship = IN/JP, Delivery by Amazon = BR)
- Currency/locale handling in responses
- Time zone awareness for date-range queries
- Independent rate limiting per marketplace
- Consolidated reporting across regions

**Who uses it:** Global sellers/vendors operating in 5+ marketplaces, needing a unified operational view.

---

### Phase 5 — Data Persistence & Analytics Layer (Future)

**What:** Add a data ingestion pipeline that stores SP-API data for historical trend analysis, complementing the live query capability.

**Planned:**
- Scheduled data ingestion (Lambda + Step Functions → S3 data lake)
- Historical dashboards via Amazon QuickSight / Quick Q
- Year-over-year comparisons, seasonal trend analysis
- Anomaly detection (inventory drops, pricing changes, sales spikes)
- Integration with Amazon Q Business for enterprise knowledge base
- Event-driven architecture: SP-API notifications → real-time alerts

**Who uses it:** Data-driven selling partners who need historical analysis beyond Quick's 30-day chat retention.

---

## Frequently Asked Questions (FAQ)

### Customer FAQ

**Q: Do I need to be a developer to use this?**
A: No. Once the MCP server is set up (one-time configuration), you interact entirely through natural language in Amazon Quick. You ask questions in plain English and get answers — no coding required during daily use.

**Q: What Amazon accounts does this work with?**
A: Both third-party seller accounts (Seller Central) and first-party vendor accounts (Vendor Central). You configure which type you are, and the server automatically shows only the relevant tools.

**Q: Does this work with Amazon Quick Desktop, Quick Web, or both?**
A: Today it works with Amazon Quick Desktop via local connection (stdio). Quick Web support requires the Phase 3 cloud deployment (SSE transport). The core logic is identical — only the transport changes.

**Q: Can I use this without Amazon Quick?**
A: Yes. Any MCP-compatible client works — Claude Desktop, Kiro, or any tool supporting the MCP stdio transport standard.

**Q: Is my data safe? Does Amazon/AWS see my conversations?**
A: The MCP server runs locally on your machine. Your SP-API data flows directly from Amazon's endpoints to your computer. AWS explicitly states your Quick conversations are never used for AI model training. Credentials are never logged or returned in responses.

**Q: I have accounts in the US, UK, Germany, and Japan. Can I see all of them?**
A: In Phase 1 (today), you configure one account at a time. Phase 2 adds multi-account support where you can query all accounts in a single session. Phase 4 adds cross-marketplace aggregation — "Show me inventory for this ASIN across all regions" in one response.

**Q: What happens if Amazon's API is slow or rate-limited?**
A: The server handles this transparently. It queues requests when approaching rate limits (instead of failing), retries transient errors with exponential backoff, and auto-refreshes tokens before expiry. You never see 429 or 5xx errors — the server absorbs them.

**Q: What if I just want to test this but don't have SP-API credentials yet?**
A: Run with `--mock` flag. The server returns realistic fake data (orders, inventory, pricing, vendor POs) without making any real API calls. You can validate the entire Quick integration end-to-end with zero credentials.

**Q: How much does this cost?**
A: Phase 1 (local) costs $0 — it's open source, runs on your machine, and SP-API access is included with your Amazon selling account. Phase 3 (cloud) would cost approximately $30–60/month per tenant on AWS (ECS Fargate + API Gateway + Secrets Manager).

**Q: How long does it take to set up?**
A: From clone to first query in Amazon Quick: approximately 10–15 minutes. That includes npm install, build, configure the MCP server in Quick settings, and ask your first question.

---

### Internal/Stakeholder FAQ

**Q: Why MCP instead of a custom API or Bedrock agent?**
A: MCP is an open standard already supported by Amazon Quick, Claude, Kiro, and dozens of other AI clients. Building an MCP server means we get instant compatibility with all of them without custom integration work for each. It's also how Amazon Quick officially supports third-party tool access — through its MCP connector.

**Q: Why not use the existing APG data pipeline approach?**
A: They're complementary, not competing. The APG approach (Lambda + Step Functions → S3 → QuickSight) is for batch analytics and historical dashboards. Our MCP approach is for real-time, conversational, operational queries. "What are my orders right now?" vs. "Show me a 6-month sales trend chart." Most businesses need both.

**Q: What's the competitive landscape?**
A: We found one existing SP-API MCP project (jay-trivedi/amazon_sp_mcp) — it covers ~15 tools across 5 APIs and is still in early development (Phase 1.4). Our server covers 121 tools across all 51 APIs, includes vendor support, composite tools, security hardening, and mock mode. No other complete SP-API MCP implementation exists.

**Q: What's the risk if SP-API changes versions?**
A: Each API maps to a single tool file. When Amazon releases a new version, we add or update that file — no architectural changes needed. The modular design means version updates are isolated to individual tool files.

**Q: How do we handle the 140+ tool limit with AI context windows?**
A: Amazon Quick only loads tool descriptions (not full schemas) during discovery. Our tool descriptions are concise (1–2 sentences + rate limit info). The total tools/list payload is approximately 30KB — well within any LLM context window. We also noted FR-03.6 in requirements for lazy-loading if this becomes an issue.

**Q: What's the security posture?**
A: Audited and hardened:
- Race-condition-safe token refresh (promise coalescing)
- TLS 1.2+ explicitly enforced (not just defaulted)
- Credentials never in logs, responses, or meta-tools
- Error responses sanitized (only safe fields)
- Mock mode blocked in production (NODE_ENV guard)
- Zero npm audit vulnerabilities
- Input format validators for path parameters
- Pinned dependencies (no open semver ranges pulling unreviewed code)

**Q: What's the adoption path for a large vendor?**
A: 
1. Week 1: Clone → build → test with mock mode in Quick Desktop (zero risk)
2. Week 2: Register SP-API app → sandbox mode (validates auth flow)
3. Week 3: Production mode with single account (real data, single marketplace)
4. Week 4+: Multi-account config (Phase 2) for all vendor relationships
5. Future: Cloud deployment for team-wide access (Phase 3)

**Q: How does this relate to Amazon Q Business?**
A: Amazon Q Business is a general-purpose enterprise AI assistant that connects to data sources for RAG-based Q&A. Our MCP server is a specialized tool provider — it gives any AI agent (including Q Business, potentially) the ability to *act* on SP-API (not just read). They could be used together: Q Business for knowledge retrieval, MCP server for operational actions.

**Q: What metrics would prove success?**
A:
- Time to answer operational questions (target: <10 seconds vs. minutes of manual navigation)
- Reduction in custom script/integration maintenance
- Number of SP-API operations performed through natural language vs. manual
- Developer hours saved on report automation
- Error rate on API calls (target: <1% with rate limiting + retry)
- User adoption (daily active tool calls per account)

---

## One-Line Summary

> An MCP server that lets AI agents talk to all 51 Amazon SP-APIs through natural language — so sellers and vendors can manage their Amazon business by asking questions instead of writing code.

---

*Document Version: 1.0 | June 2026 | Author: Manikanta Gona Grafsgaard*
