import axios from "axios";

// --- Core API Utility ---
export const emdxApiCall = async (baseUrl, endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.authToken && { Authorization: options.authToken }),
    ...options.headers,
  };

  try {
    const response = await axios({ url, headers, ...options });
    return response.data;
  } catch (error) {
    const status = error.response?.status;

    // 422 is expected when no rules/config exists - don't log as error
    if (status === 422) {
      // Return empty result for list operations
      if (options.method === "GET" || !options.method) {
        return { rules: [], count: 0 };
      }
    }

    // Log detailed error information for other errors
    console.error("EMDX API Call Failed:", {
      url,
      method: options.method || "GET",
      data: options.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });

    // Include response data in error message if available
    const errorDetails = error.response?.data
      ? ` - ${JSON.stringify(error.response.data)}`
      : "";

    throw new Error(
      `EMDX API Error: ${error.response?.status || "Unknown"} - ${
        error.response?.statusText || error.message
      }${errorDetails}`
    );
  }
};

// =========================
// === Health Check      ===
// =========================

// Check service health
export const getHealth = (baseUrl, authToken) =>
  emdxApiCall(baseUrl, "/core/healthz", { authToken });

// =========================
// === Alert Rules       ===
// =========================

// FOV Alert Rules
export const listFovAlertRules = (baseUrl, authToken, sensorId = null) => {
  const endpoint = sensorId
    ? `/config/rule/alerts/fov?sensorId=${sensorId}`
    : "/config/rule/alerts/fov";
  return emdxApiCall(baseUrl, endpoint, { authToken });
};

export const createFovAlertRule = (baseUrl, authToken, ruleData) =>
  emdxApiCall(baseUrl, "/config/rule/alerts/fov", {
    method: "POST",
    data: ruleData,
    authToken,
  });

export const deleteFovAlertRule = (baseUrl, authToken, ruleId, sensorId) => {
  const params = new URLSearchParams();
  params.append("ruleId", ruleId);
  if (sensorId) params.append("sensorId", sensorId);

  return emdxApiCall(baseUrl, `/config/rule/alerts/fov?${params.toString()}`, {
    method: "DELETE",
    authToken,
  });
};

// Tripwire Alert Rules
export const listTripwireAlertRules = (baseUrl, authToken, sensorId = null) => {
  const endpoint = sensorId
    ? `/api/v2/config/rule/alerts/tripwire?sensorId=${sensorId}`
    : "/api/v2/config/rule/alerts/tripwire";
  return emdxApiCall(baseUrl, endpoint, {
    authToken,
    headers: { "User-Type": "Admin" },
  });
};

export const createTripwireAlertRule = (baseUrl, authToken, ruleData) =>
  emdxApiCall(baseUrl, "/api/v2/config/rule/alerts/tripwire", {
    method: "POST",
    data: ruleData,
    authToken,
    headers: { "User-Type": "Admin" },
  });

export const deleteTripwireAlertRule = (
  baseUrl,
  authToken,
  ruleId,
  sensorId,
  tripwireId
) => {
  // API requires all three parameters
  if (!ruleId || !sensorId || !tripwireId) {
    console.error("Missing required parameters for deleteTripwireAlertRule:", {
      ruleId,
      sensorId,
      tripwireId,
    });
    throw new Error(
      `Missing required parameters: ${!ruleId ? "ruleId " : ""}${
        !sensorId ? "sensorId " : ""
      }${!tripwireId ? "tripwireId" : ""}`
    );
  }

  const params = new URLSearchParams();
  params.append("ruleId", ruleId);
  params.append("sensorId", sensorId);
  params.append("tripwireId", tripwireId);

  return emdxApiCall(
    baseUrl,
    `/api/v2/config/rule/alerts/tripwire?${params.toString()}`,
    {
      method: "DELETE",
      authToken,
      headers: { "User-Type": "Admin" },
    }
  );
};

// ROI Alert Rules
export const listRoiAlertRules = (baseUrl, authToken, sensorId = null) => {
  const endpoint = sensorId
    ? `/config/rule/alerts/roi?sensorId=${sensorId}`
    : "/config/rule/alerts/roi";
  return emdxApiCall(baseUrl, endpoint, { authToken });
};

export const createRoiAlertRule = (baseUrl, authToken, ruleData) =>
  emdxApiCall(baseUrl, "/config/rule/alerts/roi", {
    method: "POST",
    data: ruleData,
    authToken,
  });

export const deleteRoiAlertRule = (
  baseUrl,
  authToken,
  ruleId,
  sensorId,
  roiId
) => {
  const params = new URLSearchParams();
  params.append("ruleId", ruleId);
  if (sensorId) params.append("sensorId", sensorId);
  if (roiId) params.append("roiId", roiId);

  return emdxApiCall(baseUrl, `/config/rule/alerts/roi?${params.toString()}`, {
    method: "DELETE",
    authToken,
  });
};

// =========================
// === Alerts            ===
// =========================

// Get all alerts
export const getAlerts = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/alerts", { authToken, params });

// Get alerts count
export const getAlertsCount = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/alerts/count", { authToken, params });

// Get FOV alerts
export const getFovAlerts = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/alerts/fov", { authToken, params });

// Get Tripwire alerts
export const getTripwireAlerts = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/alerts/tripwire", { authToken, params });

// Get ROI alerts
export const getRoiAlerts = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/alerts/roi", { authToken, params });

// =========================
// === Configuration     ===
// =========================

// Get all config
export const getAllConfig = (baseUrl, authToken) =>
  emdxApiCall(baseUrl, "/config", { authToken });

// Update all config
export const updateAllConfig = (baseUrl, authToken, configData) =>
  emdxApiCall(baseUrl, "/config", {
    method: "POST",
    data: configData,
    authToken,
  });

// Get sensors config
export const getSensorsConfig = (baseUrl, authToken) =>
  emdxApiCall(baseUrl, "/config/sensors", { authToken });

// Update sensors config
export const updateSensorsConfig = (baseUrl, authToken, sensorsData) =>
  emdxApiCall(baseUrl, "/config/sensors", {
    method: "POST",
    data: sensorsData,
    authToken,
  });

// Get ROIs config (v2 API)
export const getRoisConfig = (baseUrl, authToken, sensorId = null) => {
  const endpoint = sensorId
    ? `/api/v2/config/roi?sensorId=${sensorId}`
    : "/api/v2/config/roi";
  return emdxApiCall(baseUrl, endpoint, {
    authToken,
    headers: { "User-Type": "Admin" },
  });
};

// Update ROIs config (legacy, may not be supported)
export const updateRoisConfig = (baseUrl, authToken, roisData) =>
  emdxApiCall(baseUrl, "/config/rois", {
    method: "PUT",
    data: roisData,
    authToken,
    headers: {
      "User-Type": "Admin", // Required by EMDX API
    },
  });

// Create/Update ROI Configuration (v2 API)
export const createRoiConfig = (baseUrl, authToken, sensorId, configData) =>
  emdxApiCall(baseUrl, `/api/v2/config/roi?sensorId=${sensorId}`, {
    method: "POST",
    data: configData,
    authToken,
    headers: {
      "User-Type": "Admin", // Required by EMDX API
    },
  });

// Get Tripwires config (v2 API)
export const getTripwiresConfig = (baseUrl, authToken, sensorId = null) => {
  const endpoint = sensorId
    ? `/api/v2/config/tripwire?sensorId=${sensorId}`
    : "/api/v2/config/tripwire";
  return emdxApiCall(baseUrl, endpoint, {
    authToken,
    headers: { "User-Type": "Admin" },
  });
};

// Update Tripwires config
export const updateTripwiresConfig = (baseUrl, authToken, tripwiresData) =>
  emdxApiCall(baseUrl, "/config/tripwires", {
    method: "POST",
    data: tripwiresData,
    authToken,
  });

// Create/Update Tripwire Configuration (v2 API)
export const createTripwireConfig = (
  baseUrl,
  authToken,
  sensorId,
  configData
) =>
  emdxApiCall(baseUrl, `/api/v2/config/tripwire?sensorId=${sensorId}`, {
    method: "POST",
    data: configData,
    authToken,
    headers: {
      "User-Type": "Admin", // Required by EMDX API
    },
  });

// Delete Tripwire Configuration (v2 API)
export const deleteTripwireConfig = (
  baseUrl,
  authToken,
  sensorId,
  tripwireId = null,
  deleteIfPresent = false
) => {
  let endpoint = `/api/v2/config/tripwire?sensorId=${sensorId}`;
  if (tripwireId) {
    endpoint += `&tripwireId=${tripwireId}`;
  }
  if (deleteIfPresent) {
    endpoint += `&deleteIfPresent=true`;
  }
  return emdxApiCall(baseUrl, endpoint, {
    method: "DELETE",
    authToken,
    headers: {
      "User-Type": "Admin",
    },
  });
};

// Delete ROI Configuration (v2 API)
export const deleteRoiConfig = (
  baseUrl,
  authToken,
  sensorId,
  roiId = null,
  deleteIfPresent = false
) => {
  let endpoint = `/api/v2/config/roi?sensorId=${sensorId}`;
  if (roiId) {
    endpoint += `&roiId=${roiId}`;
  }
  if (deleteIfPresent) {
    endpoint += `&deleteIfPresent=true`;
  }
  return emdxApiCall(baseUrl, endpoint, {
    method: "DELETE",
    authToken,
    headers: {
      "User-Type": "Admin",
    },
  });
};

// =========================
// === Analytics/Metrics ===
// =========================

// Get frames (object detection data)
export const getFrames = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/frames", { authToken, params });

// Get metrics
export const getMetrics = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/metrics", { authToken, params });

// Get histograms
export const getHistograms = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/histograms", { authToken, params });

// Get ROI histograms
export const getRoiHistograms = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/roi/histograms", { authToken, params });

// Get FOV occupancy histogram
export const getFovOccupancyHistogram = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/fov/occupancy/histogram", { authToken, params });

// Get FOV occupancy count
export const getFovOccupancyCount = (baseUrl, authToken, params = {}) =>
  emdxApiCall(baseUrl, "/fov/occupancy/count", { authToken, params });

// =========================
// === Tripwire Metrics  ===
// =========================

/**
 * Get Tripwire Histogram - Retrieve histogram of crossing counts for a tripwire
 *
 * Returns time-bucketed counts of objects crossing the tripwire line, broken down by:
 * - Direction (IN/OUT)
 * - Object type (Person, Vehicle, etc.) - optional
 *
 * @param {string} baseUrl - EMDX API base URL
 * @param {string} authToken - Authentication token
 * @param {Object} params - Query parameters
 * @param {string} params.sensorId - Sensor ID (required)
 * @param {string} params.tripwireId - Tripwire ID (required)
 * @param {string} params.fromTimestamp - Start time in ISO 8601 format (required) e.g., "2020-10-30T20:00:00.000Z"
 * @param {string} params.toTimestamp - End time in ISO 8601 format (optional, defaults to now)
 * @param {number} params.bucketSizeInSec - Histogram bucket size in seconds (optional, min=1, max=86400)
 * @param {string} params.objectType - Object types to filter (optional)
 *                                      - "*" for all types
 *                                      - "Person,Vehicle" for specific types
 *                                      - omit for cumulative counts only
 * @returns {Promise} Histogram data with counts per time bucket
 *
 * Example response:
 * {
 *   "bucketSizeInSec": "1",
 *   "tripwires": [{
 *     "id": "door_1",
 *     "histogram": [{
 *       "start": "2020-01-26T19:16:29.000Z",
 *       "end": "2020-01-26T19:16:30.000Z",
 *       "events": [
 *         { "type": "IN", "objects": [{ "type": "Person", "count": 1 }] },
 *         { "type": "OUT", "objects": [{ "type": "Person", "count": 2 }] }
 *       ]
 *     }]
 *   }]
 * }
 */
export const getTripwireHistogram = (baseUrl, authToken, params = {}) => {
  // Build query string from params
  const queryParams = new URLSearchParams();

  // Required parameters
  if (params.sensorId) queryParams.append("sensorId", params.sensorId);
  if (params.tripwireId) queryParams.append("tripwireId", params.tripwireId);
  if (params.fromTimestamp)
    queryParams.append("fromTimestamp", params.fromTimestamp);

  // Optional parameters
  if (params.toTimestamp) queryParams.append("toTimestamp", params.toTimestamp);
  if (params.bucketSizeInSec)
    queryParams.append("bucketSizeInSec", params.bucketSizeInSec);
  if (params.objectType) queryParams.append("objectType", params.objectType);

  const endpoint = `/api/v2/metrics/tripwire/histogram?${queryParams.toString()}`;

  return emdxApiCall(baseUrl, endpoint, {
    authToken,
    headers: { "User-Type": "Admin" },
  });
};

/**
 * Get Tripwire Total Counts - Retrieve aggregate crossing counts for a tripwire
 *
 * Returns total counts of objects crossing the tripwire for the specified time range,
 * broken down by direction (IN/OUT) and optionally by object type.
 *
 * @param {string} baseUrl - EMDX API base URL
 * @param {string} authToken - Authentication token
 * @param {Object} params - Query parameters
 * @param {string} params.sensorId - Sensor ID (required)
 * @param {string} params.tripwireId - Tripwire ID (required)
 * @param {string} params.fromTimestamp - Start time in ISO 8601 format (required)
 * @param {string} params.toTimestamp - End time in ISO 8601 format (optional, defaults to now)
 * @param {string} params.objectType - Object types to filter (optional)
 *                                      - "*" for all types
 *                                      - "Person,Vehicle" for specific types
 *                                      - omit for cumulative counts only
 * @returns {Promise} Total count data
 *
 * Example response:
 * {
 *   "tripwireKpis": [{
 *     "id": "door1",
 *     "events": [
 *       {
 *         "type": "IN",
 *         "objects": [{ "type": "Person", "count": 2 }]
 *       },
 *       {
 *         "type": "OUT",
 *         "objects": [{ "type": "Person", "count": 1 }]
 *       }
 *     ]
 *   }]
 * }
 */
export const getTripwireCount = (baseUrl, authToken, params = {}) => {
  // Build query string from params
  const queryParams = new URLSearchParams();

  // Required parameters
  if (params.sensorId) queryParams.append("sensorId", params.sensorId);
  if (params.tripwireId) queryParams.append("tripwireId", params.tripwireId);
  if (params.fromTimestamp)
    queryParams.append("fromTimestamp", params.fromTimestamp);

  // Optional parameters
  if (params.toTimestamp) queryParams.append("toTimestamp", params.toTimestamp);
  if (params.objectType) queryParams.append("objectType", params.objectType);

  const endpoint = `/api/v2/metrics/tripwire/count?${queryParams.toString()}`;

  return emdxApiCall(baseUrl, endpoint, {
    authToken,
    headers: { "User-Type": "Admin" },
  });
};

/**
 * Get Tripwire Alerts - Retrieve triggered alerts for tripwire rules
 *
 * Returns alerts that were triggered based on tripwire alert rules (flowrate or increment).
 * Supports pagination and time-based filtering.
 *
 * @param {string} baseUrl - EMDX API base URL
 * @param {string} authToken - Authentication token
 * @param {Object} params - Query parameters
 * @param {string} params.sensorId - Sensor ID (required)
 * @param {string} params.fromTimestamp - Start time in ISO 8601 format (required)
 * @param {string} params.toTimestamp - End time in ISO 8601 format (optional, defaults to now)
 * @param {number} params.limit - Max number of alerts to return (optional)
 * @returns {Promise} Alert data
 *
 * Example response:
 * {
 *   "alerts": [{
 *     "id": "unique-alert-id",
 *     "sensorId": "Amcrest_1",
 *     "type": "tripwire",
 *     "ruleType": "increment",
 *     "ruleId": "fb298ea4-30aa-4085-b860-42e37c5bf8d1",
 *     "count": 10,
 *     "direction": "entry",
 *     "directionName": "Inside the room",
 *     "description": "10 people entered tripwire",
 *     "startTimestamp": "2021-09-16T06:06:59.800Z",
 *     "endTimestamp": "2021-09-16T06:07:00.534Z",
 *     "duration": 0.734,
 *     "attributes": [
 *       { "name": "tripwireId", "value": "door1" },
 *       { "name": "tripwireName", "value": "Main Door" },
 *       { "name": "objects", "value": [{ "id": "1186", "type": "Person" }] }
 *     ]
 *   }]
 * }
 */
export const getTripwireAlertsV2 = (baseUrl, authToken, params = {}) => {
  // Build query string from params
  const queryParams = new URLSearchParams();

  // Required parameters
  if (params.sensorId) queryParams.append("sensorId", params.sensorId);
  if (params.fromTimestamp)
    queryParams.append("fromTimestamp", params.fromTimestamp);

  // Optional parameters
  if (params.toTimestamp) queryParams.append("toTimestamp", params.toTimestamp);
  if (params.limit) queryParams.append("limit", params.limit);

  const endpoint = `/api/v2/alerts/tripwire?${queryParams.toString()}`;

  return emdxApiCall(baseUrl, endpoint, {
    authToken,
    headers: { "User-Type": "Admin" },
  });
};
