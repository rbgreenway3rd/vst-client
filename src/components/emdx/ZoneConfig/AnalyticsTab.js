import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Analytics tab component for viewing zone metrics
 */
const AnalyticsTab = ({ selectedSensor }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        📊 Analytics Dashboard
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 2 }}>
        View real-time and historical analytics for your configured zones
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Time Range Selection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="textSecondary">
            Analytics metrics retrieval coming soon...
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Tripwire Crossing Counts</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="textSecondary">
            Histogram and total counts will be displayed here
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>ROI Occupancy Metrics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="textSecondary">
            Occupancy trends and statistics will be displayed here
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AnalyticsTab;
