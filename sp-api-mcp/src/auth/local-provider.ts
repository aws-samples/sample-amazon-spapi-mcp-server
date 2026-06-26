import axios from "axios";
import { CredentialProvider, TokenResponse } from "./interface.js";
import { CredentialsConfig, LWA_TOKEN_URL } from "../config/schema.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("auth");

/**
 * Local credential provider that reads from config and manages LWA OAuth2 tokens.
 * Handles automatic token refresh before expiry.
 */
export class LocalCredentialProvider implements CredentialProvider {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly refreshBufferMs = 5 * 60 * 1000; // Refresh 5 min before expiry
  private refreshPromise: Promise<string> | null = null;

  constructor(
    private readonly credentials: CredentialsConfig,
    private readonly endpoint: string
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - this.refreshBufferMs) {
      return this.accessToken;
    }

    // Prevent concurrent refresh race condition — coalesce into single request
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<string> {
    logger.info("Refreshing LWA access token");
    const token = await this.refreshToken();
    this.accessToken = token.access_token;
    this.tokenExpiresAt = Date.now() + token.expires_in * 1000;
    return this.accessToken;
  }

  async getRestrictedDataToken(
    path: string,
    dataElements: string[]
  ): Promise<string> {
    const accessToken = await this.getAccessToken();

    const response = await axios.post(
      `${this.endpoint}/tokens/2021-03-01/restrictedDataToken`,
      {
        restrictedResources: [
          {
            method: "GET",
            path,
            dataElements,
          },
        ],
      },
      {
        headers: {
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.restrictedDataToken;
  }

  async healthCheck(): Promise<{ valid: boolean; expiresIn?: number; error?: string }> {
    try {
      const token = await this.getAccessToken();
      const expiresIn = Math.floor((this.tokenExpiresAt - Date.now()) / 1000);
      return { valid: !!token, expiresIn };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  private async refreshToken(): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(
        LWA_TOKEN_URL,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.credentials.refresh_token,
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
        }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      logger.info(`Token refreshed, expires in ${response.data.expires_in}s`);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error_description || err.message;
        throw new Error(`LWA token refresh failed: ${msg}`);
      }
      throw err;
    }
  }
}
