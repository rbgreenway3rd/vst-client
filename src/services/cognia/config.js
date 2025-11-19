export const COGNIA_CONFIG = {
  DEFAULT_BASE_URL: "http://192.168.1.26:8000",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,

  // Alert types that can be subscribed to
  ALERT_TYPES: {
    FOV: "fov",
    TRIPWIRE: "tripwire",
    ROI: "roi",
  },

  // Notification delivery methods
  NOTIFICATION_METHODS: {
    NTFY: "ntfy",
    EMAIL: "email",
    WEBHOOK: "webhook",
  },

  // Alert severity levels
  SEVERITY_LEVELS: {
    INFO: "info",
    WARNING: "warning",
    CRITICAL: "critical",
  },
};
