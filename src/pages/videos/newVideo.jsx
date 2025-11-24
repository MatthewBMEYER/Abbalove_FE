import React, { useState, useEffect } from "react";
import {
    Box,
    TextField,
    Typography,
    Button,
    Stack,
    Snackbar,
    Alert,
    Chip,
    CircularProgress,
    Autocomplete,
    Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import api from "../../api";
import { VideoLibrary } from "@mui/icons-material";
import { useTags } from "../../hook/useTags"; // Import the custom hook

const NewVideo = () => {
    const navigate = useNavigate();
    const { user, loaded } = useUserStore();

    const isAdmin = user?.roleName === "admin" || user?.roleName === "master";

    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventDate, setEventDate] = useState(dayjs());
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    // Use the custom hook for tags
    const { availableTags, loading: tagsLoading } = useTags();

    useEffect(() => {
        if (!loaded) return;

        if (!isAdmin) {
            navigate(-1);
        }
    }, [loaded, isAdmin, navigate]);

    const extractVideoId = (url) => {
        try {
            const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
            const match = url.match(regExp);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // Tag utility functions
    const getTagLabel = (option) => {
        return typeof option === "string" ? option : option.name;
    };

    const handleTagsChange = (event, newValue) => {
        const processedTags = [];
        const seen = new Set();

        for (const tag of newValue) {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            const normalized = tagName.toLowerCase().trim();

            // Check for duplicates
            if (seen.has(normalized)) {
                setSnackbar({
                    open: true,
                    message: `Tag "${tagName}" is already added`,
                    severity: "warning"
                });
                continue;
            }

            // Convert string to existing tag object if available
            if (typeof tag === 'string') {
                const existingTag = availableTags.find(t =>
                    t.name.toLowerCase().trim() === normalized
                );
                if (existingTag) {
                    processedTags.push(existingTag);
                    seen.add(normalized);
                    continue;
                }
            }

            // Add the tag
            processedTags.push(tag);
            seen.add(normalized);
        }

        setTags(processedTags);
    };

    const videoId = extractVideoId(youtubeUrl);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

    const handleSubmit = async () => {
        if (!youtubeUrl || !title) {
            setSnackbar({ open: true, message: "YouTube URL and Title are required!", severity: "warning" });
            return;
        }

        const id = extractVideoId(youtubeUrl);
        if (!id) {
            setSnackbar({ open: true, message: "Invalid YouTube URL!", severity: "error" });
            return;
        }

        try {
            setLoading(true);

            // Prepare tags - ensure we only send tag names to backend
            const tagNames = tags.map(tag =>
                typeof tag === "string" ? tag : tag.name
            );

            const res = await api.post("/videos", {
                title,
                youtube_url: youtubeUrl,
                embed_url: embedUrl,
                thumbnail_url: thumbnailUrl,
                description,
                event_date: eventDate ? dayjs(eventDate).format("YYYY-MM-DD") : null,
                tags: tagNames,
                createBy: user?.id,
            });

            if (res.data.success) {
                setSnackbar({ open: true, message: "Video uploaded successfully 🎉", severity: "success" });
                setTimeout(() => navigate("/video/collections"), 1500);
            } else {
                throw new Error(res.data.message || "Upload failed");
            }
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to upload video", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box p={3} maxWidth="1400px" mx="auto">
                <Typography variant="h5" fontWeight={600} mb={4}>
                    Upload YouTube Video
                </Typography>

                <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
                    {/* Left Column - Input Fields */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack spacing={3}>
                            <TextField
                                label="YouTube URL"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                fullWidth
                                required
                                placeholder="https://www.youtube.com/watch?v=..."
                            />

                            <TextField
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                fullWidth
                                required
                                placeholder="Enter video title"
                            />

                            <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Add a description for this video"
                            />

                            <DatePicker
                                label="Event Date"
                                value={eventDate}
                                onChange={(newValue) => setEventDate(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />

                            {/* Updated Autocomplete using the hook */}
                            <Autocomplete
                                multiple
                                freeSolo
                                options={availableTags}
                                getOptionLabel={getTagLabel}
                                value={tags}
                                onChange={handleTagsChange}
                                filterOptions={(options, params) => {
                                    const inputValue = params.inputValue.toLowerCase().trim();
                                    const selectedNames = new Set(tags.map(tag =>
                                        getTagLabel(tag).toLowerCase().trim()
                                    ));

                                    const filtered = options.filter(option =>
                                        !selectedNames.has(option.name.toLowerCase().trim()) &&
                                        option.name.toLowerCase().includes(inputValue)
                                    );

                                    // Only allow new tag if it doesn't exist and isn't selected
                                    if (inputValue &&
                                        !selectedNames.has(inputValue) &&
                                        !options.some(opt => opt.name.toLowerCase().trim() === inputValue)) {
                                        filtered.push(inputValue);
                                    }

                                    return filtered;
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            variant="outlined"
                                            label={getTagLabel(option)}
                                            {...getTagProps({ index })}
                                            key={index}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Tags"
                                        placeholder="Add or select tags"
                                        helperText={tagsLoading ? "Loading tags..." : ""}
                                    />
                                )}
                                disabled={tagsLoading}
                            />
                        </Stack>
                    </Box>

                    {/* Right Column - Preview */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack spacing={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    bgcolor: "background.paper",
                                }}
                            >
                                {videoId ? (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            aspectRatio: "16/9",
                                            position: "relative",
                                        }}
                                    >
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={embedUrl}
                                            title="Video Preview"
                                            allowFullScreen
                                            style={{ border: 0 }}
                                        />
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            aspectRatio: "16/9",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: "action.hover",
                                            color: "text.secondary",
                                        }}
                                    >
                                        <Stack alignItems="center" spacing={2}>
                                            <VideoLibrary sx={{ fontSize: 64, opacity: 0.3 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Video preview will appear here
                                            </Typography>
                                        </Stack>
                                    </Box>
                                )}

                                {/* Video Details Preview */}
                                <Box p={3}>
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        gutterBottom
                                        sx={{
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                            hyphens: "auto",
                                        }}
                                    >
                                        {title || "Video Title"}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        paragraph
                                        sx={{
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                            hyphens: "auto",
                                        }}
                                    >
                                        {description || "Video description will appear here..."}
                                    </Typography>

                                    {eventDate && (
                                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                                            Event Date: {dayjs(eventDate).format("MMM DD, YYYY")}
                                        </Typography>
                                    )}

                                    {tags.length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                            {tags.map((tag, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={getTagLabel(tag)}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "action.hover",
                                                        color: "text.primary",
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Paper>

                            {/* Action Buttons */}
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button variant="outlined" onClick={() => navigate("/video/collections")} size="large">
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    startIcon={loading && <CircularProgress size={18} color="inherit" />}
                                    size="large"
                                >
                                    {loading ? "Uploading..." : "Upload Video"}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Box>

                {/* Snackbar Feedback */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={2500}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        severity={snackbar.severity}
                        sx={{ width: "100%" }}
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default NewVideo;