---
name: supabase-hook
description: Use when writing or editing a custom React hook in src/hooks/ that calls supabase.from(), supabase.rpc(), or wraps an edge function. Loads any time a component needs new Supabase data, a new mutation, or a real-time subscription. Covers the React Query queryKey convention, the maybeSingle() rule, error rethrow, mutation+invalidate pattern, and real-time cleanup. Does not load for hooks that only manage local state.
---

# Supabase Data Hooks

Hooks own data fetching. Components and pages should not call `supabase` directly — they consume a hook.

## Query pattern

```ts
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}
```

- **`maybeSingle()`, not `single()`** — `single()` throws on zero rows, which is a valid empty state, not an error
- Rethrow Supabase errors so React Query's `error` state fires
- Guard with `enabled` when the key argument can be falsy

## queryKey convention

`[entity, ...identifiers]` — e.g. `["session", sessionId]`, `["student-sessions", sessionId]`, `["courses", teacherId, "list"]`. Mutations invalidate by the same prefix.

## Mutation pattern

```ts
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (payload: Payload) => {
    const { error } = await supabase.from("table").insert(payload);
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entity"] }),
  onError: (err) => toast.error(err.message),
});
```

- Invalidate on success — don't manually setQueryData unless there's a clear reason
- User-facing errors go through `toast.error()` from `sonner`
- Don't silently swallow errors

## Real-time subscriptions

```ts
useEffect(() => {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "student_sessions" }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ["student-sessions", sessionId] });
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [sessionId, queryClient]);
```

Always remove the channel in the cleanup function — leaked channels accumulate and break re-subscribes.

## Don't

- Don't call `supabase` from a component — write a hook
- Don't use `single()` — use `maybeSingle()`
- Don't return Supabase's raw `{ data, error }` from the hook — consumers should get `data | undefined` and React Query's flags
- Don't fetch inside `useEffect` if React Query would do it — that bypasses caching, retries, and dedup
