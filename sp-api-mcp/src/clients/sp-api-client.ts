import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import https from "node:https";
import Bottleneck from "bottleneck";
import { CredentialProvider } from "../auth/interface.js";
import { ServerConfig, REGION_ENDPOINTS, SANDBOX_ENDPOINTS } from "../config/schema.js";
import { createLogger } from "../utils/logger.js";
import { createSpApiError } from "./errors.js";

const logger = createLogger("sp-api-client");

export interface ApiResponse<T = unknown> {
  data: T;
  headers: Record<string, string>;
  rateLimitRemaining?: number;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  nextToken?: string;
  totalPages: number;
}

/**
 * SP-API HTTP client with rate limiting, retry logic, and auto-pagination.
 */
export class SpApiClient {
  private readonly httpClient: AxiosInstance;
  private readonly limiters: Map<string, Bottleneck> = new Map();
  private readonly config: ServerConfig;
  private readonly credentialProvider: CredentialProvider;
  private readonly baseUrl: string;

  constructor(config: ServerConfig, credentialProvider: CredentialProvider) {
    this.config = config;
    this.credentialProvider = credentialProvider;

    const endpoints = config.options.sandbox_mode
      ? SANDBOX_ENDPOINTS
      : REGION_ENDPOINTS;
    this.baseUrl = endpoints[config.marketplace.region];

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30_000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
      }),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `sp-api-mcp/${config.version}`,
      },
    });
  }

  /**
   * Execute a GET request against SP-API.
   */
  async get<T = unknown>(
    path: string,
    params?: Record<string, unknown>,
    apiDomain?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "GET", url: path, params }, apiDomain);
  }

  /**
   * Execute a POST request against SP-API.
   */
  async post<T = unknown>(
    path: string,
    data?: unknown,
    apiDomain?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "POST", url: path, data }, apiDomain);
  }

  /**
   * Execute a PUT request against SP-API.
   */
  async put<T = unknown>(
    path: string,
    data?: unknown,
    apiDomain?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "PUT", url: path, data }, apiDomain);
  }

  /**
   * Execute a PATCH request against SP-API.
   */
  async patch<T = unknown>(
    path: string,
    data?: unknown,
    apiDomain?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "PATCH", url: path, data }, apiDomain);
  }

  /**
   * Execute a DELETE request against SP-API.
   */
  async delete<T = unknown>(
    path: string,
    apiDomain?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "DELETE", url: path }, apiDomain);
  }

  /**
   * Auto-paginate a GET endpoint, fetching all pages up to max_total_results.
   */
  async getPaginated<T = unknown>(
    path: string,
    params: Record<string, unknown> = {},
    apiDomain?: string,
    itemsKey: string = "payload"
  ): Promise<PaginatedResponse<T>> {
    const allItems: T[] = [];
    let nextToken: string | undefined;
    let pageCount = 0;
    const maxResults = this.config.options.max_total_results ?? 1000;
    const maxPerPage = this.config.options.max_page_results ?? 100;

    do {
      const requestParams = {
        ...params,
        ...(nextToken ? { NextToken: nextToken } : {}),
        MaxResultsPerPage: maxPerPage,
      };

      const response = await this.get<Record<string, unknown>>(
        path,
        requestParams,
        apiDomain
      );

      const payload = response.data[itemsKey];
      if (Array.isArray(payload)) {
        allItems.push(...(payload as T[]));
      }

      nextToken = response.data.nextToken as string | undefined;
      pageCount++;

      if (allItems.length >= maxResults) {
        logger.info(
          `Pagination capped at ${maxResults} results (${pageCount} pages)`
        );
        break;
      }
    } while (nextToken && this.config.options.auto_paginate);

    return { items: allItems.slice(0, maxResults), nextToken, totalPages: pageCount };
  }

  /**
   * Get rate limit status for tracked API domains.
   */
  getRateLimitStatus(): Record<string, { running: number; queued: number }> {
    const status: Record<string, { running: number; queued: number }> = {};
    for (const [domain, limiter] of this.limiters.entries()) {
      const counts = limiter.counts();
      status[domain] = {
        running: counts.RUNNING,
        queued: counts.QUEUED,
      };
    }
    return status;
  }

  private getLimiter(apiDomain: string): Bottleneck {
    if (!this.limiters.has(apiDomain)) {
      // Default: 1 request per second with burst of 5
      // Override per-API in the future based on SP-API usage plans
      this.limiters.set(
        apiDomain,
        new Bottleneck({
          maxConcurrent: 5,
          minTime: 200, // 5 requests/second max
          reservoir: 30, // Burst capacity
          reservoirRefreshAmount: 30,
          reservoirRefreshInterval: 60_000, // Refill every minute
        })
      );
    }
    return this.limiters.get(apiDomain)!;
  }

  private async request<T>(
    requestConfig: AxiosRequestConfig,
    apiDomain: string = "default"
  ): Promise<ApiResponse<T>> {
    const limiter = this.getLimiter(apiDomain);

    return limiter.schedule(async () => {
      return this.executeWithRetry<T>(requestConfig);
    });
  }

  private async executeWithRetry<T>(
    requestConfig: AxiosRequestConfig,
    attempt: number = 1,
    maxAttempts: number = 3
  ): Promise<ApiResponse<T>> {
    try {
      const accessToken = await this.credentialProvider.getAccessToken();

      const response = await this.httpClient.request<T>({
        ...requestConfig,
        headers: {
          ...requestConfig.headers,
          "x-amz-access-token": accessToken,
        },
      });

      return {
        data: response.data,
        headers: response.headers as Record<string, string>,
        rateLimitRemaining: parseRateLimit(
          response.headers["x-amzn-ratelimit-limit"] as string
        ),
      };
    } catch (err) {
      if (!axios.isAxiosError(err)) throw err;

      const axiosError = err as AxiosError;
      const status = axiosError.response?.status;

      // Token expired — refresh and retry immediately
      if (status === 401 && attempt === 1) {
        logger.info("Token expired, refreshing and retrying");
        return this.executeWithRetry<T>(requestConfig, attempt + 1, maxAttempts);
      }

      // Rate limited — wait and retry
      if (status === 429 && attempt <= maxAttempts) {
        const backoff = Math.pow(2, attempt) * 1000;
        logger.warn(`Rate limited, retrying in ${backoff}ms (attempt ${attempt})`);
        await sleep(backoff);
        return this.executeWithRetry<T>(requestConfig, attempt + 1, maxAttempts);
      }

      // Server errors — retry with exponential backoff
      if (status && status >= 500 && attempt <= maxAttempts) {
        const backoff = Math.pow(2, attempt) * 1000;
        logger.warn(
          `Server error ${status}, retrying in ${backoff}ms (attempt ${attempt})`
        );
        await sleep(backoff);
        return this.executeWithRetry<T>(requestConfig, attempt + 1, maxAttempts);
      }

      // Non-retryable error
      throw createSpApiError(axiosError);
    }
  }
}

function parseRateLimit(header: string | undefined): number | undefined {
  if (!header) return undefined;
  return parseFloat(header);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
