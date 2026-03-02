import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultAssumptions,
  ASSUMPTIONS_STORAGE_KEY,
  ASSUMPTIONS_BASELINE_VERSION,
  type Assumptions,
} from "@/lib/financialData";

/**
 * Loads assumptions from the database (financial_assumptions table).
 * Falls back to localStorage then defaults.
 */
export async function loadAssumptionsFromDB(): Promise<Assumptions> {
  try {
    const { data, error } = await supabase
      .from("financial_assumptions")
      .select("data")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data?.data && typeof data.data === "object") {
      const stored = data.data as Record<string, unknown>;
      // If DB row has real data (not empty {}), use it
      if (Object.keys(stored).length > 0) {
        return { ...defaultAssumptions, ...stored } as Assumptions;
      }
    }
  } catch {
    // fall through
  }

  // Fallback: check localStorage for any previously saved data and migrate it to DB
  try {
    const raw = localStorage.getItem(ASSUMPTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.__baselineVersion === ASSUMPTIONS_BASELINE_VERSION) {
        const { __baselineVersion, ...rest } = parsed;
        // Migrate to DB silently
        await saveAssumptionsToDB({ ...defaultAssumptions, ...rest });
        return { ...defaultAssumptions, ...rest } as Assumptions;
      }
    }
  } catch {
    // fall through
  }

  return defaultAssumptions;
}

/**
 * Saves assumptions to the database by updating the single row.
 */
export async function saveAssumptionsToDB(assumptions: Assumptions): Promise<boolean> {
  try {
    // Get the existing row id
    const { data: existing } = await supabase
      .from("financial_assumptions")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (existing?.id) {
      const { error } = await supabase
        .from("financial_assumptions")
        .update({
          data: JSON.parse(JSON.stringify(assumptions)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Failed to save assumptions to DB:", error);
        return false;
      }
    } else {
      // No row exists, insert
      const { error } = await supabase
        .from("financial_assumptions")
        .insert({
          data: JSON.parse(JSON.stringify(assumptions)),
        });

      if (error) {
        console.error("Failed to insert assumptions to DB:", error);
        return false;
      }
    }

    // Also keep localStorage in sync as a cache
    try {
      localStorage.setItem(
        ASSUMPTIONS_STORAGE_KEY,
        JSON.stringify({ ...assumptions, __baselineVersion: ASSUMPTIONS_BASELINE_VERSION }),
      );
    } catch {}

    return true;
  } catch (err) {
    console.error("Failed to save assumptions:", err);
    return false;
  }
}

/**
 * Hook that loads assumptions from DB on mount, and provides a save function.
 */
export function useFinancialAssumptions() {
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [savedAssumptions, setSavedAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loadAssumptionsFromDB().then((a) => {
      setAssumptions(a);
      setSavedAssumptions(a);
      setLoading(false);
    });
  }, []);

  const hasUnsavedChanges = JSON.stringify(assumptions) !== JSON.stringify(savedAssumptions);

  const save = useCallback(async () => {
    setSaving(true);
    const ok = await saveAssumptionsToDB(assumptions);
    setSaving(false);
    if (ok) {
      setSavedAssumptions(assumptions);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }
    return ok;
  }, [assumptions]);

  return {
    assumptions,
    setAssumptions,
    savedAssumptions,
    hasUnsavedChanges,
    save,
    saving,
    savedIndicator,
    loading,
  };
}
