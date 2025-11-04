export const EMDX_CONFIG = {
  DEFAULT_BASE_URL: "http://192.168.1.26:5000",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,

  // Alert types
  ALERT_TYPES: {
    FOV: "fov",
    TRIPWIRE: "tripwire",
    ROI: "roi",
  },

  // Object types for analytics
  OBJECT_TYPES: [
    "person",
    "vehicle",
    "bicycle",
    "motorcycle",
    "car",
    "truck",
    "bus",
  ],
};
