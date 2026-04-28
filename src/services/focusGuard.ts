// FocusGuard — singleton service for distraction / focus-loss detection.
// No React or Supabase dependencies — pure browser APIs only.
// The useFocusAudit hook owns the React lifecycle and Supabase sync.

export type FocusEventType =
  | "tab_hidden"
  | "window_blur"
  | "window_focus"
  | "fullscreen_exit"
  | "split_screen_warning"
  | "page_unload"
  | "violation_dismissed"
  | "session_suspended";

export interface FocusEvent {
  type: FocusEventType;
  timestamp: number;
  durationMs?: number;
}

type ViolationCb = (event: FocusEvent) => void;
type RestoreCb = () => void;

// A window narrower than 60% of the physical screen suggests split-screen.
const SPLIT_THRESHOLD = 0.6;

// Poll hasFocus() every 2 s as a fallback for environments where blur/focus
// events are delayed (e.g. some mobile browsers, certain iframe setups).
const POLL_MS = 2_000;

// Debounce split-screen warnings to at most once every 10 s.
const SPLIT_DEBOUNCE_MS = 10_000;

class FocusGuard {
  private _events: FocusEvent[] = [];
  private _violationCbs = new Set<ViolationCb>();
  private _restoreCbs = new Set<RestoreCb>();

  private _active = false;
  private _violationActive = false; // prevents double-firing for same blur
  private _blurStart: number | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _lastSplitWarning = 0;
  private _suppressedUntil = 0;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  start() {
    if (this._active) return;
    this._active = true;
    this._violationActive = false;
    this._blurStart = null;

    document.addEventListener("visibilitychange", this._onVisibility);
    window.addEventListener("blur", this._onBlur);
    window.addEventListener("focus", this._onFocus);
    window.addEventListener("resize", this._onResize);
    window.addEventListener("beforeunload", this._onUnload);
    document.addEventListener("fullscreenchange", this._onFullscreen);

    this._pollTimer = setInterval(this._poll, POLL_MS);
  }

  stop() {
    if (!this._active) return;
    this._active = false;

    document.removeEventListener("visibilitychange", this._onVisibility);
    window.removeEventListener("blur", this._onBlur);
    window.removeEventListener("focus", this._onFocus);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("beforeunload", this._onUnload);
    document.removeEventListener("fullscreenchange", this._onFullscreen);

    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  // Mute violation callbacks for a given duration (e.g. during clipboard ops).
  suppressFor(ms: number) {
    this._suppressedUntil = Date.now() + ms;
  }

  // ── Fullscreen ───────────────────────────────────────────────────────────

  // Must be called from a user-gesture handler (button click), never on mount.
  async enterFullscreen(): Promise<void> {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // User denied or browser limitation — silently ignore
    }
  }

  isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  // ── Callbacks ────────────────────────────────────────────────────────────

  onViolation(cb: ViolationCb) {
    this._violationCbs.add(cb);
  }

  offViolation(cb: ViolationCb) {
    this._violationCbs.delete(cb);
  }

  onRestore(cb: RestoreCb) {
    this._restoreCbs.add(cb);
  }

  offRestore(cb: RestoreCb) {
    this._restoreCbs.delete(cb);
  }

  // ── Event log ────────────────────────────────────────────────────────────

  getEvents(): FocusEvent[] {
    return [...this._events];
  }

  clearEvents() {
    this._events = [];
  }

  // Called by useFocusAudit when the student dismisses the overlay.
  logDismissal() {
    this._push({ type: "violation_dismissed", timestamp: Date.now() });
  }

  // Called by useFocusAudit when the countdown expires.
  logSuspension() {
    this._push({ type: "session_suspended", timestamp: Date.now() });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _push(event: FocusEvent) {
    this._events.push(event);
  }

  // Fires violation callbacks only once per focus-loss episode.
  private _fireViolation(event: FocusEvent) {
    this._push(event);
    if (this._violationActive) return;
    if (Date.now() < this._suppressedUntil) return; // muted (e.g. during clipboard write)
    this._violationActive = true;
    this._violationCbs.forEach((cb) => cb(event));
  }

  // Fires restore callbacks only when we were actually in violation state.
  private _fireRestore() {
    if (!this._violationActive) return;
    this._violationActive = false;
    this._restoreCbs.forEach((cb) => cb());
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  // Tab hidden / visible (most reliable signal for tab switching).
  private _onVisibility = () => {
    if (document.visibilityState === "hidden") {
      this._blurStart = Date.now();
      this._fireViolation({ type: "tab_hidden", timestamp: Date.now() });
    } else {
      if (!this._violationActive) return;
      const dur = this._blurStart ? Date.now() - this._blurStart : undefined;
      this._blurStart = null;
      this._push({ type: "window_focus", timestamp: Date.now(), durationMs: dur });
      this._fireRestore();
    }
  };

  // Window blur = alt-tab / cmd-tab / clicking another native app.
  // Skip if tab is already hidden (visibilitychange handles that path).
  private _onBlur = () => {
    if (document.visibilityState === "hidden") return;
    if (!this._blurStart) this._blurStart = Date.now();
    this._fireViolation({ type: "window_blur", timestamp: Date.now() });
  };

  private _onFocus = () => {
    if (!this._violationActive) return;
    if (document.visibilityState === "hidden") return;
    const dur = this._blurStart ? Date.now() - this._blurStart : undefined;
    this._blurStart = null;
    this._push({ type: "window_focus", timestamp: Date.now(), durationMs: dur });
    this._fireRestore();
  };

  // Polling fallback — catches cases where blur event is delayed or missed
  // (some mobile browsers, embedded iframes, etc.).
  private _poll = () => {
    if (!this._active) return;
    const visible = document.visibilityState === "visible";
    const focused = visible && document.hasFocus();

    if (!focused && !this._violationActive) {
      if (!this._blurStart) this._blurStart = Date.now();
      this._fireViolation({ type: "window_blur", timestamp: Date.now() });
    } else if (focused && this._violationActive) {
      const dur = this._blurStart ? Date.now() - this._blurStart : undefined;
      this._blurStart = null;
      this._push({ type: "window_focus", timestamp: Date.now(), durationMs: dur });
      this._fireRestore();
    }
  };

  // Heuristic split-screen detection: window significantly narrower than screen.
  // Logged as a warning only — no overlay fires.
  private _onResize = () => {
    const ratio = window.innerWidth / window.screen.width;
    if (ratio < SPLIT_THRESHOLD) {
      const now = Date.now();
      if (now - this._lastSplitWarning > SPLIT_DEBOUNCE_MS) {
        this._lastSplitWarning = now;
        this._push({ type: "split_screen_warning", timestamp: now });
      }
    }
  };

  // Best-effort on mobile swipe-away / tab close.
  private _onUnload = () => {
    this._push({ type: "page_unload", timestamp: Date.now() });
  };

  // Fullscreen exit is a hard violation — treat same as window blur.
  private _onFullscreen = () => {
    if (!document.fullscreenElement && this._active) {
      this._fireViolation({ type: "fullscreen_exit", timestamp: Date.now() });
    }
  };
}

// Module-level singleton — one instance shared across all React renders.
export const focusGuard = new FocusGuard();
