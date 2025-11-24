import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    Chip,
    Tooltip,
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
import { useUserStore } from "../../store/userStore";
import api from "../../api";

// Fixed tags - no need to fetch from API
const FIXED_TAGS = [
    "Sunday Service",
    "Bible Study",
    "Youth Ministry",
    "Prayer Meeting",
    "Worship Night",
    "Testimony",
    "Special Event",
];

const VideoCollection = () => {
    const [videos, setVideos] = useState([]);
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const { user } = useUserStore();

    const observerTarget = useRef(null);
    const initialLoadRef = useRef(true);

    const isAdmin = user?.roleName === "admin" || user?.roleName === "master";
    const isSearchActive = searchQuery.trim() !== "";

    const fetchVideos = async (query = "", tagName = null, pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let url = `/videos?search=${query}&page=${pageNum}&limit=12`;
            if (tagName) {
                url += `&tag=${encodeURIComponent(tagName)}`;
            }

            const res = await api.get(url);
            if (res.data.success) {
                const responseData = res.data.data;
                const newVideos = responseData.videos || [];
                const pagination = responseData.pagination || {};

                if (append) {
                    setVideos(prev => [...prev, ...newVideos]);
                } else {
                    setVideos(newVideos);
                }

                // Use the hasMore from backend response
                setHasMore(pagination.hasMore || false);
            } else {
                if (!append) {
                    setVideos([]);
                }
                setHasMore(false);
            }
        } catch (err) {
            console.error("Fetch videos error:", err);
            if (!append) {
                setVideos([]);
            }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Initial load and when search/tag changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchVideos(searchQuery, selectedTag, 1, false);
    }, [searchQuery, selectedTag]);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchVideos(searchQuery, selectedTag, nextPage, true);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [page, hasMore, loading, loadingMore, searchQuery, selectedTag]);

    const handleSearch = async (e) => {
        if (e.key === "Enter") {
            setSearchQuery(search);
            setPage(1);
            setHasMore(true);
            await fetchVideos(search, selectedTag, 1, false);
        }
    };

    const handleClearSearch = () => {
        setSearch("");
        setSearchQuery("");
        setSelectedTag(null);
        setPage(1);
        setHasMore(true);
        fetchVideos("", null, 1, false);
    };

    const handleTagClick = (tagName) => {
        const newSelectedTag = selectedTag === tagName ? null : tagName;
        setSelectedTag(newSelectedTag);
        setPage(1);
        setHasMore(true);
        fetchVideos(searchQuery, newSelectedTag, 1, false);
    };

    const handleCardClick = (id) => navigate(`/video/${id}`);
    const handleUploadClick = () => navigate("/video/new");
    const handleManageClick = () => navigate("/video/manage");

    return (
        <Box sx={{ minHeight: "100vh", height: "100%" }}>
            {/* Header Bar */}
            <Box
                sx={{
                    bgcolor: "background.paper",
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
                            <Tooltip title="Manage" placement="bottom">
                                <IconButton
                                    onClick={handleManageClick}
                                    sx={{
                                        bgcolor: "action.hover",
                                        "&:hover": { bgcolor: "action.selected" },
                                    }}
                                >
                                    <SettingsIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                </Stack>
            </Box>

            {/* Tag Filters */}
            <Box
                sx={{
                    bgcolor: "background.paper",
                    px: 3,
                    py: 1.5,
                    zIndex: 9,
                    overflowX: "auto",
                    "&::-webkit-scrollbar": {
                        height: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        bgcolor: "action.hover",
                        borderRadius: "3px",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        minWidth: "min-content",
                    }}
                >
                    <Chip
                        label="All"
                        onClick={() => handleTagClick(null)}
                        sx={{
                            bgcolor: selectedTag === null ? "primary.main" : "action.hover",
                            color: selectedTag === null ? "primary.contrastText" : "text.primary",
                            fontWeight: selectedTag === null ? 600 : 400,
                            "&:hover": {
                                bgcolor: selectedTag === null ? "primary.dark" : "action.selected",
                            },
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    />
                    {FIXED_TAGS.map((tagName) => (
                        <Chip
                            key={tagName}
                            label={tagName}
                            onClick={() => handleTagClick(tagName)}
                            sx={{
                                bgcolor: selectedTag === tagName ? "primary.main" : "action.hover",
                                color: selectedTag === tagName ? "primary.contrastText" : "text.primary",
                                fontWeight: selectedTag === tagName ? 600 : 400,
                                "&:hover": {
                                    bgcolor: selectedTag === tagName ? "primary.dark" : "action.selected",
                                },
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                        />
                    ))}
                </Box>
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
                            <>
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

                                {/* Loading indicator for search results */}
                                {loadingMore && (
                                    <Box display="flex" justifyContent="center" mt={4}>
                                        <CircularProgress size={30} />
                                    </Box>
                                )}

                                {/* Observer target for search results */}
                                {hasMore && !loadingMore && (
                                    <div ref={observerTarget} style={{ height: "20px" }} />
                                )}
                            </>
                        )}
                    </Box>
                ) : videos.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" mt={8}>
                        No videos found
                    </Typography>
                ) : (
                    // ======= Default Grid View - YouTube Style Fluid Layout =======
                    <>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                                gap: 2,
                            }}
                        >
                            {videos.map((video) => (
                                <Box
                                    key={video.id}
                                    sx={{
                                        cursor: "pointer",
                                        width: "100%",
                                        overflow: "hidden",
                                        "&:hover .thumbnail": {
                                            transform: "scale(1.005)",
                                            borderRadius: 0,
                                        },
                                    }}
                                    onClick={() => handleCardClick(video.id)}
                                >
                                    {/* Thumbnail - Fixed Aspect Ratio */}
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
                                                `https://img.youtube.com/vi/${extractVideoId(video.youtube_url)}/hqdefault.jpg`
                                            }
                                            alt={video.title}
                                            width="100%"
                                            height="100%"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </Box>

                                    {/* Video Info */}
                                    <Box mt={1.5}>
                                        {/* Title - Dynamic height but still max 2 lines */}
                                        <Tooltip title={video.title} placement="top" arrow>
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color="text.primary"
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    lineHeight: "20px",
                                                    wordBreak: "break-word",
                                                    overflowWrap: "break-word",
                                                    mb: 0.3,
                                                    minHeight: "20px",
                                                }}
                                            >
                                                {video.title}
                                            </Typography>
                                        </Tooltip>

                                        {/* Date */}
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display: "block",
                                                mb: 0.5,
                                                lineHeight: "18px",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {timeAgo(video.createDate)}
                                        </Typography>

                                        {/* Tags */}
                                        <Box
                                            sx={{
                                                height: "24px",
                                                overflow: "hidden",
                                                display: "flex",
                                                gap: 0.5,
                                            }}
                                        >
                                            {video.tags && video.tags.length > 0 && (
                                                <>
                                                    {video.tags.slice(0, 2).map((tag) => (
                                                        <Chip
                                                            key={tag.id}
                                                            label={tag.name}
                                                            size="small"
                                                            sx={{
                                                                height: "20px",
                                                                fontSize: "0.7rem",
                                                                bgcolor: "action.hover",
                                                                maxWidth: "calc(50% - 4px)",
                                                                "& .MuiChip-label": {
                                                                    px: 1,
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                },
                                                            }}
                                                        />
                                                    ))}
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* Loading indicator for grid view */}
                        {loadingMore && (
                            <Box display="flex" justifyContent="center" mt={4}>
                                <CircularProgress size={30} />
                            </Box>
                        )}

                        {/* Observer target for grid view */}
                        {hasMore && !loadingMore && (
                            <div ref={observerTarget} style={{ height: "20px" }} />
                        )}
                    </>
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