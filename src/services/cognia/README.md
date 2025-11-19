# Cognia Integration

This directory contains the integration with the Cognia API - the main business logic layer for the surveillance system.

## Overview

Cognia provides:

- **Alert History** - View and search historical alerts with filtering
- **Subscription Management** - Create and manage alert notification subscriptions
- **User Management** - User profiles and notification preferences (future)

## API Documentation

- Default Base URL: `http://192.168.1.26:8000`
- Part of the Cognia microservices architecture

## Components

### 1. AlertHistory (`/components/cognia/AlertHistory.js`)

View and search alert history with advanced filtering:

- **Pagination** - Browse through large alert datasets
- **Filtering** - By sensor, alert type, severity, and time range
- **Detail View** - Expand individual alerts for full metadata
- **Real-time** - Refreshable data

**Features:**

- Filter by sensor ID
- Filter by alert type (FOV, Tripwire, ROI)
- Filter by severity (Info, Warning, Critical)
- Time range selection (from/to timestamps)
- View detailed alert metadata
- Paginated results (10, 25, 50, 100 per page)

### 2. SubscriptionManager (`/components/cognia/SubscriptionManager.js`)

Create and manage alert notification subscriptions:

- **Create Subscriptions** - Set up new alert notifications
- **Edit Subscriptions** - Modify existing subscription settings
- **Delete Subscriptions** - Remove unwanted subscriptions
- **Toggle Active** - Enable/disable subscriptions without deleting

**Subscription Options:**

- **Sensor Selection** - Choose which camera to monitor
- **Alert Types** - Select FOV, Tripwire, and/or ROI alerts
- **Notification Method**:
  - **ntfy.sh** - Push notifications via ntfy protocol
  - **Email** - Email notifications (future)
  - **Webhook** - HTTP webhook for custom integrations
- **Severity Filter** - Receive all alerts, warnings+, or critical only
- **Active Toggle** - Enable/disable without deleting

## API Client (`/services/cognia/api_cognia.js`)

### Available Functions

**Health Check:**

- `getHealth(baseUrl, authToken)` - Check Cognia API status

**Alert History:**

- `getAlertHistory(baseUrl, authToken, params)` - Get paginated alert history
  - `params.sensor_id` - Filter by sensor
  - `params.alert_type` - Filter by type (fov, tripwire, roi)
  - `params.severity` - Filter by severity
  - `params.from_timestamp` - Start time (Unix epoch)
  - `params.to_timestamp` - End time (Unix epoch)
  - `params.limit` - Results per page (default: 50)
  - `params.offset` - Pagination offset
- `getAlertById(baseUrl, authToken, alertId)` - Get single alert details
- `getAlertStats(baseUrl, authToken, params)` - Get alert statistics

**Subscriptions:**

- `getSubscriptions(baseUrl, authToken)` - Get all user subscriptions
- `getSubscriptionsBySensor(baseUrl, authToken, sensorId)` - Filter by sensor
- `createSubscription(baseUrl, authToken, data)` - Create new subscription
- `updateSubscription(baseUrl, authToken, id, data)` - Update subscription
- `deleteSubscription(baseUrl, authToken, id)` - Delete subscription
- `toggleSubscription(baseUrl, authToken, id, active)` - Enable/disable

**User Management:**

- `getUserProfile(baseUrl, authToken)` - Get current user profile
- `updateNotificationPreferences(baseUrl, authToken, prefs)` - Update preferences

## Usage Example

```javascript
import {
  getAlertHistory,
  createSubscription,
} from "../../services/cognia/api_cognia";

// Get recent alerts for a sensor
const alerts = await getAlertHistory(baseUrl, authToken, {
  sensor_id: "abc-123",
  from_timestamp: Date.now() / 1000 - 3600, // Last hour
  limit: 50,
});

// Create a subscription for tripwire alerts
const subscription = await createSubscription(baseUrl, authToken, {
  sensor_id: "abc-123",
  alert_types: ["tripwire"],
  notification_method: "ntfy",
  notification_config: {
    topic: "my-alerts",
    server: "https://ntfy.sh",
  },
  severity_filter: "warning", // Only warning and critical
  active: true,
});
```

## Integration with FullApp

The Cognia components are integrated into the **FullApp** tab, which provides a unified interface for:

1. **VST Operations** - Sensor management, live streaming, file management
2. **EMDX Analytics** - Analytics dashboard, zone configuration, alert rules
3. **Cognia Alert Management** - Alert history and subscriptions (NEW!)

The Cognia section appears when both `cogniaBaseUrl` and `cogniaAuthToken` are configured in `App.js`.

## Architecture Context

In the Cognia system architecture:

- **VST** (systemd) - Sensor/camera management
- **Redis** (systemd) - Message broker
- **DeepStream** - YOLOv11 inference, publishes to Redis
- **emdx-analytics** - Evaluates rules, publishes alerts to Redis
- **emdx-webapi** - Alert rule configuration API
- **cognia-api** - Main REST API (THIS)
  - Consumes alert events from Redis
  - Receives webhooks from emdx-analytics
  - Stores alert history
  - Manages subscriptions
  - Delivers notifications (ntfy.sh)
- **orchestrator** - Camera lifecycle management
- **mediamtx** - RTSP/WebRTC/HLS streaming

This React client (`vst-client`) provides the UI for all these services.

## Configuration

In `App.js`:

```javascript
const [cogniaBaseUrl, setCogniaBaseUrl] = useState("http://192.168.1.26:8000");
const [cogniaAuthToken, setCogniaAuthToken] = useState("");
```

The auth token should be set when implementing authentication.

## Future Enhancements

- [ ] Real-time alert notifications via WebSocket
- [ ] Email notification support
- [ ] User profile management UI
- [ ] Advanced alert analytics and charts
- [ ] Alert acknowledgment and resolution
- [ ] Multi-user collaboration features
