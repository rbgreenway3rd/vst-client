import React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SendIcon from "@mui/icons-material/Send";

/**
 * Sidebar component displaying configured tripwires and ROIs
 */
const ZonesSidebar = ({
  tripwires,
  rois,
  onDelete,
  onClearAll,
  onSubmit,
  onAddRule,
}) => {
  const totalZones = tripwires.length + rois.length;

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        📋 Configured Zones
      </Typography>

      {totalZones === 0 && (
        <Typography color="textSecondary" sx={{ my: 2 }}>
          No zones configured yet. Draw tripwires or ROIs on the canvas to get
          started.
        </Typography>
      )}

      {/* Tripwires Section */}
      {tripwires.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>🟢 Tripwires ({tripwires.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {tripwires.map((tripwire) => (
                <ListItem
                  key={tripwire.id}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        color="warning"
                        onClick={() => onAddRule?.(tripwire, "tripwire")}
                        title="Add Alert Rule"
                      >
                        <WarningIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => onDelete(tripwire.id, "tripwire")}
                        title="Delete Tripwire"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{ pl: 0 }}
                >
                  <ListItemText
                    primary={tripwire.name}
                    secondary={`ID: ${tripwire.id}`}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* ROIs Section */}
      {rois.length > 0 && (
        <Accordion defaultExpanded sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>🔵 ROIs ({rois.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {rois.map((roi) => (
                <ListItem
                  key={roi.id}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        color="warning"
                        onClick={() => onAddRule?.(roi, "roi")}
                        title="Add Alert Rule"
                      >
                        <WarningIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => onDelete(roi.id, "roi")}
                        title="Delete ROI"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{ pl: 0 }}
                >
                  <ListItemText
                    primary={roi.name}
                    secondary={`ID: ${roi.id}`}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Action Buttons */}
      {totalZones > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={onClearAll}
              fullWidth
            >
              Clear All Zones
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={onSubmit}
              fullWidth
            >
              Submit to EMDX
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ZonesSidebar;
