import React, { useEffect, useState } from "react";
import {
    Box,
    Stack,
    Typography,
    TextField,
    Chip,
    IconButton,
    CircularProgress,
    InputAdornment,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    Tooltip,
    DialogActions,
    Button,
    Switch,
    Divider,
    Snackbar,
    Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import AddIcon from "@mui/icons-material/Add";

const VideoManage = () => {
    const [videos, setVideos] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const navigate = useNavigate();

    // Fetch all videos for management
    const fetchVideos = async (query = "") => {
        try {
            setLoading(true);
            // Assuming API endpoint returns all videos including hidden ones for admin
            const res = await api.get(`/videos/admin?search=${query}`);
            if (res.data.success) {
                setVideos(res.data.data);
            } else {
                setVideos([]);
            }
        } catch (err) {
            console.error("Fetch videos error:", err);
            setVideos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleSearch = async (e) => {
        if (e.key === "Enter") {
            await fetchVideos(search);
        }
    };

    // Toggle video visibility (hide/unhide)
    const handleToggleVisibility = async (video) => {
        try {
            const newStatus = !video.isActive;
            const res = await api.put(`/videos/visibility/${video.id}`, {
                isActive: newStatus,
            });
            if (res.data.success) {
                // Re-fetch to get updated data from backend
                await fetchVideos(search);
                setSnackbar({
                    open: true,
                    message: `Video successfully ${newStatus ? "made public" : "hidden"}`,
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message: "Failed to update video visibility",
                    severity: "error",
                });
            }
        } catch (err) {
            console.error("Toggle visibility error:", err);
            setSnackbar({
                open: true,
                message: "Error updating video visibility",
                severity: "error",
            });
        }
        handleMenuClose();
    };

    // Delete video
    const handleDelete = async () => {
        if (!selectedVideo) return;
        try {
            const res = await api.delete(`/videos/${selectedVideo.id}`);
            if (res.data.success) {
                // Re-fetch to get updated data from backend
                await fetchVideos(search);
                setSnackbar({
                    open: true,
                    message: "Video successfully deleted",
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message: "Failed to delete video",
                    severity: "error",
                });
            }
        } catch (err) {
            console.error("Delete video error:", err);
            setSnackbar({
                open: true,
                message: "Error deleting video",
                severity: "error",
            });
        }
        setDeleteDialog(false);
        setSelectedVideo(null);
    };

    const handleUploadClick = () => navigate("/worship/video/new");

    // Navigate to edit page
    const handleEdit = (video) => {
        navigate(`/worship/video/${video.id}`);
        handleMenuClose();
    };

    // Menu handlers
    const handleMenuOpen = (event, video) => {
        setAnchorEl(event.currentTarget);
        setSelectedVideo(video);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteClick = () => {
        setDeleteDialog(true);
        handleMenuClose();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ height: "100%" }}>
            {/* Header */}
            <Box
                sx={{
                    bgcolor: "background.paper",
                    px: 3,
                    py: 2,
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>

                    <TextField
                        variant="outlined"
                        placeholder="Search videos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: "400px",
                            "& .MuiOutlinedInput-root": {
                                bgcolor: "action.hover",
                                borderRadius: "20px",
                                "& fieldset": { border: "none" },
                                "&:hover": {
                                    bgcolor: "action.selected",
                                },
                                "&.Mui-focused": {
                                    bgcolor: "background.paper",
                                    "& fieldset": {
                                        border: 1,
                                        borderColor: "primary.main",
                                    },
                                },
                            },
                        }}
                    />

                    <Tooltip title="Upload" placement="bottom">
                        <IconButton
                            onClick={handleUploadClick}
                            sx={{
                                bgcolor: "action.hover",
                                "&:hover": { bgcolor: "action.selected" },
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            {/* Content */}
            <Box px={1} py={3}>
                {loading ? (
                    <Box display="flex" justifyContent="center" mt={8}>
                        <CircularProgress />
                    </Box>
                ) : videos.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" mt={8}>
                        No videos found
                    </Typography>
                ) : (
                    <Box mx="auto">
                        {/* Table Header */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{
                                px: 2,
                                py: 1,
                                borderBottom: 1,
                                borderColor: "divider",
                                mb: 1,
                            }}
                        >
                            <Box sx={{ width: "160px" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    VIDEO
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    DETAILS
                                </Typography>
                            </Box>
                            <Box sx={{ width: "100px", textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    VISIBILITY
                                </Typography>
                            </Box>
                            <Box sx={{ width: "100px", textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    DATE
                                </Typography>
                            </Box>
                            <Box sx={{ width: "60px" }}></Box>
                        </Stack>

                        {/* Video List */}
                        <Stack spacing={0}>
                            {videos.map((video) => (
                                <Box
                                    key={video.id}
                                    sx={{
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: 1,
                                        transition: "background-color 0.2s",
                                        "&:hover": {
                                            bgcolor: "action.hover",
                                        },
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        {/* Thumbnail */}
                                        <Box
                                            onClick={() => navigate(`/worship/video/${video.id}`)}
                                            sx={{
                                                width: "160px",
                                                minWidth: "160px",
                                                aspectRatio: "16/9",
                                                borderRadius: 1,
                                                overflow: "hidden",
                                                bgcolor: "action.hover",
                                                cursor: "pointer",
                                                position: "relative",
                                            }}
                                        >
                                            <img
                                                src={
                                                    video.thumbnail_url ||
                                                    `https://img.youtube.com/vi/${extractVideoId(
                                                        video.youtube_url
                                                    )}/hqdefault.jpg`
                                                }
                                                alt={video.title}
                                                width="100%"
                                                height="100%"
                                                style={{ objectFit: "cover" }}
                                            />
                                            {!video.isActive && (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        bgcolor: "rgba(0,0,0,0.6)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <VisibilityOffIcon sx={{ color: "white" }} />
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Video Details */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color="text.primary"
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    mb: 0.5,
                                                }}
                                            >
                                                {video.title}
                                            </Typography>

                                            {video.description && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {video.description}
                                                </Typography>
                                            )}

                                            {video.tags && video.tags.length > 0 && (
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {video.tags.slice(0, 3).map((tag) => (
                                                        <Chip
                                                            key={tag.id}
                                                            label={tag.name}
                                                            size="small"
                                                            sx={{
                                                                height: "20px",
                                                                fontSize: "0.7rem",
                                                                bgcolor: "action.hover",
                                                            }}
                                                        />
                                                    ))}
                                                    {video.tags.length > 3 && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ ml: 0.5, alignSelf: "center" }}
                                                        >
                                                            +{video.tags.length - 3} more
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Visibility Status */}
                                        <Box
                                            sx={{
                                                width: "100px",
                                                display: "flex",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Chip
                                                label={video.isActive ? "Public" : "Hidden"}
                                                size="small"
                                                sx={{
                                                    bgcolor: video.isActive
                                                        ? "success.main"
                                                        : "action.hover",
                                                    color: video.isActive
                                                        ? "success.contrastText"
                                                        : "text.secondary",
                                                }}
                                            />
                                        </Box>

                                        {/* Date */}
                                        <Box sx={{ width: "100px", textAlign: "center" }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(video.createDate)}
                                            </Typography>
                                        </Box>

                                        {/* Actions */}
                                        <Box sx={{ width: "60px", display: "flex", justifyContent: "center" }}>
                                            <IconButton
                                                onClick={(e) => handleMenuOpen(e, video)}
                                                size="small"
                                                sx={{
                                                    "&:hover": { bgcolor: "action.selected" },
                                                }}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <MenuItem onClick={() => handleEdit(selectedVideo)}>
                    <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                    Detail
                </MenuItem>
                <MenuItem onClick={() => handleToggleVisibility(selectedVideo)}>
                    {selectedVideo?.isActive ? (
                        <>
                            <VisibilityOffIcon sx={{ mr: 1, fontSize: 20 }} />
                            Hide
                        </>
                    ) : (
                        <>
                            <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
                            Make Public
                        </>
                    )}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
                    <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                <DialogTitle>Delete Video</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{selectedVideo?.title}"? This action cannot
                        be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Extract YouTube ID
function extractVideoId(url) {
    try {
        const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

// Format date
function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default VideoManage;