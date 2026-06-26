import { SpApiClient, ApiResponse } from "./sp-api-client.js";
import { ServerConfig } from "../config/schema.js";
import { CredentialProvider } from "../auth/interface.js";
import { getMockResponse } from "./mock-data.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("mock-client");

/**
 * Mock SP-API client that returns realistic fake data.
 * Used for testing without real credentials.
 */
export class MockSpApiClient extends SpApiClient {
  constructor(config: ServerConfig, credentialProvider: CredentialProvider) {
    super(config, credentialProvider);
  }

  override async get<T = unknown>(
    path: string,
    params?: Record<string, unknown>,
    _apiDomain?: string
  ): Promise<ApiResponse<T>> {
    logger.info(`[MOCK] GET ${path}`);
    const data = getMockResponse("GET", path, params) as T;
    return { data, headers: {}, rateLimitRemaining: 10 };
  }

  override async post<T = unknown>(
    path: string,
    data?: unknown,
    _apiDomain?: string
  ): Promise<ApiResponse<T>> {
    logger.info(`[MOCK] POST ${path}`);
    const responseData = getMockResponse("POST", path, data as Record<string, unknown>) as T;
    return { data: responseData, headers: {}, rateLimitRemaining: 10 };
  }

  override async put<T = unknown>(
    path: string,
    data?: unknown,
    _apiDomain?: string
  ): Promise<ApiResponse<T>> {
    logger.info(`[MOCK] PUT ${path}`);
    const responseData = getMockResponse("PUT", path, data as Record<string, unknown>) as T;
    return { data: responseData, headers: {}, rateLimitRemaining: 10 };
  }

  override async patch<T = unknown>(
    path: string,
    data?: unknown,
    _apiDomain?: string
  ): Promise<ApiResponse<T>> {
    logger.info(`[MOCK] PATCH ${path}`);
    const responseData = getMockResponse("PATCH", path, data as Record<string, unknown>) as T;
    return { data: responseData, headers: {}, rateLimitRemaining: 10 };
  }

  override async delete<T = unknown>(
    path: string,
    _apiDomain?: string
  ): Promise<ApiResponse<T>> {
    logger.info(`[MOCK] DELETE ${path}`);
    const responseData = getMockResponse("DELETE", path) as T;
    return { data: responseData, headers: {}, rateLimitRemaining: 10 };
  }

  override getRateLimitStatus(): Record<string, { running: number; queued: number }> {
    return {
      orders: { running: 0, queued: 0 },
      catalog: { running: 0, queued: 0 },
      pricing: { running: 0, queued: 0 },
      reports: { running: 0, queued: 0 },
      "vendor-orders": { running: 0, queued: 0 },
    };
  }
}
