# TripwireConfig Component - Usage Examples

The `TripwireConfig` component is now a reusable polygon drawing tool that can be configured for different use cases (tripwires, ROIs, zones, etc.).

## Basic Usage (Default - Tripwires)

```jsx
import TripwireConfig from "./components/emdx/TripwireConfig";

<TripwireConfig
  vstBaseUrl="http://192.168.1.26:30000/api"
  vstAuthToken="your-vst-token"
  baseUrl="http://192.168.1.26:5000"
  authToken="your-emdx-token"
/>;
```

## Advanced Usage Examples

### 1. ROI (Region of Interest) Configuration

```jsx
import TripwireConfig from "./components/emdx/TripwireConfig";
import { createRoiConfig } from "../../services/emdx/api_emdx";

<TripwireConfig
  vstBaseUrl="http://192.168.1.26:30000/api"
  vstAuthToken="your-vst-token"
  baseUrl="http://192.168.1.26:5000"
  authToken="your-emdx-token"
  // Customization
  title="ROI Configuration"
  itemType="ROI"
  itemTypePlural="ROIs"
  minPoints={4}
  requireDirection={false} // ROIs don't need direction
  onSubmit={async (items, sensorId, baseUrl, authToken) => {
    const payload = {
      deleteIfPresent: true,
      rois: items,
      sensorId: sensorId,
    };
    await createRoiConfig(baseUrl, authToken, sensorId, payload);
  }}
/>;
```

### 2. Custom Zone Configuration with Additional Fields

```jsx
<TripwireConfig
  vstBaseUrl="http://192.168.1.26:30000/api"
  vstAuthToken="your-vst-token"
  baseUrl="http://192.168.1.26:5000"
  authToken="your-emdx-token"
  // Customization
  title="Security Zone Configuration"
  itemType="Zone"
  itemTypePlural="Zones"
  minPoints={3}
  requireDirection={false}
  additionalFields={[
    {
      name: "priority",
      label: "Priority Level",
      type: "number",
      required: true,
      placeholder: "1-10",
    },
    {
      name: "alertType",
      label: "Alert Type",
      type: "text",
      required: false,
      placeholder: "e.g., intrusion",
    },
  ]}
  onSubmit={async (items, sensorId, baseUrl, authToken) => {
    // Custom submission logic
    console.log("Submitting zones:", items);
  }}
/>
```

### 3. Custom Gateway URL and Stream ID Format

```jsx
<TripwireConfig
  vstBaseUrl="http://192.168.1.26:30000/api"
  vstAuthToken="your-vst-token"
  baseUrl="http://192.168.1.26:5000"
  authToken="your-emdx-token"
  // Custom gateway settings
  gatewayUrl="http://custom-gateway:8080"
  streamIdPrefix="stream-" // e.g., "stream-abc-123" instead of "camera-abc-123"
/>
```

### 4. Custom ID Generation

```jsx
<TripwireConfig
  vstBaseUrl="http://192.168.1.26:30000/api"
  vstAuthToken="your-vst-token"
  baseUrl="http://192.168.1.26:5000"
  authToken="your-emdx-token"
  generateItemId={(name, customId) => {
    // Custom ID generation logic
    if (customId) return customId;
    return `tripwire_${Date.now()}_${name.toLowerCase().replace(/\s+/g, "_")}`;
  }}
/>
```

## Component Props

| Prop               | Type     | Default                       | Description                                                              |
| ------------------ | -------- | ----------------------------- | ------------------------------------------------------------------------ |
| `vstBaseUrl`       | string   | **required**                  | VST API base URL for fetching sensors                                    |
| `vstAuthToken`     | string   | **required**                  | VST authentication token                                                 |
| `baseUrl`          | string   | **required**                  | EMDX API base URL                                                        |
| `authToken`        | string   | **required**                  | EMDX authentication token                                                |
| `gatewayUrl`       | string   | `"http://192.168.1.26:30010"` | Streaming gateway URL for snapshots                                      |
| `streamIdPrefix`   | string   | `"camera-"`                   | Prefix for gateway stream IDs                                            |
| `title`            | string   | `"Tripwire Configuration"`    | Component title                                                          |
| `itemType`         | string   | `"Tripwire"`                  | Singular name for items being drawn                                      |
| `itemTypePlural`   | string   | `"Tripwires"`                 | Plural name for items                                                    |
| `minPoints`        | number   | `3`                           | Minimum points required for polygon                                      |
| `requireDirection` | boolean  | `true`                        | Whether direction arrow is required                                      |
| `onSubmit`         | function | `null`                        | Custom submit handler `(items, sensorId, baseUrl, authToken) => Promise` |
| `generateItemId`   | function | `null`                        | Custom ID generator `(name, customId) => string`                         |
| `additionalFields` | array    | `[]`                          | Additional form fields (see below)                                       |

### Additional Fields Format

```javascript
[
  {
    name: "fieldName", // State key for the value
    label: "Field Label", // Display label
    type: "text", // HTML input type (text, number, email, etc.)
    required: false, // Whether field is required
    placeholder: "hint text", // Placeholder text
  },
];
```

## Item Data Structure

Items generated by the component have this structure:

```javascript
{
  id: "item_id",
  name: "Item Name",
  wire: [
    { x: 100, y: 200 },
    { x: 300, y: 400 },
    { x: 500, y: 300 }
  ],
  direction: {  // Only if requireDirection=true
    entry: { name: "Entry side" },
    exit: { name: "Exit side" },
    p1: { x: 150, y: 250 },  // Entry point
    p2: { x: 400, y: 350 }   // Exit point
  },
  // Any additional fields are included here
  priority: 5,
  alertType: "intrusion"
}
```

## Creating a New Component Type

To create a completely separate component (e.g., `ROIConfig.js`):

```jsx
import React from "react";
import TripwireConfig from "./TripwireConfig";
import { createRoiConfig } from "../../services/emdx/api_emdx";

const ROIConfig = ({ vstBaseUrl, vstAuthToken, baseUrl, authToken }) => {
  const handleSubmit = async (items, sensorId, baseUrl, authToken) => {
    const payload = {
      deleteIfPresent: true,
      rois: items,
      sensorId: sensorId,
    };
    await createRoiConfig(baseUrl, authToken, sensorId, payload);
  };

  return (
    <TripwireConfig
      vstBaseUrl={vstBaseUrl}
      vstAuthToken={vstAuthToken}
      baseUrl={baseUrl}
      authToken={authToken}
      title="ROI Configuration"
      itemType="ROI"
      itemTypePlural="ROIs"
      minPoints={4}
      requireDirection={false}
      onSubmit={handleSubmit}
    />
  );
};

export default ROIConfig;
```

## Benefits of Reusability

1. **Single Source of Truth**: Canvas drawing logic in one place
2. **Consistent UX**: Same interaction pattern across different config types
3. **Easy Customization**: Props allow flexible configuration
4. **Reduced Code Duplication**: No need to copy/paste 700+ lines for each type
5. **Maintainability**: Bug fixes apply to all use cases
6. **Extensibility**: Easy to add new features to all config types
