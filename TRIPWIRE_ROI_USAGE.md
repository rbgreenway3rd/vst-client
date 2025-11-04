# Using TripwireConfig as a Single Reusable Component

`TripwireConfig.js` is now a **fully reusable polygon drawing component** that can handle:

- ✅ **Tripwires** (with direction arrows)
- ✅ **ROIs** (Regions of Interest, without direction)
- ✅ **Custom zones** (with additional metadata)
- ✅ Any polygon-based configuration

---

## Quick Start: How It Works

The component accepts props that configure its behavior. You can either:

1. **Use it directly** with custom props
2. **Wrap it** in a specialized component (recommended for clean separation)

---

## Example 1: ROI Configuration (Already Created!)

I've created `ROIConfig.js` which wraps `TripwireConfig` for ROI use:

```jsx
// src/components/emdx/ROIConfig.js
import React from "react";
import TripwireConfig from "./TripwireConfig";
import { updateRoisConfig } from "../../services/emdx/api_emdx";

const ROIConfig = ({ vstBaseUrl, vstAuthToken, baseUrl, authToken }) => {
  const handleROISubmit = async (items, sensorId, baseUrl, authToken) => {
    const roisData = {
      deleteIfPresent: true,
      rois: items.map((item) => ({
        id: item.id,
        name: item.name,
        polygon: item.wire, // ROIs use 'polygon' instead of 'wire'
      })),
      sensorId: sensorId,
    };

    await updateRoisConfig(baseUrl, authToken, roisData);
  };

  return (
    <TripwireConfig
      vstBaseUrl={vstBaseUrl}
      vstAuthToken={vstAuthToken}
      baseUrl={baseUrl}
      authToken={authToken}
      // ROI-specific configuration
      title="ROI Configuration"
      itemType="ROI"
      itemTypePlural="ROIs"
      minPoints={3}
      requireDirection={false} // No direction arrows for ROIs
      onSubmit={handleROISubmit}
    />
  );
};

export default ROIConfig;
```

**Added to App.js** as a new tab: "ROI Config"

---

## Comparison: Tripwires vs ROIs

| Feature             | Tripwires                  | ROIs                    |
| ------------------- | -------------------------- | ----------------------- |
| **Direction Arrow** | ✅ Required (entry → exit) | ❌ Not needed           |
| **Min Points**      | 3                          | 3 (or 4 for rectangles) |
| **Use Case**        | Detect crossing (in/out)   | Define area of interest |
| **Data Field**      | `wire`                     | `polygon`               |
| **API Endpoint**    | `createTripwireConfig()`   | `updateRoisConfig()`    |

---

## Key Configuration Props

```javascript
<TripwireConfig
  // Required API props
  vstBaseUrl="..." // VST API for camera list
  vstAuthToken="..." // VST auth
  baseUrl="..." // EMDX API for submission
  authToken="..." // EMDX auth
  // Customization props
  title="..." // Component title
  itemType="..." // Singular name (Tripwire, ROI, Zone)
  itemTypePlural="..." // Plural name
  minPoints={3} // Minimum polygon points
  requireDirection={bool} // Enable/disable direction arrow
  onSubmit={func} // Custom submit handler
  generateItemId={func} // Custom ID generator
  additionalFields={[]} // Extra form fields
  gatewayUrl="..." // Gateway for snapshots
  streamIdPrefix="..." // Stream ID format
/>
```

---

## Data Structure Comparison

### Tripwire Output

```javascript
{
  id: "main_door",
  name: "Main door",
  wire: [
    { x: 100, y: 200 },
    { x: 300, y: 400 },
    { x: 500, y: 300 }
  ],
  direction: {
    entry: { name: "Entry side" },
    exit: { name: "Exit side" },
    p1: { x: 150, y: 250 },
    p2: { x: 400, y: 350 }
  }
}
```

### ROI Output

```javascript
{
  id: "parking_lot",
  name: "Parking Lot",
  wire: [                    // Gets mapped to 'polygon' in submit handler
    { x: 100, y: 200 },
    { x: 300, y: 400 },
    { x: 500, y: 300 }
  ]
  // No direction field
}
```

---

## Creating More Specialized Components

### Example: Security Zone with Priority

```jsx
// src/components/emdx/SecurityZoneConfig.js
import React from "react";
import TripwireConfig from "./TripwireConfig";

const SecurityZoneConfig = ({
  vstBaseUrl,
  vstAuthToken,
  baseUrl,
  authToken,
}) => {
  const handleZoneSubmit = async (items, sensorId, baseUrl, authToken) => {
    const zonesData = {
      deleteIfPresent: true,
      zones: items,
      sensorId: sensorId,
    };

    // Call your custom API endpoint
    // await createSecurityZones(baseUrl, authToken, zonesData);
  };

  return (
    <TripwireConfig
      vstBaseUrl={vstBaseUrl}
      vstAuthToken={vstAuthToken}
      baseUrl={baseUrl}
      authToken={authToken}
      title="Security Zone Configuration"
      itemType="Zone"
      itemTypePlural="Zones"
      minPoints={4}
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
          name: "alertEmail",
          label: "Alert Email",
          type: "email",
          required: false,
          placeholder: "security@example.com",
        },
      ]}
      onSubmit={handleZoneSubmit}
    />
  );
};
```

---

## How to Use in Your App

### Option 1: Use the Wrapper Components (Recommended)

```jsx
// In your App.js or component
import TripwireConfig from "./components/emdx/TripwireConfig";
import ROIConfig from "./components/emdx/ROIConfig";

// For tripwires (with direction)
<TripwireConfig {...props} />

// For ROIs (without direction)
<ROIConfig {...props} />
```

### Option 2: Configure Directly

```jsx
// For ROIs
<TripwireConfig
  {...baseProps}
  title="ROI Configuration"
  itemType="ROI"
  itemTypePlural="ROIs"
  requireDirection={false}
  onSubmit={handleROISubmit}
/>

// For Tripwires
<TripwireConfig
  {...baseProps}
  title="Tripwire Configuration"
  itemType="Tripwire"
  itemTypePlural="Tripwires"
  requireDirection={true}
  onSubmit={handleTripwireSubmit}
/>
```

---

## Benefits of This Approach

✅ **Single source of truth** - All polygon drawing logic in one place  
✅ **No code duplication** - Reuse the same 750+ lines for all types  
✅ **Easy to extend** - Add new polygon types by just passing props  
✅ **Consistent UX** - Same interaction for all configuration types  
✅ **Maintainable** - Bug fixes apply everywhere automatically  
✅ **Type-safe** - Clear prop interface with defaults

---

## Testing Both Modes

**Tripwire Config Tab:**

- Select camera → Capture snapshot
- Draw polygon (3+ points)
- Set direction arrow (entry → exit)
- Save and submit

**ROI Config Tab:**

- Select camera → Capture snapshot
- Draw polygon (3+ points)
- No direction arrow needed
- Save and submit

Both use the **exact same component** with different configuration!

---

## Summary

**Yes, TripwireConfig is now a fully reusable component!**

- ✅ Single component handles both tripwires and ROIs
- ✅ ROIConfig.js wrapper created and added to App.js
- ✅ New "ROI Config" tab available in your app
- ✅ No code duplication needed
- ✅ Easy to add more types (zones, areas, etc.)

The component adapts its behavior through props:

- `requireDirection={true}` → Tripwire mode
- `requireDirection={false}` → ROI mode
- Custom `onSubmit` handler → Any API format
