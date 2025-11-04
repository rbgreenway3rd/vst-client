/**
 * StreamingGatewayClient - JavaScript client for interacting with the streaming-gateway API
 *
 * @example
 * const client = new StreamingGatewayClient('http://192.168.1.26:30010');
 *
 * // Get all streams
 * const streams = await client.getStreams();
 *
 * // Capture snapshot
 * const blob = await client.getSnapshot('camera-id');
 *
 * // Start WebRTC stream
 * await client.startWebRTCStream('camera-id', videoElement);
 */
class StreamingGatewayClient {
  /**
   * @param {string} baseUrl - Base URL of the streaming-gateway API (e.g., 'http://192.168.1.26:30010')
   * @param {Object} options - Optional configuration
   * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = options.timeout || 30000;
    this.activePeerConnections = new Map(); // Track active WebRTC connections
  }

  // ========================================================================
  // Health & Info
  // ========================================================================

  /**
   * Check service health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    return this._fetch("/api/health");
  }

  /**
   * Get service information
   * @returns {Promise<Object>} Service info including version and features
   */
  async getInfo() {
    return this._fetch("/api/info");
  }

  // ========================================================================
  // Stream Management
  // ========================================================================

  /**
   * List all available streams
   * @returns {Promise<Object>} Object with count and streams array
   */
  async getStreams() {
    return this._fetch("/api/streams");
  }

  /**
   * Get details for a specific stream
   * @param {string} streamId - Stream identifier
   * @returns {Promise<Object>} Stream details
   */
  async getStream(streamId) {
    return this._fetch(`/api/streams/${streamId}`);
  }

  /**
   * List only camera streams (convenience method)
   * @returns {Promise<Object>} Object with count and cameras array
   */
  async getCameras() {
    return this._fetch("/api/cameras");
  }

  /**
   * Force refresh/sync with VST
   * @returns {Promise<Object>} Sync status
   */
  async refreshStreams() {
    return this._fetch("/api/streams/refresh", { method: "POST" });
  }

  /**
   * Get WebRTC connection information for a stream
   * @param {string} streamId - Stream identifier
   * @returns {Promise<Object>} WebRTC connection details
   */
  async getWebRTCInfo(streamId) {
    return this._fetch(`/api/streams/${streamId}/webrtc`);
  }

  // ========================================================================
  // Snapshots
  // ========================================================================

  /**
   * Capture a snapshot from a stream
   * @param {string} streamId - Stream identifier
   * @param {Object} options - Snapshot options
   * @param {number} options.width - Target width in pixels
   * @param {number} options.height - Target height in pixels
   * @returns {Promise<Blob>} JPEG image as Blob
   */
  async getSnapshot(streamId, options = {}) {
    const params = new URLSearchParams();
    if (options.width) params.append("width", options.width);
    if (options.height) params.append("height", options.height);

    const url = `/api/snapshot/${streamId}${
      params.toString() ? "?" + params.toString() : ""
    }`;

    const response = await fetch(this.baseUrl + url, {
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to capture snapshot: ${response.status} ${response.statusText}`
      );
    }

    return response.blob();
  }

  /**
   * Capture a snapshot as base64-encoded data URL
   * @param {string} streamId - Stream identifier
   * @param {Object} options - Snapshot options
   * @param {number} options.width - Target width in pixels
   * @param {number} options.height - Target height in pixels
   * @returns {Promise<string>} Data URL (data:image/jpeg;base64,...)
   */
  async getSnapshotDataURL(streamId, options = {}) {
    const blob = await this.getSnapshot(streamId, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Capture a snapshot as base64 JSON (from API endpoint)
   * @param {string} streamId - Stream identifier
   * @param {Object} options - Snapshot options
   * @returns {Promise<Object>} Object with base64 data and metadata
   */
  async getSnapshotBase64(streamId, options = {}) {
    const params = new URLSearchParams();
    if (options.width) params.append("width", options.width);
    if (options.height) params.append("height", options.height);

    const url = `/api/snapshot/${streamId}/base64${
      params.toString() ? "?" + params.toString() : ""
    }`;
    return this._fetch(url);
  }

  /**
   * Download a snapshot as a file
   * @param {string} streamId - Stream identifier
   * @param {Object} options - Snapshot options
   * @param {string} options.filename - Filename for download (default: snapshot-{streamId}-{timestamp}.jpg)
   */
  async downloadSnapshot(streamId, options = {}) {
    const blob = await this.getSnapshot(streamId, options);
    const filename =
      options.filename || `snapshot-${streamId}-${Date.now()}.jpg`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ========================================================================
  // WebRTC Streaming
  // ========================================================================

  /**
   * Start a WebRTC stream and attach it to a video element
   * @param {string} streamId - Stream identifier
   * @param {HTMLVideoElement} videoElement - Video element to attach stream to
   * @param {Object} options - WebRTC options
   * @param {Array} options.iceServers - ICE servers (default: Google STUN)
   * @param {Function} options.onConnectionStateChange - Callback for connection state changes
   * @returns {Promise<RTCPeerConnection>} The peer connection
   */
  async startWebRTCStream(streamId, videoElement, options = {}) {
    // Get WebRTC info from API
    const info = await this.getWebRTCInfo(streamId);

    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: options.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    // Track connection state
    if (options.onConnectionStateChange) {
      pc.onconnectionstatechange = () => {
        options.onConnectionStateChange(pc.connectionState);
      };
    }

    // Handle incoming video track
    pc.ontrack = (event) => {
      videoElement.srcObject = event.streams[0];
    };

    // Add transceiver for receiving video
    pc.addTransceiver("video", { direction: "recvonly" });

    // Optionally add audio
    if (options.audio !== false) {
      pc.addTransceiver("audio", { direction: "recvonly" });
    }

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer to mediamtx WHEP endpoint
    // Replace localhost with actual IP from baseUrl
    const whepUrl = info.whep_url.replace(
      "localhost",
      new URL(this.baseUrl).hostname
    );

    const response = await fetch(whepUrl, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to establish WebRTC connection: ${response.status}`
      );
    }

    // Set remote description with answer
    const answer = await response.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answer });

    // Store the connection for cleanup
    this.activePeerConnections.set(streamId, pc);

    return pc;
  }

  /**
   * Stop a WebRTC stream
   * @param {string} streamId - Stream identifier
   */
  stopWebRTCStream(streamId) {
    const pc = this.activePeerConnections.get(streamId);
    if (pc) {
      pc.close();
      this.activePeerConnections.delete(streamId);
    }
  }

  /**
   * Stop all active WebRTC streams
   */
  stopAllWebRTCStreams() {
    for (const [, pc] of this.activePeerConnections.entries()) {
      pc.close();
    }
    this.activePeerConnections.clear();
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get direct URLs for a stream
   * @param {string} streamId - Stream identifier
   * @returns {Object} URLs for different protocols
   */
  getStreamURLs(streamId) {
    const hostname = new URL(this.baseUrl).hostname;
    return {
      snapshot: `${this.baseUrl}/api/snapshot/${streamId}`,
      snapshotThumb: `${this.baseUrl}/api/snapshot/${streamId}?width=320`,
      // Note: These ports are from your configuration
      rtsp: `rtsp://${hostname}:8564/${streamId}`,
      webrtc: `http://${hostname}:8899/${streamId}/whep`,
      hls: `http://${hostname}:8898/${streamId}/index.m3u8`,
    };
  }

  /**
   * Create an auto-refreshing thumbnail image element
   * @param {string} streamId - Stream identifier
   * @param {Object} options - Thumbnail options
   * @param {number} options.width - Thumbnail width (default: 320)
   * @param {number} options.interval - Refresh interval in ms (default: 2000)
   * @param {Function} options.onError - Error callback
   * @returns {Object} Object with img element and stop function
   */
  createAutoRefreshThumbnail(streamId, options = {}) {
    const width = options.width || 320;
    const interval = options.interval || 2000;

    const img = document.createElement("img");
    img.style.width = width + "px";
    img.alt = streamId;

    const updateThumbnail = () => {
      const url = `${
        this.baseUrl
      }/api/snapshot/${streamId}?width=${width}&t=${Date.now()}`;
      img.src = url;
    };

    // Handle errors
    img.onerror = () => {
      if (options.onError) {
        options.onError(new Error(`Failed to load thumbnail for ${streamId}`));
      }
    };

    // Initial load
    updateThumbnail();

    // Set up refresh interval
    const intervalId = setInterval(updateThumbnail, interval);

    // Return img and cleanup function
    return {
      element: img,
      stop: () => clearInterval(intervalId),
    };
  }

  // ========================================================================
  // Internal Methods
  // ========================================================================

  /**
   * Internal fetch wrapper with error handling
   * @private
   */
  async _fetch(path, options = {}) {
    const url = this.baseUrl + path;

    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      if (error.name === "TimeoutError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

// Export for use in modules
export default StreamingGatewayClient;
