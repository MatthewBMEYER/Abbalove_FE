import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Stack,
    Skeleton,
    Chip,
    Divider,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    Schedule,
    LocationOn,
    MoreVert,
    Visibility,
    Delete,
    Block,
    Publish,
    EditNote
} from "@mui/icons-material";

// Define keyframes for the pulse animation
const pulseKeyframes = `
    @keyframes pulse-highlight {
        0% { box-shadow: 0 0 0 0 rgba(211, 211, 211, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
        100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
    }
`;

const RowLayout = ({
    events,
    isAdmin,
    formatTime,
    eventTypeOptions,
    statusOptions,
    handleMenuOpen,
    anchorEls,
    handleMenuClose,
    handleViewDetails,
    handleDeleteClick,
    handleOpenCancelDialog,
    handleUpdateStatus,
    viewMode,
}) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [badgeStates, setBadgeStates] = useState({});

    // Calculate badge states once when events change
    useEffect(() => {
        const now = Date.now();
        const newBadgeStates = {};

        events.forEach(event => {
            const createdDiff = now - new Date(event.created_at).getTime();
            const updatedDiff = now - new Date(event.updated_at).getTime();

            const isNew = createdDiff >= 0 && createdDiff < 30000;
            const isJustUpdated = updatedDiff >= 0 && updatedDiff < 30000 && event.created_at !== event.updated_at;

            newBadgeStates[event.id] = {
                isNew,
                isJustUpdated,
                showBadge: isNew || isJustUpdated
            };
        });

        setBadgeStates(newBadgeStates);

        // Set timeout to remove badges after 30 seconds
        const timers = events.map(event => {
            const state = newBadgeStates[event.id];
            if (state?.showBadge) {
                const createdDiff = now - new Date(event.created_at).getTime();
                const updatedDiff = now - new Date(event.updated_at).getTime();
                const minDiff = Math.min(createdDiff, updatedDiff);
                const remainingTime = 30000 - minDiff;

                if (remainingTime > 0) {
                    return setTimeout(() => {
                        setBadgeStates(prev => ({
                            ...prev,
                            [event.id]: {
                                isNew: false,
                                isJustUpdated: false,
                                showBadge: false
                            }
                        }));
                    }, remainingTime);
                }
            }
            return null;
        });

        // Cleanup timers
        return () => {
            timers.forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        };
    }, [events]);

    const handleMenuClick = (event, e) => {
        setSelectedEvent(event);
        handleMenuOpen(event.id, e);
    };

    const handleMenuCloseWithReset = () => {
        setSelectedEvent(null);
        handleMenuClose(selectedEvent?.id);
    };

    return (
        <>
            {/* Define global styles for animation */}
            <style>{pulseKeyframes}</style>

            <Stack spacing={2}>
                {events.map((event) => {
                    const badges = badgeStates[event.id] || { isNew: false, isJustUpdated: false, showBadge: false };

                    return (
                        <Paper
                            key={event.id}
                            variant="outlined"
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                overflow: "hidden",
                                transition: "all 0.5s ease",
                                backgroundColor: event.status === 'cancelled' ? "background.default50" : "background.default",
                                opacity: event.status === 'cancelled' ? 0.8 : 1,
                                position: 'relative',
                                boxShadow: badges.showBadge ? 4 : 'none',
                                animation: badges.showBadge ? 'pulse-highlight 2s infinite ease-in-out' : 'none',
                                "&:hover": { boxShadow: 1 },
                            }}
                        >
                            {/* Show both labels if both conditions are true */}
                            <Box sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                zIndex: 10,
                                display: 'flex',
                                gap: 1
                            }}>
                                {badges.isNew && (
                                    <Box
                                        sx={{
                                            bgcolor: 'success.main',
                                            color: 'white',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            boxShadow: 2
                                        }}
                                    >
                                        New
                                    </Box>
                                )}
                                {badges.isJustUpdated && (
                                    <Box
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            boxShadow: 2
                                        }}
                                    >
                                        Just Updated
                                    </Box>
                                )}
                            </Box>

                            {/* Image Placeholder Box */}
                            <Box sx={{
                                width: { xs: "100%", md: 400 },
                                height: { xs: 200, md: 225 },
                                backgroundColor: "background.default",
                                flexShrink: 0
                            }}>
                                <Skeleton variant="rectangular" width="100%" height="100%" />
                            </Box>

                            <Box sx={{
                                p: 3,
                                flexGrow: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                minWidth: 0
                            }}>
                                {/* Header */}
                                <Box sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    mb: 1
                                }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="h6" fontWeight="700" noWrap>
                                            {event.name}
                                        </Typography>
                                        <Typography variant="body2" color="primary" fontWeight="500">
                                            {eventTypeOptions.find((t) => t.value === event.type)?.label || event.type}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {isAdmin && (
                                            <Chip
                                                size="small"
                                                label={statusOptions.find((s) => s.value === event.status)?.label}
                                                color={statusOptions.find((s) => s.value === event.status)?.color}
                                            />
                                        )}
                                        <IconButton onClick={(e) => handleMenuClick(event, e)}>
                                            <MoreVert />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 1.5 }} />

                                {/* Event Details or Cancelled Info */}
                                <Stack spacing={1.5}>
                                    {/* Cancelled Banner */}
                                    {event.status === 'cancelled' && (
                                        <Box sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            flexWrap: 'wrap',
                                            gap: 1
                                        }}>
                                            <Typography
                                                variant="body2"
                                                color="error.main"
                                                fontWeight="700"
                                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                            >
                                                <Block fontSize="small" />
                                                CANCELLED {event.updated_by_name && `BY ${event.updated_by_name.toUpperCase()}`}
                                            </Typography>
                                            {event.notes && (
                                                <Typography
                                                    variant="caption"
                                                    color='text.primary'
                                                    sx={{ fontStyle: 'italic' }}
                                                >
                                                    Note: "{event.notes}"
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {/* Time Details */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Schedule color={event.status === 'cancelled' ? "disabled" : "action"} />
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                fontWeight="600"
                                                color={event.status === 'cancelled' ? "text.disabled" : "text.primary"}
                                            >
                                                {new Date(event.start_time).toLocaleDateString("en-US", {
                                                    weekday: 'long',
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color={event.status === 'cancelled' ? "text.disabled" : "text.secondary"}
                                            >
                                                {formatTime(event.start_time)} – {formatTime(event.end_time)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Location */}
                                    {event.location && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <LocationOn color={event.status === 'cancelled' ? "disabled" : "action"} />
                                            <Typography
                                                variant="body2"
                                                color={event.status === 'cancelled' ? "text.disabled" : "text.secondary"}
                                            >
                                                {event.location}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Paper>
                    );
                })}
            </Stack>

            {/* Single Menu for all events */}
            <Menu
                anchorEl={anchorEls[selectedEvent?.id]}
                open={Boolean(anchorEls[selectedEvent?.id])}
                onClose={handleMenuCloseWithReset}
            >
                {selectedEvent && (
                    <>
                        <MenuItem onClick={() => {
                            handleViewDetails(selectedEvent);
                            handleMenuCloseWithReset();
                        }}>
                            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
                            <ListItemText>View Details</ListItemText>
                        </MenuItem>

                        {isAdmin && (
                            <>
                                <Divider />
                                {viewMode === 'upcoming' && selectedEvent.status !== 'cancelled' && (
                                    <>
                                        <MenuItem onClick={() => {
                                            handleOpenCancelDialog(selectedEvent);
                                            handleMenuCloseWithReset();
                                        }}>
                                            <ListItemIcon><Block fontSize="small" color="error" /></ListItemIcon>
                                            <ListItemText sx={{ color: 'error.main' }}>Cancel Event</ListItemText>
                                        </MenuItem>
                                        <MenuItem onClick={() => {
                                            handleUpdateStatus(selectedEvent.id, 'draft');
                                            handleMenuCloseWithReset();
                                        }}>
                                            <ListItemIcon><EditNote fontSize="small" /></ListItemIcon>
                                            <ListItemText>Move to Draft</ListItemText>
                                        </MenuItem>
                                    </>
                                )}

                                {viewMode === 'draft' && (
                                    <MenuItem onClick={() => {
                                        handleUpdateStatus(selectedEvent.id, 'published');
                                        handleMenuCloseWithReset();
                                    }}>
                                        <ListItemIcon><Publish fontSize="small" color="primary" /></ListItemIcon>
                                        <ListItemText sx={{ color: 'primary.main' }}>Publish Event</ListItemText>
                                    </MenuItem>
                                )}

                                <MenuItem onClick={() => {
                                    handleDeleteClick(selectedEvent);
                                    handleMenuCloseWithReset();
                                }}>
                                    <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                                    <ListItemText sx={{ color: "error.main" }}>Delete Event</ListItemText>
                                </MenuItem>
                            </>
                        )}
                    </>
                )}
            </Menu>
        </>
    );
};

export default RowLayout;