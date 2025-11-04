import axios from "axios";

// --- Core API Utility ---
export const apiCall = async (baseUrl, endpoint, options = {}) => {
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
    console.error("API Call Failed:", {
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
      `API Error: ${error.response?.status || "Unknown"} - ${
        error.response?.statusText || error.message
      }${errorDetails}`
    );
  }
};

// =========================
// === Sensor Management ===
// =========================

// Get list of sensors
export const getSensors = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/sensor/list", { authToken });

// Scan for sensors
export const scanSensors = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/sensor/scan", { method: "POST", authToken });

// Get sensor info
export const getSensorInfo = (baseUrl, authToken, id) =>
  apiCall(baseUrl, `/v1/sensor/${id}/info`, { authToken });

// Set sensor info
export const setSensorInfo = (baseUrl, authToken, id, info) =>
  apiCall(baseUrl, `/v1/sensor/${id}/info`, {
    method: "POST",
    data: info,
    authToken,
  });

// Get sensor settings
export const getSensorSettings = (baseUrl, authToken, id) =>
  apiCall(baseUrl, `/v1/sensor/${id}/settings`, { method: "GET", authToken });

// Set sensor settings
export const setSensorSettings = (baseUrl, authToken, id, settings) =>
  apiCall(baseUrl, `/v1/sensor/${id}/settings`, {
    method: "POST",
    data: settings,
    authToken,
  });

// Get sensor status
export const getSensorStatus = (baseUrl, authToken, id) =>
  apiCall(baseUrl, `/v1/sensor/${id}/status`, { authToken });

// Get all sensors status
export const getAllSensorsStatus = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/sensor/status", { authToken });

// Replace sensor
export const replaceSensor = (baseUrl, authToken, id, data) =>
  apiCall(baseUrl, `/v1/sensor/${id}/replace`, {
    method: "POST",
    data,
    authToken,
  });

// Set credentials for a sensor
export const setSensorCredentials = (baseUrl, authToken, id, credentials) =>
  apiCall(baseUrl, `/v1/sensor/${id}/credentials`, {
    method: "POST",
    data: credentials,
    authToken,
  });

// Add a sensor
export const addSensor = (baseUrl, authToken, sensorData) =>
  apiCall(baseUrl, "/v1/sensor/add", {
    method: "POST",
    data: sensorData,
    authToken,
  });

// Remove a sensor (soft delete - marks as state: "removed")
export const removeSensor = async (baseUrl, authToken, id) => {
  console.log("removeSensor API call (soft delete):", {
    endpoint: `/v1/sensor/${id}`,
    method: "DELETE",
    sensorId: id,
    fullUrl: `${baseUrl}/v1/sensor/${id}`,
  });

  // Try multiple approaches in case VST implementation varies
  try {
    // Approach 1: Try DELETE endpoint (standard REST)
    console.log(`🔄 METHOD 1: Trying DELETE /v1/sensor/${id}`);
    const result = await apiCall(baseUrl, `/v1/sensor/${id}`, {
      method: "DELETE",
      authToken,
      timeout: 10000, // 10 second timeout
    });
    console.log("✅ SUCCESS: DELETE method worked!");
    return result;
  } catch (deleteError) {
    console.warn(
      "❌ METHOD 1 FAILED: DELETE failed, trying alternative methods:",
      deleteError.message
    );

    // Approach 2: Try setting state to "removed" via sensor info endpoint
    try {
      console.log(
        `🔄 METHOD 2: Trying POST /v1/sensor/${id}/info with state='removed'`
      );
      const result = await apiCall(baseUrl, `/v1/sensor/${id}/info`, {
        method: "POST",
        data: { state: "removed" },
        authToken,
        timeout: 10000,
      });
      console.log("✅ SUCCESS: Setting state via /info worked!");
      return result;
    } catch (infoError) {
      console.warn(
        "❌ METHOD 2 FAILED: Setting state via /info failed:",
        infoError.message
      );

      // Approach 3: Try POST to /v1/sensor/remove
      try {
        console.log("🔄 METHOD 3: Trying POST /v1/sensor/remove");
        const result = await apiCall(baseUrl, `/v1/sensor/remove`, {
          method: "POST",
          data: { sensorId: id },
          authToken,
          timeout: 10000,
        });
        console.log("✅ SUCCESS: POST to /v1/sensor/remove worked!");
        return result;
      } catch (postError) {
        console.error("❌ ALL METHODS FAILED: All 3 removal methods failed");
        console.error("Method 1 error:", deleteError.message);
        console.error("Method 2 error:", infoError.message);
        console.error("Method 3 error:", postError.message);
        throw deleteError; // Throw the original error
      }
    }
  }
};

// Get sensor QoS stats
export const getSensorQOS = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/sensor/qos", { method: "GET", authToken });

// =====================
// === Live Stream   ===
// =====================

// Get list of available live streams
export const getLiveStreams = (baseUrl, authToken, params = {}) =>
  apiCall(baseUrl, "/v1/live/streams", { method: "GET", params, authToken });

// Get stream settings
export const getLiveStreamSettings = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/live/stream/settings", { method: "GET", authToken });

// Set stream settings
export const setLiveStreamSettings = (baseUrl, authToken, settings) =>
  apiCall(baseUrl, "/v1/live/stream/settings", {
    method: "POST",
    data: settings,
    authToken,
  });

// Get stream last played timestamp and metadata
export const queryLiveStream = (baseUrl, authToken, params = {}) =>
  apiCall(baseUrl, "/v1/live/stream/query", {
    method: "GET",
    params,
    authToken,
  });

// // Start live stream for a sensor
// export const startLiveStream = (baseUrl, authToken, sensorId) =>
//   apiCall(baseUrl, `/v1/sensor/${sensorId}/streams`, {
//     method: "GET",
//     authToken,
//   });
// Start WebRTC streaming - Use VST's official UI format
export const startLiveStream = (
  baseUrl,
  authToken,
  peerId,
  sdpOffer,
  sensorId
) => {
  const data = {
    streamId: sensorId, // VST uses streamId as the sensor ID
    peerId,
    options: {
      rtptransport: "udp",
      timeout: 60,
      quality: "auto",
    },
    sessionDescription: {
      type: "offer",
      sdp: sdpOffer,
    },
  };

  console.log("startLiveStream request (VST UI format):", {
    url: `${baseUrl}/v1/live/stream/start`,
    payload: data,
  });

  return apiCall(baseUrl, "/v1/live/stream/start", {
    method: "POST",
    data,
    authToken,
    timeout: 30000, // 30 second timeout
  });
};

// Switch stream type from recorded to live
export const swapToLiveStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/stream/swap", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Stop WebRTC streaming
export const stopLiveStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/stream/stop", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Pause recorded stream playback
export const pauseLiveStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/stream/pause", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Resume recorded stream playback
export const resumeLiveStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/stream/resume", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Get stream stats (e.g., frame rate, encoded/decoded frames)
export const getLiveStreamStats = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/stream/stats", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Get stream status (e.g., PLAYING, PAUSED, NOT PLAYING)
export const getLiveStreamStatus = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/stream/status", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Get picture (JPEG) from device
export const getLiveStreamPicture = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, `/v1/live/stream/${streamId}/picture`, {
    method: "GET",
    responseType: "blob",
    authToken,
  });

// Share SDP with live stream service
export const setLiveStreamAnswer = (baseUrl, authToken, streamId, sdpAnswer) =>
  apiCall(baseUrl, "/v1/live/setAnswer", {
    method: "POST",
    data: { stream_id: streamId, sdp_answer: sdpAnswer },
    authToken,
  });

// Add new remote ICE candidate
export const addIceCandidate = (baseUrl, authToken, streamId, candidate) =>
  apiCall(baseUrl, "/v1/live/iceCandidate", {
    method: "POST",
    data: { stream_id: streamId, candidate },
    authToken,
  });

// Get list of ICE candidates
export const getIceCandidates = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/live/iceCandidate", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Get ICE servers (STUN/TURN)
export const getIceServers = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/live/iceServers", { method: "GET", authToken });

// Get live stream service configuration
export const getLiveStreamConfiguration = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/live/configuration", { method: "GET", authToken });

// Set live stream service configuration
export const setLiveStreamConfiguration = (baseUrl, authToken, config) =>
  apiCall(baseUrl, "/v1/live/configuration", {
    method: "POST",
    data: config,
    authToken,
  });

// Get MS version
export const getLiveStreamVersion = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/live/version", { method: "GET", authToken });

// Get supported API list
export const getLiveStreamApiHelp = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/live/help", { method: "GET", authToken });

// ======================
// === Replay Stream  ===
// ======================

// Get list of available replay streams
export const getReplayStream = (baseUrl, authToken, params = {}) =>
  apiCall(baseUrl, "/v1/replay/streams", { method: "GET", params, authToken });

// Get replay stream settings
export const getReplayStreamSettings = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/replay/stream/settings", { method: "GET", authToken });

// Set replay stream settings
export const setReplayStreamSettings = (baseUrl, authToken, settings) =>
  apiCall(baseUrl, "/v1/replay/stream/settings", {
    method: "POST",
    data: settings,
    authToken,
  });

// Get stream last played timestamp and metadata
export const queryReplayStream = (baseUrl, authToken, params = {}) =>
  apiCall(baseUrl, "/v1/replay/stream/query", {
    method: "GET",
    params,
    authToken,
  });

// Start WebRTC replay streaming
export const startReplayStream = (
  baseUrl,
  authToken,
  streamId,
  sdpOffer,
  params = {}
) =>
  apiCall(baseUrl, "/v1/replay/stream/start", {
    method: "POST",
    data: { stream_id: streamId, sdp_offer: sdpOffer, ...params },
    authToken,
  });

// Switch stream type from live to recorded
export const swapToReplayStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/swap", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Stop WebRTC replay streaming
export const stopReplayStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/stop", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Pause replay stream playback
export const pauseReplayStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/pause", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Resume replay stream playback
export const resumeReplayStream = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/resume", {
    method: "POST",
    data: { stream_id: streamId },
    authToken,
  });

// Seek in replay stream (forward, backward, rewind, fast forward)
export const seekReplayStream = (baseUrl, authToken, streamId, seekParams) =>
  apiCall(baseUrl, "/v1/replay/stream/seek", {
    method: "POST",
    data: { stream_id: streamId, ...seekParams },
    authToken,
  });

// Get current position in replay stream
export const getReplayStreamPosition = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/seek", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Get replay stream status (e.g., PLAYING, PAUSED, NOT PLAYING)
export const getReplayStreamStatus = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/status", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Get picture (JPEG) from replay stream
export const getReplayStreamPicture = (
  baseUrl,
  authToken,
  streamId,
  params = {}
) =>
  apiCall(baseUrl, `/v1/replay/stream/${streamId}/picture`, {
    method: "GET",
    responseType: "blob",
    params,
    authToken,
  });

// Get replay stream stats (e.g., frame rate, encoded/decoded frames)
export const getReplayStreamStats = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/stream/stats", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Share SDP with replay stream service
export const setReplayStreamAnswer = (
  baseUrl,
  authToken,
  streamId,
  sdpAnswer
) =>
  apiCall(baseUrl, "/v1/replay/setAnswer", {
    method: "POST",
    data: { stream_id: streamId, sdp_answer: sdpAnswer },
    authToken,
  });

// Get list of ICE candidates
export const getReplayIceCandidates = (baseUrl, authToken, streamId) =>
  apiCall(baseUrl, "/v1/replay/iceCandidate", {
    method: "GET",
    params: { stream_id: streamId },
    authToken,
  });

// Add new remote ICE candidate
export const addReplayIceCandidate = (
  baseUrl,
  authToken,
  streamId,
  candidate
) =>
  apiCall(baseUrl, "/v1/replay/iceCandidate", {
    method: "POST",
    data: { stream_id: streamId, candidate },
    authToken,
  });

// Get ICE servers (STUN/TURN)
export const getReplayIceServers = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/replay/iceServers", { method: "GET", authToken });

// Get replay stream service configuration
export const getReplayStreamConfiguration = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/replay/configuration", { method: "GET", authToken });

// Set replay stream service configuration
export const setReplayStreamConfiguration = (baseUrl, authToken, config) =>
  apiCall(baseUrl, "/v1/replay/configuration", {
    method: "POST",
    data: config,
    authToken,
  });

// Get MS version
export const getReplayStreamVersion = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/replay/version", { method: "GET", authToken });

// Get supported API list
export const getReplayStreamApiHelp = (baseUrl, authToken) =>
  apiCall(baseUrl, "/v1/replay/help", { method: "GET", authToken });

// =======================
// === Stream Recorder ===
// =======================

// Start recording
export const startRecording = (
  baseUrl,
  authToken,
  streamIds,
  policy = "continuous"
) =>
  apiCall(baseUrl, "/recordings/start", {
    method: "POST",
    data: { stream_ids: streamIds, policy },
    authToken,
  });

// Stop recording
export const stopRecording = (baseUrl, authToken, streamIds) =>
  apiCall(baseUrl, "/recordings/stop", {
    method: "POST",
    data: { stream_ids: streamIds },
    authToken,
  });

// ======================
// === File Management ===
// ======================

// Get list of files
export const getFiles = (baseUrl, authToken) =>
  apiCall(baseUrl, "/files", { authToken });

// Delete a file
export const deleteFile = (baseUrl, authToken, fileId) =>
  apiCall(baseUrl, `/files/${fileId}`, { method: "DELETE", authToken });

// Download a file
export const downloadFile = (baseUrl, authToken, fileId) =>
  apiCall(baseUrl, `/files/${fileId}/download`, {
    authToken,
    responseType: "blob",
  });

// ==========================
// === RTSP Proxy Stream  ===
// ==========================

// Create RTSP proxy - Try multiple possible endpoints
export const createRTSPProxy = async (baseUrl, authToken, uri) => {
  const endpoints = [
    "/v1/proxy/rtsp/create", // Original attempt
    "/v1/rtsp/proxy/create", // Alternative 1
    "/v1/proxy/create", // Alternative 2
    "/rtsp/proxy/create", // Alternative 3
  ];

  let lastError;
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying RTSP proxy endpoint: ${endpoint}`);
      return await apiCall(baseUrl, endpoint, {
        method: "POST",
        data: { uri },
        authToken,
      });
    } catch (error) {
      console.warn(`Endpoint ${endpoint} failed:`, error.message);
      lastError = error;
      // Continue to next endpoint
    }
  }

  throw new Error(
    `All RTSP proxy endpoints failed. VST may not support RTSP→HLS conversion. ` +
      `Last error: ${lastError.message}`
  );
};
