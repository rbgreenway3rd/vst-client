# Unified Tripwire & ROI Configuration Component

## Overview

`TripwireConfig.js` has been completely reworked to handle **both tripwires AND ROIs** in a single unified component!

## ✅ What Changed

### Before

- Separate props for configuration (itemType, itemTypePlural, requireDirection, etc.)
- Generic reusable design but required wrapper components
- Single mode per component instance

### After

- **Two buttons in one component**: "Draw Tripwire" and "Draw ROI"
- **Separate state tracking**: `tripwires[]` and `rois[]` arrays
- **Mode-aware drawing**: Yellow (tripwires) vs Cyan (ROIs)
- **Smart validation**: Direction arrows only required for tripwires
- **Batch submission**: Submits both types to their respective EMDX APIs in one click

## 🎨 Visual Indicators

| Item Type    | Drawing Color         | Saved Color          | Direction Arrow       |
| ------------ | --------------------- | -------------------- | --------------------- |
| **Tripwire** | 🟡 Yellow (`#ffff00`) | 🟢 Green (`#00ff00`) | ✅ Required (magenta) |
| **ROI**      | 🔵 Cyan (`#00ffff`)   | 🔵 Blue (`#0088ff`)  | ❌ Not needed         |

## 🔄 Workflow

1. **Select Camera** → **Capture Snapshot**
2. Choose your drawing mode:
   - Click **"✏️ Draw Tripwire"** → Draw polygon → Set direction arrow → Save
   - Click **"🔷 Draw ROI"** → Draw polygon → Save (no direction needed)
3. Repeat to add multiple tripwires and/or ROIs
4. Click **"📤 Submit to EMDX"** → Submits all items

## 📊 Status Display

Shows real-time counts:

```
📊 Camera: abc-123 | Image: 1920x1080 | Tripwires: 2 | ROIs: 3
```

## 🔧 Key Functions

### `handleStartDrawing(mode)`

- **mode**: `'tripwire'` or `'roi'`
- Initializes drawing state and sets the drawing mode
- Yellow cursor for tripwires, cyan for ROIs

### `handleFinishDrawing()`

- Validates minimum 3 points
- Opens dialog with mode-specific labels

### `handleSaveItem()`

- Saves to appropriate array (`tripwires` or `rois`)
- Only adds direction data for tripwires
- Auto-generates ID from name

### `handleSubmitToEMDX()`

- **Tripwires**: `POST /v2/config/tripwire` via `createTripwireConfig()`
- **ROIs**: `PUT /config/rois` via `updateRoisConfig()`
- Submits both types if present
- Success message shows what was submitted

## 📝 Data Structures

### Tripwire Format

```javascript
{
  id: "main_door",
  name: "Main door",
  wire: [{ x: 100, y: 200 }, ...],
  direction: {
    entry: { name: "Entry side" },
    exit: { name: "Exit side" },
    p1: { x: 150, y: 250 },
    p2: { x: 400, y: 350 }
  }
}
```

### ROI Format

```javascript
{
  id: "parking_lot",
  name: "Parking Lot",
  wire: [{ x: 100, y: 200 }, ...]
  // No direction field
}
```

### Submission Payloads

**Tripwires:**

```javascript
{
  deleteIfPresent: true,
  tripwires: [/* array of tripwire objects */],
  sensorId: "camera-id"
}
```

**ROIs:**

```javascript
{
  deleteIfPresent: true,
  rois: [
    {
      id: "parking_lot",
      name: "Parking Lot",
      polygon: [{ x: 100, y: 200 }, ...]  // Maps wire → polygon
    }
  ],
  sensorId: "camera-id"
}
```

## 🎯 Benefits

✅ **Single component** - No need for separate TripwireConfig and ROIConfig  
✅ **Unified UX** - Same interface, same camera snapshot, different modes  
✅ **Efficient workflow** - Draw both types on the same snapshot  
✅ **Batch submission** - Submit everything at once  
✅ **Clear visual distinction** - Color-coded drawing and saved items  
✅ **Smart validation** - Mode-aware requirements

## 🗑️ Removed

- `itemType`, `itemTypePlural`, `minPoints`, `requireDirection`, `onSubmit`, `generateItemId`, `additionalFields` props
- Generic configurability (now hardcoded for tripwire+ROI dual mode)
- Separate ROIConfig wrapper component (no longer needed)

## 📍 Usage

In `App.js`, the "Tripwire Config" tab now handles both:

```jsx
<TripwireConfig
  vstBaseUrl={vstBaseUrl}
  vstAuthToken={vstAuthToken}
  baseUrl={emdxBaseUrl}
  authToken={emdxAuthToken}
  gatewayUrl="http://192.168.1.26:30010"
  streamIdPrefix="camera-"
  title="Tripwire & ROI Configuration"
/>
```

## 🎨 Button Layout

When snapshot is loaded and not drawing:

- 📷 **Capture Snapshot**
- ✏️ **Draw Tripwire** (primary blue)
- 🔷 **Draw ROI** (secondary purple)

When drawing:

- ✓ **Finish Tripwire/ROI** (success green)
- ✗ **Cancel** (warning orange)

When items exist:

- 🗑️ **Clear All** (error red, outline)
- 📤 **Submit to EMDX** (success green)

## 🔮 Future Enhancements

Possible additions:

- Edit existing items
- Delete individual items
- Import/export configurations
- Undo/redo functionality
- Snap to grid
- Different ROI shapes (rectangles, circles)
