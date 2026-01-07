import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    List,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Badge,
    Tooltip,
    ToggleButtonGroup,
    ToggleButton,
    Divider
} from "@mui/material";
import {
    Search,
    FilterList,
    Clear,
    Upcoming as UpcomingIcon,
    Drafts as DraftIcon,
    History as PastIcon,
    ChevronLeft,
    ChevronRight
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useUserStore } from "../../store/userStore";
import RowLayout from "../../components/RowLayout";
import { useSearchParams } from "react-router-dom";

const AllEvents = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const isAdmin = user.roleName === 'master' || user.roleName === 'admin';
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    // State management
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // View mode states
    const [searchParams, setSearchParams] = useSearchParams();
    const modeFromUrl = searchParams.get('mode') || "upcoming"
    const [viewMode, setViewMode] = useState(modeFromUrl);

    const [openFilterDialog, setOpenFilterDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [eventTypeFilter, setEventTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Menu states for each event
    const [anchorEls, setAnchorEls] = useState({});

    const [statusUpdateData, setStatusUpdateData] = useState({ id: null, status: "", notes: "" });
    const [openStatusDialog, setOpenStatusDialog] = useState(false);

    const handleOpenCancelDialog = (event) => {
        setStatusUpdateData({ id: event.id, status: "cancelled", notes: "" });
        setOpenStatusDialog(true);
        handleMenuClose(event.id);
    };

    const handleModeChange = (newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
            setSearchParams({ mode: newMode }); // This updates the browser URL
        }
    };

    useEffect(() => {
        if (modeFromUrl !== viewMode) {
            setViewMode(modeFromUrl);
        }
    }, [modeFromUrl]);

    const handleUpdateStatus = async (eventId, newStatus) => {
        try {
            const response = await api.put('/core/event/status', {
                id: eventId,
                status: newStatus,
                notes: "" // Draft/Published usually don't need notes
            });

            if (response.data.success) {
                showSnackbar(`Event ${newStatus} successfully`);
                fetchEvents();
            }
        } catch (err) {
            showSnackbar(err.response?.data?.message || "Failed to update status", "error");
        }
    };

    const submitStatusUpdate = async () => {
        try {
            const response = await api.put('/core/event/status', {
                id: statusUpdateData.id,
                status: statusUpdateData.status,
                notes: statusUpdateData.notes
            });

            if (response.data.success) {
                showSnackbar(`Event ${statusUpdateData.status} successfully`);
                fetchEvents();
                setOpenStatusDialog(false);
            }
        } catch (err) {
            showSnackbar(err.response?.data?.message || "Failed to update status", "error");
        }
    };

    // Generate year and month options for filters
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
    const monthOptions = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    // Event type options
    const eventTypeOptions = [
        { value: "all", label: "All Types" },
        { value: "service", label: "Sunday Service" },
        { value: "comcell", label: "Cell Group" },
        { value: "prayer", label: "Prayer Meeting" },
        { value: "training", label: "Training" },
        { value: "outreach", label: "Outreach" },
        { value: "social", label: "Social Event" },
        { value: "fellowship", label: "Fellowship" },
        { value: "study", label: "Bible Study" },
        { value: "practice", label: "Practice" },
        { value: "other", label: "Other" }
    ];

    // Status options
    const statusOptions = [
        { value: "all", label: "All Status" },
        { value: "published", label: "Published", color: "success" },
        { value: "draft", label: "Draft", color: "warning" },
        { value: "cancelled", label: "Cancelled", color: "error" }
    ];

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Format time for display
    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return "";
        }
    };

    // Fetch events based on current view
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = {
                year: filterYear, // Year is now always sent
                type: eventTypeFilter !== "all" ? eventTypeFilter : undefined,
                status: statusFilter !== "all" ? statusFilter : undefined
            };

            const endpoint = `/core/event/${viewMode === 'upcoming' ? 'upcoming' : viewMode === 'draft' ? 'drafts' : 'past'}`;
            const response = await api.get(endpoint, { params });

            if (response.data.success) {
                setEvents(response.data.data?.events || []);
            }
        } catch (err) {
            showSnackbar("Failed to load events", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [viewMode, statusFilter, eventTypeFilter, filterMonth, filterYear]);

    // Filter events (client-side filtering for search only)
    const getFilteredEvents = () => {
        let filtered = events;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(event => {
                return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
            });
        }

        return filtered;
    };

    // Group events by month-year for display
    const getGroupedEvents = () => {
        const filteredEvents = getFilteredEvents();
        const grouped = {};

        filteredEvents.forEach(event => {
            try {
                const eventDate = new Date(event.start_time);
                const monthYear = eventDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });

                if (!grouped[monthYear]) {
                    grouped[monthYear] = [];
                }
                grouped[monthYear].push(event);
            } catch (e) {
                // Skip invalid dates
            }
        });

        return grouped;
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm || filterYear || eventTypeFilter !== "all" || statusFilter !== "all";
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setFilterMonth("");
        setFilterYear(currentYear);
        setEventTypeFilter("all");
        setStatusFilter("all");
    };

    // Handle menu operations
    const handleMenuOpen = (eventId, anchorElement) => {
        setAnchorEls(prev => ({
            ...prev,
            [eventId]: anchorElement.currentTarget
        }));
    };

    const handleMenuClose = (eventId) => {
        setAnchorEls(prev => ({
            ...prev,
            [eventId]: null
        }));
    };

    // Handle delete event
    const handleDeleteClick = (event) => {
        if (!isAdmin) {
            showSnackbar('You do not have permission to delete events', "error");
            handleMenuClose(event.id);
            return;
        }

        setEventToDelete(event);
        setOpenDeleteDialog(true);
        handleMenuClose(event.id);
    };

    // Handle view details
    const handleViewDetails = (event) => {
        navigate(`/events/${event.id}`);
        handleMenuClose(event.id);
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            const response = await api.delete(`/core/event/delete/${eventToDelete.id}`);
            if (response.data.success) {
                showSnackbar("Event deleted successfully", "success");
                fetchEvents();
            } else {
                showSnackbar(response.data.message || "Failed to delete event", "error");
            }
        } catch (err) {
            showSnackbar(err.response?.data?.message || "An error occurred", "error");
        } finally {
            setOpenDeleteDialog(false);
            setEventToDelete(null);
        }
    };

    // Handle create event
    const handleCreateEvent = () => {
        navigate("/events/create");
    };

    const groupedEvents = getGroupedEvents();
    const activeFilterCount = [searchTerm, filterYear, eventTypeFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

    // Get view mode display name
    const getViewModeDisplayName = () => {
        switch (viewMode) {
            case "upcoming": return "Upcoming Events";
            case "draft": return "Draft Events";
            case "past": return "Past Events";
            default: return "Events";
        }
    };

    // Check if draft view should be disabled for non-admin
    const isDraftDisabled = () => {
        return viewMode === "draft" && !isAdmin;
    };

    return (
        <Box p={3}>
            {/* Controls */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between" }}>
                {/* View Mode Toggle */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => handleModeChange(newMode)}
                        size="small"
                    >
                        <ToggleButton value="upcoming" sx={{ px: 2, textTransform: 'none' }}>
                            <UpcomingIcon sx={{ mr: 1, fontSize: 18 }} />
                            Upcoming
                        </ToggleButton>
                        {isAdmin && (
                            <ToggleButton value="draft" sx={{ px: 2, textTransform: 'none' }}>
                                <DraftIcon sx={{ mr: 1, fontSize: 18 }} />
                                Drafts
                            </ToggleButton>
                        )}
                        <ToggleButton value="past" sx={{ px: 2, textTransform: 'none' }}>
                            <PastIcon sx={{ mr: 1, fontSize: 18 }} />
                            Past
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Search and Filter */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                                        <Clear fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{ width: 200 }}
                    />

                    <Tooltip title="Filter events">
                        <Badge badgeContent={activeFilterCount} color="primary" overlap="circular">
                            <Button
                                variant={hasActiveFilters() ? "contained" : "outlined"}
                                startIcon={<FilterList />}
                                onClick={() => setOpenFilterDialog(true)}
                            >
                                Filters
                            </Button>
                        </Badge>
                    </Tooltip>

                    {/* Add Event Button */}
                    {isAdmin && (
                        <Tooltip title="Create new event">
                            <Button
                                variant="contained"
                                onClick={handleCreateEvent}
                            >
                                Create Event
                            </Button>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Warning for non-admin trying to access drafts */}
            {isDraftDisabled() && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    You do not have permission to view draft events.
                </Alert>
            )}

            <Divider sx={{ mb: 2 }} />


            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0, gap: 2 }}>
                <IconButton
                    onClick={() => setFilterYear(prev => Number(prev) - 1)}
                    disabled={viewMode === 'upcoming' && Number(filterYear) <= currentYear}
                >
                    <ChevronLeft fontSize="large" />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 2, minWidth: 80, textAlign: 'center' }}>
                    {filterYear || currentYear}
                </Typography>
                <IconButton
                    onClick={() => setFilterYear(prev => Number(prev) + 1)}
                    // Disable "Next" if in Past view and year is current
                    disabled={viewMode === 'past' && Number(filterYear) >= currentYear}
                >
                    <ChevronRight fontSize="large" />
                </IconButton>
            </Box>

            {/* Events List */}
            <Box sx={{ width: '100%' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
                ) : (isDraftDisabled() || Object.keys(groupedEvents).length === 0) ? (
                    <Typography align="center" sx={{ p: 5 }}>
                        {isDraftDisabled()
                            ? "Draft events are only visible to administrators."
                            : viewMode === "past" && !filterYear
                                ? "Please select a year to load past events."
                                : "No events found."}
                    </Typography>
                ) : (
                    <List sx={{ width: '100%' }}>
                        {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                            <Box key={monthYear} sx={{ mb: 4 }}>
                                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {monthYear}
                                </Typography>
                                <RowLayout
                                    events={monthEvents}
                                    isAdmin={isAdmin}
                                    viewMode={viewMode}
                                    formatTime={formatTime}
                                    eventTypeOptions={eventTypeOptions}
                                    statusOptions={statusOptions}
                                    handleMenuOpen={handleMenuOpen}
                                    anchorEls={anchorEls}
                                    handleMenuClose={handleMenuClose}
                                    handleViewDetails={handleViewDetails}
                                    handleDeleteClick={handleDeleteClick}
                                    handleOpenCancelDialog={handleOpenCancelDialog}
                                    handleUpdateStatus={handleUpdateStatus}
                                />
                            </Box>
                        ))}
                    </List>
                )}
            </Box>

            {/* Filter Dialog */}
            <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Filter {getViewModeDisplayName()}
                    {hasActiveFilters() && (
                        <Button
                            color="primary"
                            size="small"
                            onClick={clearFilters}
                            sx={{ float: 'right' }}
                        >
                            Clear All
                        </Button>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Event Type</InputLabel>
                            <Select value={eventTypeFilter} label="Event Type" onChange={(e) => setEventTypeFilter(e.target.value)}>
                                {eventTypeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                            </Select>
                        </FormControl>

                        {isAdmin && viewMode !== "draft" && (
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    {statusOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenFilterDialog(false)}>
                        Close
                    </Button>
                    <Button onClick={clearFilters} color="inherit">
                        Clear Filters
                    </Button>
                    <Button
                        onClick={() => {
                            setOpenFilterDialog(false);
                            fetchEvents();
                        }}
                        variant="contained"
                    >
                        Apply Filters
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{eventToDelete?.name}"?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action cannot be undone and will delete all associated data.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        sx={{ minWidth: 100 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {statusUpdateData.status === 'cancelled' ? 'Cancel Event' : 'Update Status'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {statusUpdateData.status === 'cancelled'
                            ? "Are you sure you want to cancel this event? This will notify registered users."
                            : `Change event status to ${statusUpdateData.status}?`}
                    </Typography>
                    {statusUpdateData.status === 'cancelled' && (
                        <TextField
                            fullWidth
                            label="Cancellation Reason (Optional)"
                            multiline
                            rows={3}
                            value={statusUpdateData.notes}
                            onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="e.g., Venue unavailable, weather conditions..."
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenStatusDialog(false)}>Go Back</Button>
                    <Button
                        onClick={submitStatusUpdate}
                        variant="contained"
                        color={statusUpdateData.status === 'cancelled' ? "error" : "primary"}
                    >
                        Confirm {statusUpdateData.status}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%', boxShadow: 3 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AllEvents;