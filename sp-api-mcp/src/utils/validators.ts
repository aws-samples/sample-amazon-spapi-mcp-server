import { z } from "zod";

/**
 * Validated ID schemas for common SP-API identifiers.
 * Prevents path traversal and injection via URL parameters.
 */

/** Amazon Order ID: 3-7-7 digit format */
export const AmazonOrderId = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[\w-]+$/, "Order ID contains invalid characters")
  .describe("Amazon order ID (e.g. 111-1234567-1234567)");

/** ASIN: 10-character alphanumeric starting with B */
export const Asin = z
  .string()
  .min(10)
  .max(10)
  .regex(/^[A-Z0-9]{10}$/, "Invalid ASIN format")
  .describe("Amazon Standard Identification Number (10 chars)");

/** Seller SKU: alphanumeric with limited special chars, max 40 */
export const SellerSku = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-zA-Z0-9\-_. ]+$/, "SKU contains invalid characters")
  .describe("Seller SKU");

/** Generic SP-API resource ID (reports, feeds, etc.) */
export const ResourceId = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9\-_.]+$/, "Resource ID contains invalid characters")
  .describe("SP-API resource identifier");

/** Marketplace ID */
export const MarketplaceId = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[A-Z0-9]+$/, "Invalid marketplace ID")
  .describe("Amazon marketplace ID");

/** Safe string for path parameters — no path traversal characters */
export const SafePathParam = z
  .string()
  .min(1)
  .max(200)
  .refine(
    (val) => !val.includes("..") && !val.includes("/") && !val.includes("\\"),
    "Parameter contains path traversal characters"
  );
