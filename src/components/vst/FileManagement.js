import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { getFiles, deleteFile, downloadFile } from "../../services/vst/api_vst";
import { apiCall } from "../../services/vst/api_vst";

const FileManagement = ({ baseUrl, authToken, onError }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [baseUrl, authToken]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await getFiles(baseUrl, authToken);
      setFiles(data.files || []); // Assume response has { files: [...] }
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFile(baseUrl, authToken, fileId);
      fetchFiles();
    } catch (error) {
      onError(error);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const blob = await downloadFile(baseUrl, authToken, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "video.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        File Management
      </Typography>
      {loading ? (
        <Typography>Loading files...</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No files available</TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.id}</TableCell>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.size} bytes</TableCell>
                  <TableCell>
                    {new Date(file.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleDownloadFile(file.id, file.name)}
                      >
                        Download
                      </Button>
                      <Button
                        color="error"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      <Button sx={{ mt: 2 }} variant="contained" onClick={fetchFiles}>
        Refresh Files
      </Button>
    </Paper>
  );
};

export default FileManagement;
