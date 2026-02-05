// Lightweight analytics wrapper used across the app.
// In production, you can wire this to your real analytics/telemetry pipeline.

type Properties = Record<string, any>;

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function logToConsole(event: string, payload: any) {
  // Keep logging very lightweight to avoid flooding the console in production.
  if (process.env.NODE_ENV === "development") {
     
    console.debug("[analytics]", event, payload);
  }
}

function trackPageView(path: string, title?: string, properties: Properties = {}) {
  const win = safeWindow();
  const payload = {
    path,
    title: title ?? win?.document?.title,
    ...properties,
  };

  // Example integration point for gtag / other trackers:
  try {
    if (win && (win as any).gtag) {
      (win as any).gtag("event", "page_view", {
        page_path: path,
        page_title: payload.title,
        ...properties,
      });
    } else {
      logToConsole("page_view", payload);
    }
  } catch {
    // Swallow errors to avoid breaking the app due to analytics.
    logToConsole("page_view_error", payload);
  }
}

function trackUserAction(event: string, properties: Properties = {}) {
  const win = safeWindow();
  const payload = {
    event,
    ...properties,
  };

  try {
    if (win && (win as any).gtag) {
      (win as any).gtag("event", event, properties);
    } else {
      logToConsole("user_action", payload);
    }
  } catch {
    logToConsole("user_action_error", payload);
  }
}

// Optional: used by some back-office / deletion flows
function trackError(event: string, error: unknown, properties: Properties = {}) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

  trackUserAction(event, { ...properties, error: message });
}

const analytics = {
  trackPageView,
  trackUserAction,
  trackError,
};

export type { Properties as AnalyticsProperties };
export default analytics;



