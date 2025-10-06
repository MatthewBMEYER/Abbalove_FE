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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../../store/userStore";
import api from "../../../api";


const NewVideo = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();

    // Allow only admin/master
    const isAdmin = user?.roleName === "admin" || user?.roleName === "master";

    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventDate, setEventDate] = useState(null);
    const [tags, setTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    useEffect(() => {
        if (!isAdmin) {
            navigate("/videos"); // redirect if not allowed
        } else {
            fetchTags();
        }
    }, []);

    // Fetch available tags
    const fetchTags = async () => {
        try {
            const res = await api.get("/videos/tags/all");
            if (res.data.success) setAllTags(res.data.data);
        } catch (err) {
            console.error("Fetch tags error:", err);
        }
    };

    // Extract YouTube ID
    const extractVideoId = (url) => {
        try {
            const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
            const match = url.match(regExp);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    const videoId = extractVideoId(youtubeUrl);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

    // Handle upload
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
            const res = await api.post("/videos", {
                title,
                youtube_url: youtubeUrl,
                embed_url: embedUrl,
                thumbnail_url: thumbnailUrl,
                description,
                //event_date: eventDate ? dayjs(eventDate).format("YYYY-MM-DD") : null,
                tags: tags.map((t) => (typeof t === "string" ? t : t.name)),
                createBy: user?.id,
            });

            if (res.data.success) {
                setSnackbar({ open: true, message: "Video uploaded successfully 🎉", severity: "success" });
                setTimeout(() => navigate("/worship/video/collections"), 1500);
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
            <Box p={3}>
                <Box
                    display="flex"
                    flexDirection="column"
                    gap={2.5}
                    mx="auto"
                    mt={2}
                >
                    <Typography variant="h6" fontWeight={600}>
                        Upload YouTube Video
                    </Typography>

                    {/* YouTube URL */}
                    <TextField
                        label="YouTube URL"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        fullWidth
                        required
                    />

                    {/* Video Preview */}
                    {videoId && (
                        <Box
                            mt={1}
                            sx={{
                                width: "100%",
                                aspectRatio: "16/9",
                                borderRadius: 2,
                                overflow: "hidden",
                                boxShadow: 1,
                            }}
                        >
                            <iframe
                                width="100%"
                                height="100%"
                                src={embedUrl}
                                title="Video Preview"
                                allowFullScreen
                            ></iframe>
                        </Box>
                    )}

                    {/* Title */}
                    <TextField
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                    />

                    {/* Description */}
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                    />

                    {/* Event Date */}
                    {/* <DatePicker
                        label="Event Date"
                        value={eventDate}
                        onChange={(newValue) => setEventDate(newValue)}
                        sx={{ width: "100%" }}
                    /> */}

                    {/* Tags */}
                    <Autocomplete
                        multiple
                        freeSolo
                        options={allTags}
                        getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                        value={tags}
                        onChange={(e, newValue) => setTags(newValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    variant="outlined"
                                    label={typeof option === "string" ? option : option.name}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                        renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add or select tags" />}
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                        <Button variant="outlined" onClick={() => navigate("/worship/video/collections")}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            startIcon={loading && <CircularProgress size={18} color="inherit" />}
                        >
                            {loading ? "Uploading..." : "Upload"}
                        </Button>
                    </Stack>
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
