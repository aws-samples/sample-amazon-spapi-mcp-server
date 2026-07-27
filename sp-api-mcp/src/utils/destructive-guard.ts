/**
 * Destructive operation guard.
 * Tools marked as destructive require an explicit `confirm: true` parameter.
 * This prevents AI agents from accidentally triggering irreversible actions.
 */

export interface DestructiveGuardResult {
  allowed: boolean;
  error?: {
    code: string;
    message: string;
    suggestedAction: string;
  };
}

/**
 * Validates that a destructive operation has been explicitly confirmed.
 * Returns an error object if confirmation is missing or false.
 */
export function requireConfirmation(
  params: Record<string, unknown>,
  toolName: string,
  operationDescription: string
): DestructiveGuardResult {
  if (params.confirm === true) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: {
      code: "CONFIRMATION_REQUIRED",
      message: `⚠️ DESTRUCTIVE OPERATION: ${operationDescription}. This action cannot be undone.`,
      suggestedAction: `To proceed, call ${toolName} again with the parameter "confirm": true. Make sure the user has explicitly requested this action.`,
    },
  };
}
