import React from "react";
import TripwireConfig from "./ZoneConfig";
import { updateRoisConfig } from "../../services/emdx/api_emdx";

/**
 * ROI (Region of Interest) Configuration Component
 *
 * This is a wrapper around TripwireConfig that configures it specifically for ROI drawing.
 * ROIs typically don't need direction arrows since they define areas rather than directional lines.
 */
const ROIConfig = ({ vstBaseUrl, vstAuthToken, baseUrl, authToken }) => {
  const handleROISubmit = async (items, sensorId, baseUrl, authToken) => {
    // Transform items into ROI format expected by EMDX API
    const roisData = {
      deleteIfPresent: true,
      rois: items.map((item) => ({
        id: item.id,
        name: item.name,
        polygon: item.wire, // ROIs use 'polygon' instead of 'wire'
        // Add any additional ROI-specific fields here
      })),
      sensorId: sensorId,
    };

    console.log("Submitting ROI config to EMDX:", roisData);
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
      requireDirection={false} // ROIs don't need direction arrows
      onSubmit={handleROISubmit}
    />
  );
};

export default ROIConfig;
