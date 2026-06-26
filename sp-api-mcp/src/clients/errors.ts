import { AxiosError } from "axios";

export type ErrorCategory =
  | "auth_failure"
  | "rate_limited"
  | "validation_error"
  | "not_found"
  | "api_error"
  | "timeout"
  | "quota_exceeded"
  | "deprecated"
  | "sandbox_only"
  | "unknown";

export interface SpApiError {
  category: ErrorCategory;
  code: string;
  message: string;
  details?: unknown;
  suggestedAction: string;
  httpStatus?: number;
}

const SUGGESTED_ACTIONS: Record<ErrorCategory, string> = {
  auth_failure: "Check credentials and re-authenticate. Verify refresh_token is valid.",
  rate_limited: "Request has been queued. Wait for rate limit reset or reduce request frequency.",
  validation_error: "Fix request parameters. Check the error details for specific field issues.",
  not_found: "Verify the resource ID, ASIN, or order ID exists and is accessible.",
  api_error: "Transient server error. The request will be retried automatically.",
  timeout: "The request timed out. Try again or use a narrower date range/filter.",
  quota_exceeded: "API usage quota exceeded. Wait for quota reset or request a limit increase.",
  deprecated: "This API version is deprecated. Update to the newer version.",
  sandbox_only: "This operation is not available in sandbox mode. Switch to production.",
  unknown: "An unexpected error occurred. Check the error details and try again.",
};

export function createSpApiError(axiosError: AxiosError): SpApiError {
  const status = axiosError.response?.status;
  const responseData = axiosError.response?.data as Record<string, unknown> | undefined;

  const category = categorizeError(status, axiosError);
  const apiErrors = responseData?.errors as Array<{ code?: string; message?: string }> | undefined;
  const firstError = apiErrors?.[0];

  // Sanitize error details — only include safe fields, never raw response bodies
  const sanitizedDetails = responseData
    ? {
        errors: apiErrors,
        requestId: responseData["x-amzn-RequestId"] || responseData["requestId"],
      }
    : undefined;

  return {
    category,
    code: firstError?.code || `HTTP_${status || "NETWORK"}`,
    message: firstError?.message || axiosError.message,
    details: sanitizedDetails,
    suggestedAction: SUGGESTED_ACTIONS[category],
    httpStatus: status,
  };
}

function categorizeError(
  status: number | undefined,
  error: AxiosError
): ErrorCategory {
  if (!status) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "timeout";
    }
    return "unknown";
  }

  switch (status) {
    case 400:
      return "validation_error";
    case 401:
    case 403:
      return "auth_failure";
    case 404:
      return "not_found";
    case 410:
      return "deprecated";
    case 429:
      return "rate_limited";
    case 500:
    case 502:
    case 503:
      return "api_error";
    case 504:
      return "timeout";
    default:
      return status >= 500 ? "api_error" : "unknown";
  }
}
