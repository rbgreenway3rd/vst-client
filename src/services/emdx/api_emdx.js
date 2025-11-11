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
    // Log detailed error information
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

export const deleteFovAlertRule = (baseUrl, authToken, ruleId) =>
  emdxApiCall(baseUrl, `/config/rule/alerts/fov?rule_id=${ruleId}`, {
    method: "DELETE",
    authToken,
  });

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

export const deleteTripwireAlertRule = (baseUrl, authToken, ruleId) =>
  emdxApiCall(
    baseUrl,
    `/api/v2/config/rule/alerts/tripwire?rule_id=${ruleId}`,
    {
      method: "DELETE",
      authToken,
      headers: { "User-Type": "Admin" },
    }
  );

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

export const deleteRoiAlertRule = (baseUrl, authToken, ruleId) =>
  emdxApiCall(baseUrl, `/config/rule/alerts/roi?rule_id=${ruleId}`, {
    method: "DELETE",
    authToken,
  });

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
export const createRoiConfig = (
  baseUrl,
  authToken,
  sensorId,
  configData
) =>
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
