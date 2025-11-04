import { useState } from "react";
import StreamingGatewayClient from "../../../../services/streaming-gateway/client";

/**
 * Hook for managing snapshot capture
 */
export const useSnapshot = (gatewayUrl, streamIdPrefix) => {
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const captureSnapshot = async (selectedSensor) => {
    if (!selectedSensor) {
      throw new Error("Please select a sensor first");
    }

    setIsLoadingSnapshot(true);

    try {
      const gatewayClient = new StreamingGatewayClient(gatewayUrl);
      const gatewayStreamId = `${streamIdPrefix}${selectedSensor}`;

      // Get snapshot as data URL
      const dataUrl = await gatewayClient.getSnapshotDataURL(gatewayStreamId);
      setSnapshotUrl(dataUrl);

      return dataUrl;
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const clearSnapshot = () => {
    setSnapshotUrl(null);
    setImageDimensions({ width: 0, height: 0 });
  };

  const handleImageLoad = (imageRef, canvasRef, onLoad) => {
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;

      // Set canvas size to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      if (onLoad) onLoad();
    }
  };

  return {
    snapshotUrl,
    isLoadingSnapshot,
    imageDimensions,
    captureSnapshot,
    clearSnapshot,
    handleImageLoad,
  };
};
