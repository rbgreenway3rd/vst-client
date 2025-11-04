import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";

/**
 * Dialog component for configuring tripwire and ROI details
 */
const ZoneItemDialog = ({
  open,
  onClose,
  onSave,
  drawingMode,
  directionP1,
  directionP2,
  onSetDirection,
}) => {
  const [itemName, setItemName] = useState("");
  const [itemId, setItemId] = useState("");
  const [entryName, setEntryName] = useState("Entry side");
  const [exitName, setExitName] = useState("Exit side");
  const [addAlertRule, setAddAlertRule] = useState(false);

  const handleSave = () => {
    if (!itemName.trim()) {
      return;
    }

    // Tripwires require direction, ROIs don't
    if (drawingMode === "tripwire" && (!directionP1 || !directionP2)) {
      return;
    }

    // Auto-generate ID from name if not provided
    const finalId =
      itemId.trim() || itemName.toLowerCase().replace(/\s+/g, "_");

    onSave({
      id: finalId,
      name: itemName,
      entryName: entryName.trim() || "Entry side",
      exitName: exitName.trim() || "Exit side",
      addAlertRule: addAlertRule,
    });

    // Reset form
    setItemName("");
    setItemId("");
    setEntryName("Entry side");
    setExitName("Exit side");
    setAddAlertRule(false);
  };

  const handleClose = () => {
    // Reset form
    setItemName("");
    setItemId("");
    setEntryName("Entry side");
    setExitName("Exit side");
    setAddAlertRule(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {drawingMode === "tripwire" ? "Tripwire" : "ROI"} Details
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={`${drawingMode === "tripwire" ? "Tripwire" : "ROI"} Name *`}
          fullWidth
          value={itemName}
          onChange={(e) => {
            const newName = e.target.value;
            setItemName(newName);
            // Auto-populate ID based on name
            setItemId(newName.toLowerCase().replace(/\s+/g, "_"));
          }}
          placeholder={`e.g., Main ${
            drawingMode === "tripwire" ? "door" : "area"
          }`}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label={`${
            drawingMode === "tripwire" ? "Tripwire" : "ROI"
          } ID (auto-generated, editable)`}
          fullWidth
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          placeholder="Auto-generated from name"
          helperText="Auto-populated based on name. You can edit if needed."
          sx={{ mb: 3 }}
        />

        {drawingMode === "tripwire" && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Direction Arrow (Entry → Exit)
            </Typography>

            <Box
              sx={{
                mb: 2,
                p: 2,
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
              }}
            >
              {!directionP1 || !directionP2 ? (
                <>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    ⚠️ Direction arrow not set
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={onSetDirection}
                    fullWidth
                    color="primary"
                  >
                    📍 Set Direction Arrow
                  </Button>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Click this button, then click two points on the image: entry
                    side first, then exit side
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ color: "green", mb: 1 }}>
                    ✓ Direction arrow set
                  </Typography>
                  <Box sx={{ p: 1, backgroundColor: "white", borderRadius: 1 }}>
                    <Typography variant="body2">
                      🔴 Entry: ({directionP1.x}, {directionP1.y})
                    </Typography>
                    <Typography variant="body2">
                      🔵 Exit: ({directionP2.x}, {directionP2.y})
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={onSetDirection}
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Change Direction
                  </Button>
                </>
              )}
            </Box>

            <Typography
              variant="subtitle2"
              sx={{ mb: 1, mt: 2, fontWeight: "bold" }}
            >
              Direction Labels
            </Typography>

            <TextField
              margin="dense"
              label="Entry Side Name"
              fullWidth
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              placeholder="e.g., Inside the room, North side"
              helperText="Edit the friendly name for the entry direction"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Exit Side Name"
              fullWidth
              value={exitName}
              onChange={(e) => setExitName(e.target.value)}
              placeholder="e.g., Outside the room, South side"
              helperText="Edit the friendly name for the exit direction"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle2"
              sx={{ mb: 1, mt: 2, fontWeight: "bold" }}
            >
              Alert Rules (Optional)
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={addAlertRule}
                  onChange={(e) => setAddAlertRule(e.target.checked)}
                  color="primary"
                />
              }
              label="Add an alert rule for this tripwire"
            />
            <Typography
              variant="caption"
              color="textSecondary"
              display="block"
              sx={{ ml: 4, mb: 2 }}
            >
              Create an alert rule after saving this tripwire to get
              notifications when objects cross this line
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={
            !itemName ||
            (drawingMode === "tripwire" && (!directionP1 || !directionP2))
          }
        >
          Save {drawingMode === "tripwire" ? "Tripwire" : "ROI"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ZoneItemDialog;
