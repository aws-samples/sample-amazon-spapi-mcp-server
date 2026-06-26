# SP-API MCP Server — Testing Guide for Amazon Quick Desktop

This guide walks you through testing the SP-API MCP Server with Amazon Quick Desktop using mock data (no SP-API credentials required).

---

## Prerequisites

- **Amazon Quick Desktop** installed on your Mac
- **Node.js 18+** installed (`node --version` to check)
- The SP-API MCP Server built (follow steps below if not done)

---

## Step 1: Build the MCP Server

Open Terminal and run:

```bash
cd ~/Desktop/SP-API\ MCP\ Server/sp-api-mcp

# Install dependencies (skip if already done)
npm install

# Build the TypeScript project
npm run build
```

Verify the build succeeded:

```bash
ls dist/index.js
```

You should see the file listed.

---

## Step 2: Verify the Server Works Locally

Run a quick smoke test to confirm the server responds to MCP requests:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
| node dist/index.js --config ./config.example.json --mode local --mock 2>/dev/null
```

You should see a JSON response containing:
```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"sp-api-mcp","version":"1.0.0"}},...}
```

If you see this, the server is working.

---

## Step 3: Create a Space-Free Path (Required for Quick Desktop)

Amazon Quick Desktop splits command arguments on spaces. Since the project folder has spaces in its name ("SP-API MCP Server"), Quick will fail to locate the files. Fix this by creating a symlink:

```bash
# Create a symlink without spaces
ln -sfn ~/Desktop/SP-API\ MCP\ Server/sp-api-mcp ~/sp-api-mcp

# Verify it works
ls ~/sp-api-mcp/dist/index.js
ls ~/sp-api-mcp/config.example.json
```

Both should print the file paths without errors. Your Quick-safe paths are now:
```
/Users/mggona/sp-api-mcp/dist/index.js
/Users/mggona/sp-api-mcp/config.example.json
/Users/mggona/sp-api-mcp/start-mock.sh
```

> **⚠️ If you skip this step**, Quick will show "0 tools" or fail to connect because it can't parse paths with spaces.

---

## Step 4: Register the MCP Server in Amazon Quick Desktop

1. **Open Amazon Quick Desktop**

2. **Navigate to MCP Settings:**
   - Click the **Settings** icon (gear) in the sidebar
   - Select **Capabilities**
   - Click the **MCP** tab

3. **Add the SP-API MCP Server:**
   - Click **+ Add MCP**
   - Select **Local** as the connection type

4. **Fill in the configuration (Option A — recommended):**

   | Field | Value |
   |-------|-------|
   | **Name** | `SP-API MCP Server (Mock)` |
   | **Command** | `node` |
   | **Arguments** | `/Users/mggona/sp-api-mcp/dist/index.js --config /Users/mggona/sp-api-mcp/config.example.json --mode local --mock` |
   | **Description** | `Amazon Selling Partner API — 105 seller tools with mock data for testing` |
   | **Timeout** | `30` (seconds) |

   > **Note:** Replace `/Users/mggona` with your home directory path if different (`echo $HOME` to check).

5. **If Option A shows "0 tools", use Option B instead:**

   Delete the entry and re-add with:

   | Field | Value |
   |-------|-------|
   | **Name** | `SP-API MCP Server (Mock)` |
   | **Command** | `bash` |
   | **Arguments** | `/Users/mggona/sp-api-mcp/start-mock.sh` |
   | **Timeout** | `30` (seconds) |

   The shell wrapper script handles all paths internally, avoiding any argument parsing issues.

6. **Click "+ Add MCP"** to save

7. **Verify the connection:**
   - The server should appear in your MCP list showing **105 tools** and a green/active status
   - If it shows **0 tools** or orange "Configured" without a tool count, see Troubleshooting below

6. **Verify the connection:**
   - The server should appear in your MCP list with a green/active status
   - If it shows an error, double-check the paths are correct

---

## Step 5: Test Tools in Amazon Quick Chat

Open a new chat in Amazon Quick and try these prompts:

### Test 1: Check Server Health
```
Check the SP-API server health status
```

**Expected:** Quick calls `spapi_health_check` and shows:
- Status: healthy
- Authentication: valid
- Expires in: 3600 seconds

---

### Test 2: View Orders
```
Show me my recent orders
```

**Expected:** Quick calls `spapi_orders_get_orders` and displays 3 mock orders:
- Order 111-1234567-1234567 — $49.99, Shipped, FBA
- Order 111-7654321-7654321 — $129.95, Unshipped, MFN
- Order 111-9999999-0000001 — $24.99, Shipped, FBA

---

### Test 3: Check Inventory
```
What's my current FBA inventory?
```

**Expected:** Quick calls `spapi_fba_inventory_get_summaries` and shows:
- SKU-WIDGET-001 (Premium Widget Pro - Blue): 150 fulfillable, 50 inbound working, 25 inbound shipped
- SKU-GADGET-002 (Gadget Accessory Pack): 320 fulfillable, 0 inbound working, 100 inbound shipped

---

### Test 4: Search Catalog
```
Search the catalog for "widget"
```

**Expected:** Quick calls `spapi_catalog_search_items` and returns:
- B08N5WRWNW — Premium Widget Pro - Blue (WidgetCo)
- B09K3LXYZ1 — Gadget Accessory Pack (GadgetCorp)

---

### Test 5: Get Order Details
```
Show me the items in order 111-1234567-1234567
```

**Expected:** Quick calls `spapi_orders_get_order_items` and shows:
- B08N5WRWNW — Premium Widget Pro - Blue, qty 2, $39.98
- B09K3LXYZ1 — Gadget Accessory Pack, qty 1, $10.01

---

### Test 6: Check Pricing
```
What's the competitive pricing for ASIN B08N5WRWNW?
```

**Expected:** Quick calls `spapi_pricing_get_competitive_pricing` and shows:
- Buy Box Price: $19.99 (New)
- Number of Offers: 5
- Buy Box Winner: Yes

---

### Test 7: View Financial Transactions
```
Show me my financial transactions from June 2026
```

**Expected:** Quick calls `spapi_finances_list_transactions` and shows:
- Order payment: $49.99
- Refund: -$24.99
- FBA fee: -$3.75

---

### Test 8: Sales Metrics
```
What are my sales metrics for this week?
```

**Expected:** Quick calls `spapi_sales_get_order_metrics` and shows:
- Units ordered: 47
- Order count: 38
- Total sales: $1,151.50
- Average unit price: $24.50

---

### Test 9: Server Configuration
```
What account type am I using and how many tools are available?
```

**Expected:** Quick calls `spapi_get_config` and shows:
- Account type: seller
- Region: NA (US marketplace)
- Visible tools: 105 (63 seller + 42 shared)
- Sandbox mode: off

---

### Test 10: Verify Vendor Tool Blocking
```
Show me my vendor purchase orders
```

**Expected:** Quick calls `spapi_vendor_orders_get_purchase_orders` and gets an error:
- "Tool not found or not available for current account type"
- Suggested action: "Use spapi_get_config to see available tools"

This confirms the account-type filtering is working — vendor tools are blocked in seller mode.

---

## Step 6: Test with Vendor Mode (Optional)

To test vendor tools, create a vendor config:

```bash
cd ~/Desktop/SP-API\ MCP\ Server/sp-api-mcp

# Create a vendor config
cat > config.vendor.json << 'EOF'
{
  "server_name": "sp-api-mcp",
  "version": "1.0.0",
  "account_type": "vendor",
  "marketplace": {
    "region": "NA",
    "marketplace_ids": ["ATVPDKIKX0DER"],
    "endpoint": "https://sellingpartnerapi-na.amazon.com"
  },
  "credentials": {
    "client_id": "amzn1.application-oa2-client.MOCK",
    "client_secret": "MOCK_SECRET",
    "refresh_token": "Atzr|MOCK_TOKEN"
  },
  "options": {
    "sandbox_mode": false,
    "log_level": "info"
  }
}
EOF
```

Add a second MCP server in Quick:
- **Name:** `SP-API MCP Server (Vendor Mock)`
- **Arguments:** `/Users/mggona/Desktop/SP-API MCP Server/sp-api-mcp/dist/index.js --config /Users/mggona/Desktop/SP-API MCP Server/sp-api-mcp/config.vendor.json --mode local --mock`

Then ask:
```
Show me pending vendor purchase orders
```

**Expected:** Returns 2 mock POs:
- PO-2026-001234 — New, 500x B08N5WRWNW @ $5.00
- PO-2026-001235 — Acknowledged, 200x B09K3LXYZ1 @ $8.50

---

## Step 7: Test Report Workflow

```
Generate an open listings report
```

**Expected:** Quick calls `spapi_reports_create_report` → returns a mock report ID, then optionally checks status showing "DONE" with a download URL.

For the composite tool:
```
Create and download a flat file listings report
```

**Expected:** Quick calls `spapi_reports_create_and_download` which simulates the full create → poll → download lifecycle.

---

## Troubleshooting

### Server shows "0 tools" or "Configured" (orange dot)
This is the most common issue. Usually caused by:

1. **Spaces in file paths** — Quick splits arguments on spaces
   - Fix: Use the symlink path (`~/sp-api-mcp/...`) not the full Desktop path
   - Or use Option B (the `bash` + `start-mock.sh` approach)

2. **Node.js not found by Quick** — Quick might not have `node` in its PATH
   - Fix: Use the full path to node: `which node` in Terminal, then use that as the Command field
   - Example: `/usr/local/bin/node` instead of just `node`

3. **Server crashes on startup** — check for error output
   - Run manually first:
     ```bash
     node ~/sp-api-mcp/dist/index.js --config ~/sp-api-mcp/config.example.json --mode local --mock
     ```
   - Press Ctrl+C to stop. Look for error messages on stderr.

4. **Wrong MCP protocol version** — Quick expects specific handshake
   - This should work automatically with our MCP SDK, but if Quick is very old, update it

### Server doesn't appear in Quick
- Verify Node.js is installed: `node --version` (need 18+)
- Verify the build exists: `ls ~/sp-api-mcp/dist/index.js`
- Verify the symlink works: `ls -la ~/sp-api-mcp`

### Quick doesn't call the right tool
- Be more specific: "Use the spapi_orders_get_orders tool to show orders from this week"
- You can also ask: "List all available SP-API tools" to see what Quick detects

### "Tool not found" errors for seller tools
- Verify config.example.json has `"account_type": "seller"`
- Toggle the MCP server off/on in Quick settings to reconnect

### Server works in Terminal but not in Quick
- Quick spawns the process differently. Use Option B (bash wrapper script) as it handles all path resolution internally.

---

## Next Steps: Testing with Real Data

Once you've validated the MCP flow works with mock data:

1. **Register as SP-API Developer:**
   - Go to [Seller Central → Apps & Services → Develop Apps](https://sellercentral.amazon.com/apps/develop)
   - Create a new app, get client_id and client_secret

2. **Self-authorize your app:**
   - In Seller Central → Apps & Services → Manage Your Apps
   - Click "Authorize" on your app → generates refresh_token

3. **Create a real config:**
   ```bash
   cp config.example.json config.json
   # Edit config.json with your real credentials
   ```

4. **Switch to sandbox mode first:**
   Set `"sandbox_mode": true` in config.json to test against SP-API sandbox endpoints.

5. **Remove `--mock` flag in Quick:**
   Update the MCP server arguments to remove `--mock`:
   ```
   /path/to/dist/index.js --config /path/to/config.json --mode local
   ```

6. **Switch to production:**
   Set `"sandbox_mode": false` for real data.

---

## Summary of Modes

| Mode | Flag | Data Source | Use Case |
|------|------|-------------|----------|
| Mock | `--mock` | Hardcoded fake data | Validate MCP connectivity & tool routing |
| Sandbox | `sandbox_mode: true` | SP-API sandbox (canned responses) | Validate request formatting with real auth |
| Production | `sandbox_mode: false` | Your real Seller Central data | Full production use |

---

*Last updated: June 25, 2026*
