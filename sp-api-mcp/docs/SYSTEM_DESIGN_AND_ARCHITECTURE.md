# SP-API MCP Server — System Design & Architecture Document

**Service Name:** SP-API MCP Server  
**Owner:** Manikanta Gona Grafsgaard (AWS)  
**Version:** 1.0  
**Date:** June 2026  
**Classification:** Internal  

---

## 1. High-Level Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TRUST BOUNDARY: User's Machine                            │
│                                                                                             │
│  ┌───────────────────┐         ┌────────────────────────────────────────────────────────┐   │
│  │                   │  stdio  │              SP-API MCP Server (Node.js)                │   │
│  │   Amazon Quick    │◄───────►│                                                        │   │
│  │   Desktop         │ JSON-RPC│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │   │
│  │   (MCP Client)    │  2.0    │  │ MCP Protocol │  │ Tool        │  │ Config       │  │   │
│  │                   │         │  │ Layer        │  │ Registry    │  │ Validator    │  │   │
│  └───────────────────┘         │  │ (stdio)      │  │ (121 tools) │  │ (Zod)        │  │   │
│                                │  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘  │   │
│                                │         │                  │                │          │   │
│                                │         ▼                  ▼                ▼          │   │
│                                │  ┌─────────────────────────────────────────────────┐   │   │
│                                │  │              API Client Layer                    │   │   │
│                                │  │  • Rate Limiter (Bottleneck, per-API-domain)     │   │   │
│                                │  │  • Retry Logic (3x exponential backoff)          │   │   │
│                                │  │  • Auto-pagination (max 1000 results cap)        │   │   │
│                                │  │  • HTTPS Agent (TLS 1.2+ enforced)               │   │   │
│                                │  └──────────────────────┬──────────────────────────┘   │   │
│                                │                         │                              │   │
│                                │  ┌──────────────────────▼──────────────────────────┐   │   │
│                                │  │              Auth Module                         │   │   │
│                                │  │  • LWA OAuth2 Token Exchange                    │   │   │
│                                │  │  • Race-safe Token Refresh (promise coalescing)  │   │   │
│                                │  │  • Restricted Data Tokens (RDT) for PII         │   │   │
│                                │  └──────────────────────┬──────────────────────────┘   │   │
│                                │                         │                              │   │
│  ┌───────────────────┐         └─────────────────────────┼──────────────────────────────┘   │
│  │  config.json      │──── --config flag ────────────────┘                                  │
│  │  (credentials,    │                                                                      │
│  │   marketplace,    │                                                                      │
│  │   options)        │                                                                      │
│  └───────────────────┘                                                                      │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               │ HTTPS (TLS 1.2+, port 443)
                                               │
                              ┌─────────────────┼──────────────────────┐
                              │                 ▼                      │
                              │  ┌──────────────────────────────────┐  │
                              │  │   Amazon SP-API Endpoints        │  │
                              │  │                                  │  │
                              │  │   NA: sellingpartnerapi-na.amzn  │  │
                              │  │   EU: sellingpartnerapi-eu.amzn  │  │
                              │  │   FE: sellingpartnerapi-fe.amzn  │  │
                              │  │                                  │  │
                              │  │   51 APIs • 121 Operations       │  │
                              │  └──────────────────────────────────┘  │
                              │                                        │
                              │  ┌──────────────────────────────────┐  │
                              │  │   LWA Token Endpoint             │  │
                              │  │   api.amazon.com/auth/o2/token   │  │
                              │  └──────────────────────────────────┘  │
                              │                                        │
                              │    TRUST BOUNDARY: Amazon Services      │
                              └────────────────────────────────────────┘
```

---

## 2. Major Components and Trust Boundaries

| Component | Location | Trust Level | Description |
|-----------|----------|-------------|-------------|
| **Amazon Quick Desktop** | User's machine | Trusted (1st party AI client) | MCP client that sends natural language queries, receives tool results |
| **SP-API MCP Server** | User's machine (Node.js subprocess) | Trusted (runs locally) | Translates MCP tool calls to SP-API HTTP requests |
| **config.json** | User's machine (file system) | Trusted (user-owned) | Contains SP-API credentials, marketplace config, options |
| **Amazon SP-API Endpoints** | Amazon infrastructure | External trusted service | Selling Partner API — returns seller/vendor business data |
| **LWA Token Endpoint** | Amazon infrastructure | External trusted service | Login with Amazon OAuth2 — issues access tokens |

### Trust Boundaries

1. **User's Machine ↔ Amazon Services** — All communication crosses this boundary over HTTPS (TLS 1.2+). No plaintext traffic.
2. **Amazon Quick ↔ MCP Server** — Intra-machine communication via stdio (stdin/stdout). No network exposure. Process-level isolation.
3. **MCP Server ↔ File System** — config.json read at startup only. File permissions should be 600 (owner-only).

---

## 3. Architectural Deep Dive: Security-Relevant Interactions

### 3.1 Authentication Flow

```
┌──────────┐                    ┌──────────────┐                    ┌─────────────────┐
│ MCP      │                    │ Auth Module   │                    │ LWA Endpoint    │
│ Server   │                    │              │                    │ api.amazon.com  │
└────┬─────┘                    └──────┬───────┘                    └────────┬────────┘
     │ 1. Tool call received            │                                     │
     │─────────────────────────────────►│                                     │
     │                                  │ 2. Check token validity             │
     │                                  │    (in-memory, not expired?)        │
     │                                  │                                     │
     │                                  │ [If expired or near-expiry]         │
     │                                  │ 3. POST /auth/o2/token              │
     │                                  │    grant_type=refresh_token         │
     │                                  │    client_id, client_secret         │
     │                                  │    refresh_token                    │
     │                                  │────────────────────────────────────►│
     │                                  │                                     │
     │                                  │ 4. 200 OK: access_token, expires_in │
     │                                  │◄────────────────────────────────────│
     │                                  │                                     │
     │ 5. Return valid access_token     │                                     │
     │◄─────────────────────────────────│                                     │
     │                                  │                                     │
     │ 6. Call SP-API with              │                                     │
     │    x-amz-access-token header     │                                     │
     │──────────────────────────────────────────────────────────────────────► SP-API
```

**Security controls:**
- Token stored in-memory only (never persisted to disk)
- Proactive refresh 5 minutes before expiry
- Race-condition safe via promise coalescing (concurrent requests share one refresh)
- Credentials never logged or returned in responses

### 3.2 Restricted Data Token (RDT) Flow for PII Access

```
┌──────────┐                    ┌──────────────┐                    ┌─────────────────┐
│ Tool     │                    │ Auth Module   │                    │ SP-API Tokens   │
│ Handler  │                    │              │                    │ Endpoint        │
└────┬─────┘                    └──────┬───────┘                    └────────┬────────┘
     │ 1. PII data requested            │                                     │
     │    (buyer info, address)         │                                     │
     │─────────────────────────────────►│                                     │
     │                                  │ 2. POST /tokens/2021-03-01/         │
     │                                  │    restrictedDataToken              │
     │                                  │    { restrictedResources: [...] }   │
     │                                  │────────────────────────────────────►│
     │                                  │                                     │
     │                                  │ 3. restrictedDataToken              │
     │                                  │◄────────────────────────────────────│
     │                                  │                                     │
     │ 4. Use RDT for PII API call      │                                     │
     │◄─────────────────────────────────│                                     │
```

**Security controls:**
- PII access requires explicit `enable_rdt_for_pii: true` in config
- RDT is short-lived and scoped to specific resources
- PII fields are not returned unless explicitly requested

---

## 4. Data Flow Description

### 4.1 Read Operation (e.g., "Get my orders")

```
User (NL) → Quick (tool selection) → MCP Server (validate → rate limit → auth → call) → SP-API → Response
    ◄─────── Quick (format) ◄─────── MCP Server (parse, sanitize) ◄──────────────────── JSON
```

| Step | Data | Format | Encrypted |
|------|------|--------|-----------|
| 1. User → Quick | Natural language query | Text | N/A (local) |
| 2. Quick → MCP Server | JSON-RPC tool call | JSON over stdio | N/A (local IPC) |
| 3. MCP Server → SP-API | HTTP GET/POST | JSON over HTTPS | ✅ TLS 1.2+ |
| 4. SP-API → MCP Server | API response | JSON over HTTPS | ✅ TLS 1.2+ |
| 5. MCP Server → Quick | Tool result | JSON over stdio | N/A (local IPC) |
| 6. Quick → User | Formatted answer | Text | N/A (local) |

### 4.2 Write Operation (e.g., "Submit vendor PO acknowledgement")

Same flow as above, but with POST/PUT body containing the write payload. Destructive operations (delete listing, cancel order) are clearly labeled in tool descriptions.

### 4.3 Async Operation (e.g., "Generate a report")

```
User → Quick → MCP Server → SP-API (create report)
                    │                    ↓
                    │              Report queued
                    │                    ↓
                    ├───── poll ──→ SP-API (get status) ←── loop until DONE
                    │                    ↓
                    │              Report ready
                    │                    ↓
                    └───── fetch ──→ SP-API (get document URL)
                                         ↓
User ← Quick ← MCP Server ←──── Document URL/data
```

---

## 5. Network Protocol Documentation

| Connection | Protocol | Port | Encryption | Authentication |
|-----------|----------|------|------------|----------------|
| Quick ↔ MCP Server | stdio (stdin/stdout) | N/A (IPC) | None needed (same machine, same user) | Process-level (spawned as child) |
| MCP Server → SP-API | HTTPS | 443 | TLS 1.2+ (explicitly enforced) | Bearer token (x-amz-access-token header) |
| MCP Server → LWA | HTTPS | 443 | TLS 1.2+ | Client credentials (client_id + client_secret in POST body) |

**No inbound network listeners.** The MCP server does not open any ports or accept incoming connections. It only makes outbound HTTPS calls to Amazon endpoints.

---

## 6. Exposed Web Service Endpoints

**Phase 1 (current): None.**

The MCP server runs as a local subprocess. It does not expose any network endpoints. Communication is strictly via stdio (standard input/output).

**Phase 2 (planned — AWS deployment):**

| Endpoint | Protocol | Authentication | Purpose |
|----------|----------|----------------|---------|
| API Gateway (SSE) | HTTPS/443 | OAuth 2.0 + PKCE | MCP protocol transport for Amazon Quick Web |

When deployed to AWS, the server will be behind API Gateway with OAuth 2.0 authentication. No direct internet exposure of the MCP server container.

---

## 7. Authorization and Authentication Model

### External APIs (SP-API)

| API | Auth Method | Credential | Scope |
|-----|-------------|-----------|-------|
| All SP-API operations | LWA OAuth 2.0 Bearer Token | `x-amz-access-token` header | Per-application, per-selling-partner |
| PII operations (buyer info, address) | Restricted Data Token (RDT) | `x-amz-access-token` header (RDT) | Per-resource, time-limited |
| LWA Token endpoint | Client credentials | `client_id` + `client_secret` in POST body | Token exchange |

### Internal Access Control (within MCP Server)

| Control | Implementation | Description |
|---------|---------------|-------------|
| Account-type filtering | Tool Registry ACL | Seller tools hidden in vendor mode, vendor tools hidden in seller mode |
| Input validation | Zod schemas | All tool parameters validated against schema before API invocation |
| Path parameter safety | Regex validators | Order IDs, ASINs, SKUs validated against expected patterns |
| Mock mode guard | NODE_ENV check | `--mock` flag blocked when `NODE_ENV=production` |

### IAM Policies (Phase 2 — planned)

Not applicable to Phase 1. When deployed to AWS (Phase 2):
- ECS Task Role: scoped to Secrets Manager read for specific secrets only
- No S3, DynamoDB, or other AWS service access required
- API Gateway: IAM auth or OAuth2 for endpoint access

---

## 8. Consoles

Not applicable. Phase 1 has no web console or management UI. The server is configured via `config.json` and managed via command-line arguments.

Phase 2 (planned) will use:
- AWS ECS Console — container management
- CloudWatch Console — logs and metrics
- Secrets Manager Console — credential rotation

---

## 9. Data Classification

| Data Type | Classification | Storage | Encryption |
|-----------|---------------|---------|------------|
| SP-API credentials (client_id, client_secret, refresh_token) | **Confidential** | config.json (local file, 600 permissions) | At rest: file system encryption (OS-level). In transit: N/A (not transmitted). |
| Access tokens (short-lived) | **Confidential** | In-memory only | Never persisted to disk |
| SP-API response data (orders, inventory, pricing) | **Internal** | In-memory during request lifecycle | In transit: TLS 1.2+. At rest: not stored. |
| PII (buyer name, email, address) | **Restricted** | In-memory, only when RDT is used | In transit: TLS 1.2+. Gated by RDT. Not logged. |
| Configuration (marketplace, options) | **Internal** | config.json | Not sensitive |
| Logs (stderr) | **Internal** | Local stderr stream | Credentials and PII explicitly excluded from logs |

---

## 10. Security Controls Summary

| Control | Status | Details |
|---------|--------|---------|
| Encryption in transit | ✅ Enforced | TLS 1.2+ via explicit `https.Agent({ minVersion: "TLSv1.2" })` |
| Credential protection | ✅ Implemented | Never logged, never in responses, in-memory only |
| Input validation | ✅ Implemented | Zod schemas on all 121 tools + path parameter regex validators |
| Rate limiting | ✅ Implemented | Per-API-domain, queue-before-fail (Bottleneck) |
| Error sanitization | ✅ Implemented | Only error codes + request IDs returned; raw API bodies stripped |
| Access control | ✅ Implemented | Account-type filtering (seller/vendor/both) |
| Dependency security | ✅ Verified | 0 npm audit vulnerabilities, 5 production dependencies |
| No dynamic code execution | ✅ Verified | No eval(), exec(), Function constructor |
| Production guard | ✅ Implemented | Mock mode blocked in NODE_ENV=production |

---

## 11. Compliance Notes

- **Data residency:** SP-API data is processed in-memory on the user's machine. No data is stored persistently by the MCP server.
- **PII handling:** PII access requires explicit RDT configuration. PII is never logged or cached.
- **Audit trail:** Phase 1 logs tool invocations to stderr. Phase 2 will add CloudWatch logging with structured audit events.
- **No customer data in source control:** config.json (containing credentials) is in .gitignore.

---

## 12. Document History

| Date | Version | Change |
|------|---------|--------|
| June 2026 | 1.0 | Initial system design document — Phase 1 local deployment |

---

*This document satisfies the "Document system design and architecture" requirement for security review. It includes: high-level architectural diagram with trust boundaries, architectural deep dive on security-relevant interactions, data flow descriptions, network protocol documentation, exposed endpoints, and authorization/authentication model.*
