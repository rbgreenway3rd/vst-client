# EMDX Integration

This directory contains the integration with NVIDIA EMDX (Edge Multi-sensor Data eXchange) Analytics API.

## Overview

EMDX provides analytics capabilities including:

- **Alert Rules** - Configure FOV, Tripwire, and ROI-based alerts
- **Analytics Dashboard** - View metrics, alerts, and occupancy data
- **ROI Configuration** - Define regions of interest and tripwires for monitoring

## API Documentation

- Official Docs: https://docs.nvidia.com/jetson/jps/emdx_API_v2/index.html
- Default Base URL: `http://192.168.1.26:5000`

## Components

### 1. RuleManagement (`/components/emdx/RuleManagement.js`)

Manage alert rules for:

- **FOV (Field of View)** - Full frame monitoring
- **Tripwire** - Line-crossing detection
- **ROI (Region of Interest)** - Zone-based monitoring

### 2. ROIConfiguration (`/components/emdx/ROIConfiguration.js`)

Configure:

- Sensors for analytics
- Regions of Interest (ROI) polygons
- Tripwire lines

### 3. AnalyticsDashboard (`/components/emdx/AnalyticsDashboard.js`)

View real-time analytics:

- Service health status
- Alert counts and recent alerts
- Occupancy metrics
- Performance metrics

## API Client (`/services/emdx/api.js`)

### Available Functions

**Health Check:**

- `getHealth(baseUrl, authToken)` - Check service status

**Alert Rules:**

- `listFovAlertRules(baseUrl, authToken)`
- `createFovAlertRule(baseUrl, authToken, ruleData)`
- `deleteFovAlertRule(baseUrl, authToken, ruleId)`
- Similar functions for Tripwire and ROI rules

**Alerts:**

- `getAlerts(baseUrl, authToken, params)`
- `getAlertsCount(baseUrl, authToken, params)`
- `getFovAlerts(baseUrl, authToken, params)`
- `getTripwireAlerts(baseUrl, authToken, params)`
- `getRoiAlerts(baseUrl, authToken, params)`

**Configuration:**

- `getAllConfig(baseUrl, authToken)`
- `getSensorsConfig(baseUrl, authToken)`
- `getRoisConfig(baseUrl, authToken)`
- `getTripwiresConfig(baseUrl, authToken)`
- Update functions for each config type

**Analytics/Metrics:**

- `getFrames(baseUrl, authToken, params)` - Object detection data
- `getMetrics(baseUrl, authToken, params)` - Performance metrics
- `getHistograms(baseUrl, authToken, params)` - Statistical data
- `getFovOccupancyCount(baseUrl, authToken, params)` - Occupancy metrics

## Usage Example

```javascript
import { getHealth, listFovAlertRules } from "../../services/emdx/api";

// Check service health
const health = await getHealth("http://192.168.1.26:5000", authToken);
console.log("EMDX Status:", health);

// List FOV alert rules
const rules = await listFovAlertRules("http://192.168.1.26:5000", authToken);
console.log("FOV Rules:", rules);
```

## Configuration

Edit `config.js` to customize:

- Default base URL
- Timeout settings
- Retry attempts
- Alert types
- Object types for detection

## Next Steps

1. **Test Connection** - Open Analytics Dashboard to verify EMDX connectivity
2. **Configure Sensors** - Link VST sensors to EMDX for analytics
3. **Define ROIs** - Create regions of interest for monitoring
4. **Set Up Rules** - Configure alert rules for events
5. **Monitor Dashboard** - View real-time analytics and alerts

## Known Limitations

- ROI visual editor not yet implemented (coming soon)
- Tripwire visual editor not yet implemented (coming soon)
- Rule creation forms are placeholders (coming soon)
- Historical data visualization not yet implemented

## Troubleshooting

### Connection Issues

- Verify EMDX service is running: `http://192.168.1.26:5000/core/healthz`
- Check firewall settings
- Ensure correct base URL in App.js

### Empty Data

- Verify sensors are configured in EMDX
- Check that VST sensors have matching IDs in EMDX
- Ensure analytics are enabled on cameras

### API Errors

- Check browser console for detailed error messages
- Verify authentication if required
- Check EMDX service logs
