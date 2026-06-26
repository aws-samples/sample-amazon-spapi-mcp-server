import { CredentialProvider } from "./interface.js";

/**
 * Mock credential provider for testing without real SP-API credentials.
 * Returns fake tokens that the mock API client will accept.
 */
export class MockCredentialProvider implements CredentialProvider {
  async getAccessToken(): Promise<string> {
    return "mock-access-token-for-testing";
  }

  async getRestrictedDataToken(
    _path: string,
    _dataElements: string[]
  ): Promise<string> {
    return "mock-rdt-token-for-testing";
  }

  async healthCheck(): Promise<{ valid: boolean; expiresIn?: number; error?: string }> {
    return { valid: true, expiresIn: 3600 };
  }
}
