import { supabase } from "@/integrations/supabase/client";

/**
 * MFA step-up helper.
 *
 * After a successful password sign-in, Supabase creates a session at assurance
 * level "aal1". If the user has a *verified* TOTP factor, the session's
 * nextLevel becomes "aal2" — meaning a second factor is required before we let
 * them in. This returns that factor's id (so the caller can prompt for the
 * 6-digit code) or null when no MFA step is needed.
 *
 * Fails OPEN (returns null) on any error so an MFA-check failure can never lock
 * a user out of an account that doesn't use MFA.
 */
export async function mfaFactorIfRequired(): Promise<string | null> {
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.find((f) => f.status === "verified");
      return totp?.id ?? null;
    }
  } catch {
    /* fail open — never block normal login on an MFA-check error */
  }
  return null;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data || []).map((r) => r.role as string);
}

export function routePathForRoles(roles: string[]): string {
  return roles.includes("teacher") || roles.includes("admin") ? "/teacher" : "/student";
}
