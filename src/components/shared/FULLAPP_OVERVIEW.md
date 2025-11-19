# FullApp Component - Unified Control Center

## Overview

The **FullApp** component is an experimental unified interface that combines all VST and EMDX functionality into a single, comprehensive control panel. It provides a streamlined experience with collapsible sections and intelligent organization.

## Features

### 🎯 Global Controls

- **Unified Sensor Selector**: Single dropdown at the top for selecting active sensor
- **System Health Indicators**: Real-time status chips for VST and EMDX connectivity
- **Sensor Count Badge**: Quick view of total available sensors
- **Refresh All Button**: One-click refresh for sensors and health status

### 📹 VST Operations Section

Collapsible accordions for all VST functionality:

1. **Sensor Management**

   - Full sensor CRUD operations
   - Scan for new sensors
   - Configure sensor settings
   - View sensor status

2. **Live Stream**

   - WebRTC streaming from selected sensor
   - Auto-populates with selected sensor from global dropdown
   - Real-time video feed with controls

3. **File Management**
   - Browse recorded files
   - Upload/download recordings
   - Manage storage

### 🎯 EMDX Analytics Section

Collapsible accordions for all EMDX functionality:

1. **Analytics Dashboard**

   - System health metrics
   - Alert counts
   - Recent alerts
   - Occupancy data

2. **Zone Configuration**

   - Draw tripwires and ROIs
   - Configure alert rules for zones
   - Uses selected sensor from global dropdown
   - Canvas-based drawing interface

3. **Alert Rules Management**
   - View all alert rules
   - Create/edit/delete rules
   - FOV, Tripwire, and ROI rules
   - Filter by sensor

### ⚡ Quick Actions

Convenient buttons to jump directly to common tasks:

- **Open Live Stream**: Expands stream section for selected sensor
- **Configure Zones**: Opens zone drawing interface
- **View Analytics**: Shows analytics dashboard
- **Manage Sensors**: Opens sensor management panel

## UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
│  - Title & Description                                  │
│  - Health Status Chips (VST, EMDX, Sensor Count)       │
├─────────────────────────────────────────────────────────┤
│  Global Controls                                        │
│  - Sensor Dropdown (unified selector)                  │
│  - Refresh All Button                                  │
│  - Active Sensor Info Alert                            │
├─────────────────────────────────────────────────────────┤
│  📹 VST Operations                                      │
│  ├─ [+] Sensor Management                              │
│  ├─ [+] Live Stream                                    │
│  └─ [+] File Management                                │
├─────────────────────────────────────────────────────────┤
│  🎯 EMDX Analytics & Configuration                      │
│  ├─ [+] Analytics Dashboard                            │
│  ├─ [+] Zone Configuration (Tripwires & ROIs)          │
│  └─ [+] Alert Rules Management                         │
├─────────────────────────────────────────────────────────┤
│  ⚡ Quick Actions                                       │
│  [Open Stream] [Configure Zones] [View Analytics]      │
└─────────────────────────────────────────────────────────┘
```

### Collapsible Sections

- All major features use MUI Accordion components
- Sections can be expanded/collapsed independently
- State is managed in `expandedSections` object
- Only load components when expanded (lazy loading with Suspense)

### Color Coding

- **VST Operations**: Blue header (`primary.main`)
- **EMDX Analytics**: Green header (`success.main`)
- **Status Chips**:
  - Green = Online/Healthy
  - Red = Offline/Error
  - Gray = Unknown/Loading

## Props

```typescript
interface FullAppProps {
  vstBaseUrl: string; // VST API base URL
  vstAuthToken: string; // VST authentication token
  emdxBaseUrl: string; // EMDX API base URL
  emdxAuthToken: string; // EMDX authentication token
}
```

## State Management

### Global State

- `sensors`: Array of all available sensors
- `selectedSensor`: Currently active sensor ID
- `loadingSensors`: Loading indicator for sensor fetch
- `vstHealthy`: VST system health status (true/false/null)
- `emdxHealthy`: EMDX system health status (true/false/null)

### UI State

- `expandedSections`: Object tracking which accordion sections are open
  - `sensors`: Sensor Management
  - `stream`: Live Stream
  - `zones`: Zone Configuration
  - `rules`: Alert Rules
  - `analytics`: Analytics Dashboard
  - `files`: File Management

## Sensor Context Sharing

The FullApp component implements a **unified sensor selection pattern**:

1. **Single Source of Truth**: Global sensor dropdown at top
2. **Auto-Population**: Components that need a sensor automatically receive the selected value
3. **Visual Feedback**: Selected sensor shown as chip badge on relevant sections
4. **Validation**: Components that require a sensor show warning if none selected

## Performance Optimization

### Lazy Loading

- All major components are lazy-loaded with `React.lazy()`
- Components only load when their accordion section is expanded
- Suspense boundaries show loading spinner during component load

### Conditional Rendering

- Components only render when their section is expanded
- Health checks run only on mount and manual refresh
- Sensor list fetched once and cached

## Use Cases

### Scenario 1: Quick Stream Check

1. Select sensor from dropdown
2. Click "Open Live Stream" quick action
3. View stream immediately in expanded section

### Scenario 2: Full Sensor Configuration

1. Expand "Sensor Management" accordion
2. Modify sensor settings
3. Click "Refresh All" to update
4. Expand "Live Stream" to verify changes

### Scenario 3: Analytics Workflow

1. Select sensor
2. Expand "Zone Configuration"
3. Draw tripwires/ROIs
4. Create alert rules in same section
5. Expand "Analytics Dashboard" to view results

### Scenario 4: Multi-Task Operations

1. Expand multiple sections simultaneously
2. Monitor live stream while configuring zones
3. View analytics while managing rules
4. Quick actions always available for navigation

## Advantages

✅ **Single Page**: No tab switching required
✅ **Context Aware**: Selected sensor persists across all sections
✅ **Space Efficient**: Accordions collapse when not in use
✅ **Performance**: Lazy loading keeps initial load fast
✅ **Unified Experience**: All operations in one interface
✅ **Visual Clarity**: Color-coded sections (VST=Blue, EMDX=Green)
✅ **Quick Access**: Direct action buttons for common tasks

## Limitations

⚠️ **Screen Real Estate**: Can get crowded on small screens
⚠️ **Scroll Heavy**: With many sections expanded, requires scrolling
⚠️ **Learning Curve**: More complex than single-purpose tabs
⚠️ **Mobile Experience**: Best viewed on desktop/tablet

## Future Enhancements

### Potential Improvements

1. **Drag-and-Drop Layout**: Allow users to reorder sections
2. **Persistent State**: Save expanded sections to localStorage
3. **Multi-Monitor Support**: Pop out sections to separate windows
4. **Side-by-Side View**: Split screen for stream + configuration
5. **Keyboard Shortcuts**: Quick expand/collapse with hotkeys
6. **Customizable Quick Actions**: User-defined favorite actions
7. **Minimap Navigation**: Overview of all sections for quick jumping
8. **Responsive Grid**: Better mobile experience with responsive layout

## Usage in App.js

The FullApp tab is added to the main application tabs:

```javascript
const tabComponents = [
  { label: "🚀 FullApp", component: FullApp, api: "both" },
  // ... other tabs
];
```

It uses the special `api: "both"` designation to receive both VST and EMDX credentials.

## Component Dependencies

### External Libraries

- `@mui/material`: UI components (Accordion, Paper, Chip, etc.)
- `@mui/icons-material`: Icons for sections
- `react`: Core React functionality with hooks

### Internal Components

- `SensorManagement`: VST sensor CRUD operations
- `LiveStream`: VST WebRTC streaming
- `FileManagement`: VST file operations
- `AnalyticsDashboard`: EMDX metrics display
- `ZoneConfig`: EMDX tripwire/ROI configuration
- `RuleManagement`: EMDX alert rules

### API Services

- `api_vst.js`: VST API calls (sensor list, health)
- `api_emdx.js`: EMDX API calls (health check)

## Comparison: FullApp vs Traditional Tabs

| Feature            | Traditional Tabs  | FullApp               |
| ------------------ | ----------------- | --------------------- |
| **Navigation**     | Tab switching     | Accordions            |
| **Context**        | Lost on switch    | Persistent            |
| **Multi-tasking**  | One at a time     | Multiple sections     |
| **Screen Space**   | Full page per tab | Collapsible sections  |
| **Performance**    | Load per tab      | Lazy load per section |
| **Mobile**         | Good              | Moderate              |
| **Learning Curve** | Simple            | Moderate              |
| **Power Users**    | Less efficient    | More efficient        |

## Conclusion

The **FullApp** component is an experimental unified interface that prioritizes efficiency for power users who need to work across multiple features simultaneously. While it has more complexity than traditional tabs, it offers significant advantages for workflows that require frequent context switching between VST and EMDX operations.

For users who prefer simplicity, the traditional tab-based interface remains available.
