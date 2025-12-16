// Simple target group detection and storage helpers used by Hero and banner.
// This is intentionally lightweight and safe to run on both client and server.

export type TargetGroup = "default" | "startups" | "sme" | "advisors" | "universities";

export interface TargetGroupDetection {
  targetGroup: TargetGroup;
  source: "local_storage" | "url_param" | "fallback";
  raw?: Record<string, any>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readFromLocalStorage(): TargetGroup | null {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem("selectedTargetGroup");
    if (!value) return null;
    if (["startups", "sme", "advisors", "universities"].includes(value)) {
      return value as TargetGroup;
    }
    return "default";
  } catch {
    return null;
  }
}

function readFromUrl(): TargetGroup | null {
  if (!isBrowser()) return null;
  try {
    const url = new URL(window.location.href);
    const param =
      url.searchParams.get("targetGroup") ||
      url.searchParams.get("tg") ||
      url.searchParams.get("segment");

    if (!param) return null;

    const normalized = param.toLowerCase();
    if (normalized.includes("startup") || normalized === "founder") return "startups";
    if (normalized.includes("sme")) return "sme";
    if (normalized.includes("advisor") || normalized.includes("consult")) return "advisors";
    if (normalized.includes("university") || normalized.includes("uni")) return "universities";

    return "default";
  } catch {
    return null;
  }
}

export function detectTargetGroup(): TargetGroupDetection {
  // 1) Explicit selection stored in localStorage
  const fromStorage = readFromLocalStorage();
  if (fromStorage && fromStorage !== "default") {
    return {
      targetGroup: fromStorage,
      source: "local_storage",
    };
  }

  // 2) Heuristic from URL parameters (campaigns, deep links, etc.)
  const fromUrl = readFromUrl();
  if (fromUrl && fromUrl !== "default") {
    return {
      targetGroup: fromUrl,
      source: "url_param",
    };
  }

  // 3) Fallback
  return {
    targetGroup: "default",
    source: "fallback",
  };
}

export function storeTargetGroupSelection(targetGroup: TargetGroup): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem("selectedTargetGroup", targetGroup);
  } catch {
    // Non-critical, ignore storage errors
  }
}


