/**
 * Mock response data for testing without real SP-API credentials.
 * Returns realistic-looking fake data for all major APIs.
 */

export function getMockResponse(method: string, path: string, _params?: Record<string, unknown>): unknown {
  // Orders API
  if (path.includes("/orders/v0/orders") && !path.includes("/orderItems") && !path.includes("/address") && !path.includes("/buyerInfo")) {
    if (path.match(/\/orders\/v0\/orders\/[\w-]+$/)) {
      return mockSingleOrder();
    }
    return mockOrdersList();
  }
  if (path.includes("/orderItems")) return mockOrderItems();
  if (path.includes("/address")) return mockOrderAddress();
  if (path.includes("/buyerInfo")) return mockBuyerInfo();

  // Catalog
  if (path.includes("/catalog/2022-04-01/items") && !path.match(/items\/[A-Z0-9]+$/)) return mockCatalogSearch();
  if (path.match(/\/catalog\/.*\/items\/[A-Z0-9]+$/)) return mockCatalogItem();

  // FBA Inventory
  if (path.includes("/fba/inventory")) return mockFbaInventory();

  // Pricing
  if (path.includes("/products/pricing")) return mockPricing();

  // Reports
  if (method === "POST" && path.includes("/reports/2021-06-30/reports")) return { reportId: "MOCK-REPORT-" + Date.now() };
  if (path.match(/\/reports\/2021-06-30\/reports\/[\w-]+$/)) return mockReportStatus();
  if (path.includes("/reports/2021-06-30/documents")) return mockReportDocument();
  if (path.includes("/reports/2021-06-30/reports") && method === "GET") return mockReportsList();

  // Feeds
  if (method === "POST" && path.includes("/feeds/2021-06-30/documents")) return { feedDocumentId: "MOCK-FEED-DOC-" + Date.now(), url: "https://mock-upload-url.example.com" };
  if (method === "POST" && path.includes("/feeds/2021-06-30/feeds")) return { feedId: "MOCK-FEED-" + Date.now() };
  if (path.match(/\/feeds\/2021-06-30\/feeds\/[\w-]+$/)) return mockFeedStatus();

  // Listings
  if (path.includes("/listings/2021-08-01/items")) return mockListing();

  // Notifications
  if (path.includes("/notifications/v1")) return mockNotifications();

  // Finances
  if (path.includes("/finances")) return mockFinances();

  // Sales
  if (path.includes("/sales/v1/orderMetrics")) return mockSalesMetrics();

  // Vendor Orders
  if (path.includes("/vendor/orders/v1/purchaseOrders")) return mockVendorOrders();
  if (path.includes("/vendor/orders/v1/acknowledgements")) return { transactionId: "MOCK-TXN-" + Date.now() };

  // Vendor Shipments
  if (path.includes("/vendor/shipping")) return { transactionId: "MOCK-TXN-" + Date.now() };

  // Vendor Invoices
  if (path.includes("/vendor/payments")) return { transactionId: "MOCK-TXN-" + Date.now() };

  // Vendor Transaction Status
  if (path.includes("/vendor/transactions")) return mockTransactionStatus();

  // Data Kiosk
  if (method === "POST" && path.includes("/dataKiosk")) return { queryId: "MOCK-QUERY-" + Date.now() };
  if (path.match(/\/dataKiosk.*\/queries\/[\w-]+$/)) return mockDataKioskQuery();
  if (path.includes("/dataKiosk") && path.includes("/documents/")) return { documentId: "MOCK-DK-DOC-1", documentUrl: "https://mock-data-kiosk.example.com/results.jsonl" };

  // Sellers
  if (path.includes("/sellers/v1")) return mockSellers();

  // Health/Meta
  if (path.includes("/tokens")) return { restrictedDataToken: "mock-rdt-token", expiresIn: 3600 };

  // Shipping
  if (path.includes("/shipping/v2")) return mockShipping(method, path);

  // Default fallback
  return { message: "Mock response", path, method, timestamp: new Date().toISOString() };
}

function mockOrdersList() {
  return {
    payload: {
      Orders: [
        {
          AmazonOrderId: "111-1234567-1234567",
          PurchaseDate: "2026-06-20T14:30:00Z",
          LastUpdateDate: "2026-06-21T10:00:00Z",
          OrderStatus: "Shipped",
          FulfillmentChannel: "AFN",
          OrderTotal: { CurrencyCode: "USD", Amount: "49.99" },
          NumberOfItemsShipped: 2,
          NumberOfItemsUnshipped: 0,
          MarketplaceId: "ATVPDKIKX0DER",
        },
        {
          AmazonOrderId: "111-7654321-7654321",
          PurchaseDate: "2026-06-19T09:15:00Z",
          LastUpdateDate: "2026-06-19T09:15:00Z",
          OrderStatus: "Unshipped",
          FulfillmentChannel: "MFN",
          OrderTotal: { CurrencyCode: "USD", Amount: "129.95" },
          NumberOfItemsShipped: 0,
          NumberOfItemsUnshipped: 3,
          MarketplaceId: "ATVPDKIKX0DER",
        },
        {
          AmazonOrderId: "111-9999999-0000001",
          PurchaseDate: "2026-06-18T16:45:00Z",
          LastUpdateDate: "2026-06-20T08:30:00Z",
          OrderStatus: "Shipped",
          FulfillmentChannel: "AFN",
          OrderTotal: { CurrencyCode: "USD", Amount: "24.99" },
          NumberOfItemsShipped: 1,
          NumberOfItemsUnshipped: 0,
          MarketplaceId: "ATVPDKIKX0DER",
        },
      ],
      NextToken: null,
    },
  };
}

function mockSingleOrder() {
  return {
    payload: {
      AmazonOrderId: "111-1234567-1234567",
      PurchaseDate: "2026-06-20T14:30:00Z",
      LastUpdateDate: "2026-06-21T10:00:00Z",
      OrderStatus: "Shipped",
      FulfillmentChannel: "AFN",
      OrderTotal: { CurrencyCode: "USD", Amount: "49.99" },
      ShippingAddress: { StateOrRegion: "WA", PostalCode: "98101", City: "Seattle", CountryCode: "US" },
      PaymentMethod: "Other",
      IsBusinessOrder: false,
      IsPrime: true,
    },
  };
}

function mockOrderItems() {
  return {
    payload: {
      OrderItems: [
        {
          ASIN: "B08N5WRWNW",
          SellerSKU: "SKU-WIDGET-001",
          OrderItemId: "ITEM-001",
          Title: "Premium Widget Pro - Blue",
          QuantityOrdered: 2,
          QuantityShipped: 2,
          ItemPrice: { CurrencyCode: "USD", Amount: "39.98" },
          ItemTax: { CurrencyCode: "USD", Amount: "3.60" },
        },
        {
          ASIN: "B09K3LXYZ1",
          SellerSKU: "SKU-GADGET-002",
          OrderItemId: "ITEM-002",
          Title: "Gadget Accessory Pack",
          QuantityOrdered: 1,
          QuantityShipped: 1,
          ItemPrice: { CurrencyCode: "USD", Amount: "10.01" },
          ItemTax: { CurrencyCode: "USD", Amount: "0.90" },
        },
      ],
      AmazonOrderId: "111-1234567-1234567",
    },
  };
}

function mockOrderAddress() {
  return {
    payload: {
      ShippingAddress: {
        Name: "John Doe",
        AddressLine1: "123 Main St",
        City: "Seattle",
        StateOrRegion: "WA",
        PostalCode: "98101",
        CountryCode: "US",
      },
      AmazonOrderId: "111-1234567-1234567",
    },
  };
}

function mockBuyerInfo() {
  return {
    payload: {
      BuyerEmail: "buyer@marketplace.amazon.com",
      BuyerName: "John D.",
      AmazonOrderId: "111-1234567-1234567",
    },
  };
}

function mockCatalogSearch() {
  return {
    numberOfResults: 2,
    items: [
      { asin: "B08N5WRWNW", summaries: [{ marketplaceId: "ATVPDKIKX0DER", brandName: "WidgetCo", itemName: "Premium Widget Pro - Blue", productType: "WIDGET" }] },
      { asin: "B09K3LXYZ1", summaries: [{ marketplaceId: "ATVPDKIKX0DER", brandName: "GadgetCorp", itemName: "Gadget Accessory Pack", productType: "ACCESSORY" }] },
    ],
  };
}

function mockCatalogItem() {
  return {
    asin: "B08N5WRWNW",
    summaries: [{ marketplaceId: "ATVPDKIKX0DER", brandName: "WidgetCo", itemName: "Premium Widget Pro - Blue", productType: "WIDGET", manufacturer: "WidgetCo Inc" }],
    images: [{ marketplaceId: "ATVPDKIKX0DER", images: [{ variant: "MAIN", link: "https://images-na.ssl-images-amazon.com/images/I/mock-image.jpg", height: 500, width: 500 }] }],
  };
}

function mockFbaInventory() {
  return {
    payload: {
      inventorySummaries: [
        { asin: "B08N5WRWNW", fnSku: "X001ABC123", sellerSku: "SKU-WIDGET-001", productName: "Premium Widget Pro - Blue", condition: "NewItem", inventoryDetails: { fulfillableQuantity: 150, inboundWorkingQuantity: 50, inboundShippedQuantity: 25, reservedQuantity: { totalReservedQuantity: 10 } } },
        { asin: "B09K3LXYZ1", fnSku: "X002DEF456", sellerSku: "SKU-GADGET-002", productName: "Gadget Accessory Pack", condition: "NewItem", inventoryDetails: { fulfillableQuantity: 320, inboundWorkingQuantity: 0, inboundShippedQuantity: 100, reservedQuantity: { totalReservedQuantity: 5 } } },
      ],
    },
    pagination: { nextToken: null },
  };
}

function mockPricing() {
  return {
    responses: [
      { status: { statusCode: 200 }, body: { asin: "B08N5WRWNW", marketplaceId: "ATVPDKIKX0DER", competitivePricing: { buyBoxPrice: { condition: "New", landedPrice: { amount: 19.99, currencyCode: "USD" } }, numberOfOffers: 5, buyBoxWinner: true } } },
    ],
  };
}

function mockReportStatus() {
  return {
    reportId: "MOCK-REPORT-001",
    reportType: "GET_FLAT_FILE_OPEN_LISTINGS_DATA",
    processingStatus: "DONE",
    reportDocumentId: "MOCK-DOC-001",
    createdTime: "2026-06-20T10:00:00Z",
    processingStartTime: "2026-06-20T10:00:05Z",
    processingEndTime: "2026-06-20T10:01:30Z",
  };
}

function mockReportDocument() {
  return {
    reportDocumentId: "MOCK-DOC-001",
    url: "https://mock-report-download.example.com/report.tsv",
    compressionAlgorithm: null,
  };
}

function mockReportsList() {
  return {
    reports: [
      { reportId: "MOCK-REPORT-001", reportType: "GET_FLAT_FILE_OPEN_LISTINGS_DATA", processingStatus: "DONE", createdTime: "2026-06-20T10:00:00Z" },
      { reportId: "MOCK-REPORT-002", reportType: "GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA", processingStatus: "IN_PROGRESS", createdTime: "2026-06-21T08:00:00Z" },
    ],
    nextToken: null,
  };
}

function mockFeedStatus() {
  return {
    feedId: "MOCK-FEED-001",
    feedType: "POST_FLAT_FILE_LISTINGS_DATA",
    processingStatus: "DONE",
    resultFeedDocumentId: "MOCK-FEED-RESULT-001",
    createdTime: "2026-06-20T12:00:00Z",
  };
}

function mockListing() {
  return {
    sku: "SKU-WIDGET-001",
    summaries: [{ marketplaceId: "ATVPDKIKX0DER", asin: "B08N5WRWNW", productType: "WIDGET", status: ["BUYABLE"], itemName: "Premium Widget Pro - Blue" }],
    offers: [{ marketplaceId: "ATVPDKIKX0DER", offerType: "B2C", price: { currencyCode: "USD", amount: "19.99" } }],
    issues: [],
  };
}

function mockNotifications() {
  return {
    payload: {
      subscriptions: [
        { subscriptionId: "SUB-001", notificationType: "ANY_OFFER_CHANGED", destinationId: "DEST-001", payloadVersion: "1.0" },
      ],
      destinations: [
        { destinationId: "DEST-001", name: "My SQS Queue", resource: { sqs: { arn: "arn:aws:sqs:us-east-1:123456789:sp-api-notifications" } } },
      ],
    },
  };
}

function mockFinances() {
  return {
    payload: {
      transactions: [
        { transactionType: "Order", postedDate: "2026-06-20T00:00:00Z", totalAmount: { currencyCode: "USD", amount: "49.99" }, description: "Order payment: 111-1234567-1234567" },
        { transactionType: "Refund", postedDate: "2026-06-19T00:00:00Z", totalAmount: { currencyCode: "USD", amount: "-24.99" }, description: "Refund: 111-5555555-5555555" },
        { transactionType: "ServiceFee", postedDate: "2026-06-18T00:00:00Z", totalAmount: { currencyCode: "USD", amount: "-3.75" }, description: "FBA fee" },
      ],
    },
    nextToken: null,
  };
}

function mockSalesMetrics() {
  return {
    payload: [
      { interval: "2026-06-15T00:00:00Z--2026-06-22T00:00:00Z", unitCount: 47, orderItemCount: 52, orderCount: 38, averageUnitPrice: { amount: 24.50, currencyCode: "USD" }, totalSales: { amount: 1151.50, currencyCode: "USD" } },
    ],
  };
}

function mockVendorOrders() {
  return {
    payload: {
      purchaseOrders: [
        { purchaseOrderNumber: "PO-2026-001234", purchaseOrderState: "New", orderDetails: { purchaseOrderDate: "2026-06-18T00:00:00Z", purchaseOrderType: "RegularOrder", items: [{ itemSequenceNumber: "1", amazonProductIdentifier: "B08N5WRWNW", orderedQuantity: { amount: 500, unitOfMeasure: "Each" }, netCost: { currencyCode: "USD", amount: "5.00" } }] } },
        { purchaseOrderNumber: "PO-2026-001235", purchaseOrderState: "Acknowledged", orderDetails: { purchaseOrderDate: "2026-06-15T00:00:00Z", purchaseOrderType: "RegularOrder", items: [{ itemSequenceNumber: "1", amazonProductIdentifier: "B09K3LXYZ1", orderedQuantity: { amount: 200, unitOfMeasure: "Each" }, netCost: { currencyCode: "USD", amount: "8.50" } }] } },
      ],
    },
    nextToken: null,
  };
}

function mockTransactionStatus() {
  return {
    payload: {
      transactionStatus: { transactionId: "MOCK-TXN-001", status: "Success", errors: [] },
    },
  };
}

function mockDataKioskQuery() {
  return {
    queryId: "MOCK-QUERY-001",
    query: "query { analytics_salesAndTraffic_2024_Q1 { ... } }",
    processingStatus: "DONE",
    dataDocumentId: "MOCK-DK-DOC-001",
    createdTime: "2026-06-20T10:00:00Z",
  };
}

function mockSellers() {
  return {
    payload: [
      { marketplace: { id: "ATVPDKIKX0DER", name: "Amazon.com", countryCode: "US" }, participation: { isParticipating: true, hasSuspendedListings: false } },
      { marketplace: { id: "A2EUQ1WTGCTBG2", name: "Amazon.ca", countryCode: "CA" }, participation: { isParticipating: true, hasSuspendedListings: false } },
    ],
  };
}

function mockShipping(method: string, path: string) {
  if (method === "POST" && path.includes("/rates")) {
    return {
      payload: {
        rates: [
          { rateId: "RATE-001", carrierId: "USPS", carrierName: "USPS", serviceType: "Priority Mail", totalCharge: { value: 7.95, unit: "USD" }, promise: { deliveryWindow: { start: "2026-06-23T00:00:00Z", end: "2026-06-25T00:00:00Z" } } },
          { rateId: "RATE-002", carrierId: "UPS", carrierName: "UPS", serviceType: "Ground", totalCharge: { value: 5.49, unit: "USD" }, promise: { deliveryWindow: { start: "2026-06-25T00:00:00Z", end: "2026-06-27T00:00:00Z" } } },
        ],
        requestToken: "MOCK-REQ-TOKEN-001",
      },
    };
  }
  if (path.includes("/tracking")) {
    return { payload: { trackingId: "1Z999AA10123456784", carrierId: "UPS", summary: { status: "IN_TRANSIT" }, eventHistory: [{ eventDate: "2026-06-21T08:00:00Z", status: "PICKED_UP" }] } };
  }
  return { payload: { shipmentId: "MOCK-SHIP-001", status: "Purchased" } };
}
