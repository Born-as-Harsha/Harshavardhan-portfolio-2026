import { useEffect, useState } from "react";
import { telemetryPanelEnabled } from "@/lib/telemetry";
import { verifyDebugToken } from "@/lib/debug-gate.functions";

/**
 * Production exposure rules for the debug panel:
 *  - dev builds: always on (`?debug=0` opts out)
 *  - production: `?debug=1` alone does NOTHING. An operator must supply
 *    `?debugToken=<exp>.<hmac>`, which is verified server-side against
 *    DEBUG_PANEL_SECRET and audit-logged. A verified grant is cached in
 *    sessionStorage only (never localStorage) so it dies with the tab.
 */
const GRANT_KEY = "lv:debug-grant";

export function useDebugPanelEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    if (import.meta.env.DEV) {
      setEnabled(telemetryPanelEnabled());
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("debugToken");

    if (!token) {
      try {
        setEnabled(window.sessionStorage.getItem(GRANT_KEY) === "1");
      } catch {
        setEnabled(false);
      }
      return;
    }

    void verifyDebugToken({ data: { token, route: window.location.pathname } })
      .then((res) => {
        if (!active) return;
        setEnabled(res.allowed);
        try {
          if (res.allowed) window.sessionStorage.setItem(GRANT_KEY, "1");
          else window.sessionStorage.removeItem(GRANT_KEY);
        } catch {
          /* storage blocked */
        }
      })
      .catch(() => active && setEnabled(false));

    return () => {
      active = false;
    };
  }, []);

  return enabled;
}