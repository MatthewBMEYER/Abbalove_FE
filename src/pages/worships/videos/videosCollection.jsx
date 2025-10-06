import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    Chip,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../../store/userStore";
import api from "../../../api";

const VideoCollection = () => {
    const [videos, setVideos] = useState([]);
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useUserStore();

    const isAdmin = user?.roleName === "admin" || user?.roleName === "master";
    const isSearchActive = searchQuery.trim() !== "";

    const fetchVideos = async (query = "") => {
        try {
            setLoading(true);
            const res = await api.get(`/videos?search=${query}`);
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
            setSearchQuery(search);
            await fetchVideos(search);
        }
    };

    const handleClearSearch = () => {
        setSearch("");
        setSearchQuery("");
        fetchVideos("");
    };

    const handleCardClick = (id) => navigate(`/worship/video/${id}`);
    const handleUploadClick = () => navigate("/worship/video/new");
    const handleManageClick = () => navigate("/worship/video/manage");

    return (
        <Box sx={{ minHeight: "100vh", height: "100%" }}>
            {/* Header Bar */}
            <Box
                sx={{
                    bgcolor: "background.paper",
                    // borderBottom: 1,
                    // borderColor: "divider",
                    px: 3,
                    py: 1.5,
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    justifyContent="space-between"
                >
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
                            flex: 1,
                            maxWidth: "600px",
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

                    {isAdmin && (
                        <Stack direction="row" spacing={1}>
                            <IconButton
                                onClick={handleUploadClick}
                                sx={{
                                    bgcolor: "action.hover",
                                    "&:hover": { bgcolor: "action.selected" },
                                }}
                            >
                                <AddIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleManageClick}
                                sx={{
                                    bgcolor: "action.hover",
                                    "&:hover": { bgcolor: "action.selected" },
                                }}
                            >
                                <SettingsIcon />
                            </IconButton>
                        </Stack>
                    )}
                </Stack>
            </Box>

            {/* Content */}
            <Box px={3} py={3}>
                {loading ? (
                    <Box display="flex" justifyContent="center" mt={8}>
                        <CircularProgress />
                    </Box>
                ) : isSearchActive ? (
                    // ======= Search Results - Vertical List (YouTube style) =======
                    <Box maxWidth="1200px" mx="auto">
                        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                            <IconButton
                                onClick={handleClearSearch}
                                sx={{
                                    bgcolor: "action.hover",
                                    "&:hover": { bgcolor: "action.selected" },
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight={600}>
                                {videos.length > 0
                                    ? `Search results for "${searchQuery}"`
                                    : `No results found for "${searchQuery}"`
                                }
                            </Typography>
                        </Stack>

                        {videos.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" mt={8}>
                                Try different keywords
                            </Typography>
                        ) : (
                            <Stack spacing={2}>
                                {videos.map((video) => (
                                    <Box
                                        key={video.id}
                                        onClick={() => handleCardClick(video.id)}
                                        sx={{
                                            display: "flex",
                                            flexDirection: { xs: "column", sm: "row" },
                                            gap: 2,
                                            cursor: "pointer",
                                            p: 1,
                                            borderRadius: 2,
                                            transition: "background-color 0.2s",
                                            "&:hover": {
                                                bgcolor: "action.hover",
                                            },
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        <Box
                                            sx={{
                                                width: { xs: "100%", sm: "360px" },
                                                minWidth: { sm: "360px" },
                                                aspectRatio: "16/9",
                                                borderRadius: 2,
                                                overflow: "hidden",
                                                bgcolor: "action.hover",
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
                                        </Box>

                                        {/* Video Info */}
                                        <Box flex={1}>
                                            <Typography
                                                variant="h6"
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

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 1 }}
                                            >
                                                {timeAgo(video.createDate)}
                                            </Typography>

                                            {video.description && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                        mb: 1,
                                                    }}
                                                >
                                                    {video.description}
                                                </Typography>
                                            )}

                                            {video.tags && video.tags.length > 0 && (
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {video.tags.map((tag) => (
                                                        <Chip
                                                            key={tag.id}
                                                            label={tag.name}
                                                            size="small"
                                                            sx={{
                                                                height: "22px",
                                                                fontSize: "0.75rem",
                                                                bgcolor: "action.hover",
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                ) : videos.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" mt={8}>
                        No videos found
                    </Typography>
                ) : (
                    // ======= Default Grid View =======
                    <Grid container spacing={2}>
                        {videos.map((video) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
                                <Box
                                    onClick={() => handleCardClick(video.id)}
                                    sx={{
                                        cursor: "pointer",
                                        "&:hover .thumbnail": {
                                            transform: "scale(1.005)",
                                            borderRadius: 0
                                        },
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <Box
                                        className="thumbnail"
                                        sx={{
                                            width: "100%",
                                            aspectRatio: "16/9",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            bgcolor: "action.hover",
                                            transition: "0.2s",
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
                                    </Box>

                                    {/* Video Info */}
                                    <Box mt={1.5}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color="text.primary"
                                            sx={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                lineHeight: 1.4,
                                                mb: 0.5,
                                            }}
                                        >
                                            {video.title}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 0.5 }}
                                        >
                                            {timeAgo(video.createDate)}
                                        </Typography>

                                        {video.tags && video.tags.length > 0 && (
                                            <Box display="flex" gap={0.5} flexWrap="wrap">
                                                {video.tags.slice(0, 2).map((tag) => (
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
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
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

// Convert date to "time ago"
function timeAgo(date) {
    if (!date) return "";
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    const units = [
        { label: "year", secs: 31536000 },
        { label: "month", secs: 2592000 },
        { label: "day", secs: 86400 },
        { label: "hour", secs: 3600 },
        { label: "minute", secs: 60 },
    ];

    for (const unit of units) {
        const value = Math.floor(diff / unit.secs);
        if (value >= 1)
            return `${value} ${unit.label}${value > 1 ? "s" : ""} ago`;
    }
    return "Just now";
}

export default VideoCollection;