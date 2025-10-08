import React, { useEffect, useState } from "react";
import {
    Box,
    Stack,
    Typography,
    Chip,
    IconButton,
    CircularProgress,
    Button,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "../../../store/userStore";
import api from "../../../api";

const VideoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        youtube_url: "",
        tags: [],
    });

    // Available tags for autocomplete
    const [availableTags, setAvailableTags] = useState([]);

    const isAdmin = user?.roleName === "admin" || user?.roleName === "master";

    // Fetch video details
    const fetchVideo = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/videos/${id}`);
            if (res.data.success) {
                setVideo(res.data.data);
                setEditForm({
                    title: res.data.data.title,
                    description: res.data.data.description || "",
                    youtube_url: res.data.data.youtube_url,
                    tags: res.data.data.tags || [],
                });
            }
        } catch (err) {
            console.error("Fetch video error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch available tags
    const fetchTags = async () => {
        try {
            const res = await api.get("/tags");
            if (res.data.success) {
                setAvailableTags(res.data.data);
            }
        } catch (err) {
            console.error("Fetch tags error:", err);
        }
    };

    useEffect(() => {
        fetchVideo();
        fetchTags();
    }, [id]);

    // Handle edit mode
    const handleEditClick = () => {
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        // Reset form to original values
        setEditForm({
            title: video.title,
            description: video.description || "",
            youtube_url: video.youtube_url,
            tags: video.tags || [],
        });
    };

    // Save changes
    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await api.put(`/videos/${id}`, {
                title: editForm.title,
                description: editForm.description,
                youtube_url: editForm.youtube_url,
                tag_ids: editForm.tags.map((tag) => tag.id),
            });
            if (res.data.success) {
                setVideo(res.data.data);
                setEditMode(false);
            }
        } catch (err) {
            console.error("Save video error:", err);
        } finally {
            setSaving(false);
        }
    };

    // Delete video
    const handleDelete = async () => {
        try {
            const res = await api.delete(`/videos/${id}`);
            if (res.data.success) {
                navigate("/worship/video/manage");
            }
        } catch (err) {
            console.error("Delete video error:", err);
        }
        setDeleteDialog(false);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!video) {
        return (
            <Box sx={{ minHeight: "100vh", p: 3 }}>
                <Typography color="text.secondary" textAlign="center">
                    Video not found
                </Typography>
            </Box>
        );
    }

    const videoId = extractVideoId(video.youtube_url);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
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
                <Stack direction="row" alignItems="center" spacing={2}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{
                            bgcolor: "action.hover",
                            "&:hover": { bgcolor: "action.selected" },
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                        {editMode ? "Edit Video" : "Video Details"}
                    </Typography>

                    {isAdmin && !editMode && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                startIcon={<EditIcon />}
                                variant="contained"
                                onClick={handleEditClick}
                            >
                                Edit
                            </Button>
                            <Button
                                startIcon={<DeleteIcon />}
                                variant="outlined"
                                color="error"
                                onClick={() => setDeleteDialog(true)}
                            >
                                Delete
                            </Button>
                        </Stack>
                    )}

                    {editMode && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                startIcon={<CloseIcon />}
                                variant="outlined"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                startIcon={<SaveIcon />}
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Box>

            {/* Content */}
            <Box maxWidth="1200px" mx="auto" px={3} py={4}>
                <Stack spacing={3}>
                    {/* Video Player */}
                    <Box
                        sx={{
                            width: "100%",
                            aspectRatio: "16/9",
                            borderRadius: 2,
                            overflow: "hidden",
                            bgcolor: "black",
                        }}
                    >
                        {videoId ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography color="error">Invalid YouTube URL</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Video Information */}
                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            p: 3,
                        }}
                    >
                        {editMode ? (
                            // Edit Mode
                            <Stack spacing={3}>
                                <TextField
                                    label="Title"
                                    fullWidth
                                    value={editForm.title}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, title: e.target.value })
                                    }
                                    required
                                />

                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={editForm.description}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, description: e.target.value })
                                    }
                                />

                                <TextField
                                    label="YouTube URL"
                                    fullWidth
                                    value={editForm.youtube_url}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, youtube_url: e.target.value })
                                    }
                                    required
                                    helperText="e.g., https://www.youtube.com/watch?v=VIDEO_ID"
                                />

                                <Autocomplete
                                    multiple
                                    options={availableTags}
                                    getOptionLabel={(option) => option.name}
                                    value={editForm.tags}
                                    onChange={(e, newValue) =>
                                        setEditForm({ ...editForm, tags: newValue })
                                    }
                                    renderInput={(params) => (
                                        <TextField {...params} label="Tags" placeholder="Select tags" />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option.name}
                                                {...getTagProps({ index })}
                                                size="small"
                                            />
                                        ))
                                    }
                                />
                            </Stack>
                        ) : (
                            // View Mode
                            <Stack spacing={2}>
                                <Typography variant="h5" fontWeight={600}>
                                    {video.title}
                                </Typography>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(video.createDate)}
                                    </Typography>
                                </Stack>

                                {video.tags && video.tags.length > 0 && (
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {video.tags.map((tag) => (
                                            <Chip
                                                key={tag.id}
                                                label={tag.name}
                                                size="small"
                                                sx={{
                                                    bgcolor: "primary.main",
                                                    color: "primary.contrastText",
                                                    fontWeight: 500,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}

                                <Divider />

                                {video.description ? (
                                    <Typography
                                        variant="body2"
                                        color="text.primary"
                                        sx={{ whiteSpace: "pre-wrap" }}
                                    >
                                        {video.description}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                        No description available
                                    </Typography>
                                )}

                                <Divider />

                                {/* Additional Info */}
                                <Stack spacing={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>Video ID:</strong> {video.id}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>YouTube URL:</strong>{" "}
                                        <a
                                            href={video.youtube_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "inherit" }}
                                        >
                                            {video.youtube_url}
                                        </a>
                                    </Typography>
                                    {video.createDate && (
                                        <Typography variant="caption" color="text.secondary">
                                            <strong>Created:</strong> {formatDateFull(video.createDate)}
                                        </Typography>
                                    )}
                                    {video.updateDate && (
                                        <Typography variant="caption" color="text.secondary">
                                            <strong>Last Updated:</strong>{" "}
                                            {formatDateFull(video.updateDate)}
                                        </Typography>
                                    )}
                                </Stack>
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                <DialogTitle>Delete Video</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{video.title}"? This action cannot be undone.
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

// Format date (short)
function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// Format date (full with time)
function formatDateFull(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default VideoDetail;