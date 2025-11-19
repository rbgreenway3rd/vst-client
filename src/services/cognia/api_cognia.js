// --- Core API Utility ---
export const cogniaApiCall = async (baseUrl, endpoint, options = {}) => {
  const { method = "GET", data = null, authToken = "", params = {} } = options;

  const url = new URL(endpoint, baseUrl);

  // Add query params if provided
  if (params && Object.keys(params).length > 0) {
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = authToken;
  }

  const fetchOptions = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Cognia API call failed:", error);
    throw error;
  }
};

// =========================
// === Health Check      ===
// =========================

/**
 * Check Cognia API service health
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Optional auth token
 * @returns {Promise<Object>} Health status
 */
export const getHealth = (baseUrl, authToken) =>
  cogniaApiCall(baseUrl, "/health", { authToken });

// =========================
// === Alert History     ===
// =========================

/**
 * Get alert history with pagination and filtering
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {Object} params - Query parameters
 * @param {string} params.sensor_id - Filter by sensor ID
 * @param {string} params.alert_type - Filter by alert type (fov, tripwire, roi)
 * @param {string} params.severity - Filter by severity (info, warning, critical)
 * @param {number} params.from_timestamp - Start timestamp (Unix epoch)
 * @param {number} params.to_timestamp - End timestamp (Unix epoch)
 * @param {number} params.limit - Number of results per page (default: 50)
 * @param {number} params.offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Alert history with pagination metadata
 */
export const getAlertHistory = (baseUrl, authToken, params = {}) =>
  cogniaApiCall(baseUrl, "/api/alerts/history", { authToken, params });

/**
 * Get a specific alert by ID
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>} Alert details
 */
export const getAlertById = (baseUrl, authToken, alertId) =>
  cogniaApiCall(baseUrl, `/api/alerts/${alertId}`, { authToken });

/**
 * Get alert statistics for a time range
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {Object} params - Query parameters
 * @param {string} params.sensor_id - Filter by sensor ID
 * @param {number} params.from_timestamp - Start timestamp (Unix epoch)
 * @param {number} params.to_timestamp - End timestamp (Unix epoch)
 * @returns {Promise<Object>} Alert statistics (count by type, severity, etc.)
 */
export const getAlertStats = (baseUrl, authToken, params = {}) =>
  cogniaApiCall(baseUrl, "/api/alerts/stats", { authToken, params });

// =========================
// === Subscriptions     ===
// =========================

/**
 * Get all alert subscriptions for the current user
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @returns {Promise<Array>} List of subscriptions
 */
export const getSubscriptions = (baseUrl, authToken) =>
  cogniaApiCall(baseUrl, "/api/subscriptions", { authToken });

/**
 * Get subscriptions for a specific sensor
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {string} sensorId - Sensor ID
 * @returns {Promise<Array>} List of subscriptions for the sensor
 */
export const getSubscriptionsBySensor = (baseUrl, authToken, sensorId) =>
  cogniaApiCall(baseUrl, `/api/subscriptions/sensor/${sensorId}`, {
    authToken,
  });

/**
 * Create a new alert subscription
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {Object} subscriptionData - Subscription configuration
 * @param {string} subscriptionData.sensor_id - Sensor ID to subscribe to
 * @param {Array<string>} subscriptionData.alert_types - Alert types (fov, tripwire, roi)
 * @param {string} subscriptionData.notification_method - Delivery method (ntfy, email, webhook)
 * @param {Object} subscriptionData.notification_config - Method-specific config
 * @param {string} subscriptionData.severity_filter - Minimum severity (info, warning, critical)
 * @returns {Promise<Object>} Created subscription
 */
export const createSubscription = (baseUrl, authToken, subscriptionData) =>
  cogniaApiCall(baseUrl, "/api/subscriptions", {
    method: "POST",
    data: subscriptionData,
    authToken,
  });

/**
 * Update an existing subscription
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated subscription
 */
export const updateSubscription = (
  baseUrl,
  authToken,
  subscriptionId,
  updateData
) =>
  cogniaApiCall(baseUrl, `/api/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    data: updateData,
    authToken,
  });

/**
 * Delete a subscription
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<null>} Empty response on success
 */
export const deleteSubscription = (baseUrl, authToken, subscriptionId) =>
  cogniaApiCall(baseUrl, `/api/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    authToken,
  });

/**
 * Toggle subscription active status
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {string} subscriptionId - Subscription ID
 * @param {boolean} active - Active status
 * @returns {Promise<Object>} Updated subscription
 */
export const toggleSubscription = (
  baseUrl,
  authToken,
  subscriptionId,
  active
) => updateSubscription(baseUrl, authToken, subscriptionId, { active });

// =========================
// === User Management   ===
// =========================

/**
 * Get current user profile
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = (baseUrl, authToken) =>
  cogniaApiCall(baseUrl, "/api/user/profile", { authToken });

/**
 * Update notification preferences
 * @param {string} baseUrl - Base URL of Cognia API
 * @param {string} authToken - Auth token
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} Updated preferences
 */
export const updateNotificationPreferences = (
  baseUrl,
  authToken,
  preferences
) =>
  cogniaApiCall(baseUrl, "/api/user/preferences/notifications", {
    method: "PUT",
    data: preferences,
    authToken,
  });
