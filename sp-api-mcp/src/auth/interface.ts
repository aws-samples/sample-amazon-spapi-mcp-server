/**
 * Common credential provider interface.
 * Implementations handle local (config file) and remote (Secrets Manager) credential storage.
 */
export interface CredentialProvider {
  /** Get a valid access token, refreshing if necessary */
  getAccessToken(): Promise<string>;

  /** Get a Restricted Data Token for PII operations */
  getRestrictedDataToken(
    path: string,
    dataElements: string[]
  ): Promise<string>;

  /** Check if credentials are valid and token can be acquired */
  healthCheck(): Promise<{ valid: boolean; expiresIn?: number; error?: string }>;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
