import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Button,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Component displaying configured tripwires and ROIs with options to delete or submit
 */
const ZoneList = ({ tripwires, rois, onDelete, onClearAll, onSubmit }) => {
  if (tripwires.length === 0 && rois.length === 0) {
    return null;
  }

  return (
    <Accordion defaultExpanded sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">
          Configured Zones ({tripwires.length} tripwire
          {tripwires.length !== 1 ? "s" : ""}, {rois.length} ROI
          {rois.length !== 1 ? "s" : ""})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {tripwires.map((tripwire) => (
            <React.Fragment key={tripwire.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => onDelete(tripwire.id, "tripwire")}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`🟢 ${tripwire.name}`}
                  secondary={`ID: ${tripwire.id} | Type: Tripwire | Entry: ${tripwire.direction.entry.name} → Exit: ${tripwire.direction.exit.name}`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          {rois.map((roi) => (
            <React.Fragment key={roi.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => onDelete(roi.id, "roi")}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`🔷 ${roi.name}`}
                  secondary={`ID: ${roi.id} | Type: ROI`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="error"
            onClick={onClearAll}
            sx={{ mr: 1 }}
          >
            🗑️ Clear All
          </Button>
          <Button variant="contained" color="success" onClick={onSubmit}>
            📤 Submit to EMDX
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ZoneList;
