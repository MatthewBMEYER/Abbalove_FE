import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Skeleton,
    Grid,
    Paper,
    Divider,
    Menu,
    MenuItem,
    ListItemIcon,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    InputAdornment,
    Badge,
    Chip
} from "@mui/material";
import {
    Edit,
    Delete,
    MoreVert,
    LocationOn,
    Schedule,
    Search,
    FilterList,
    Clear,
    Event,
    CalendarToday,
    Archive,
    Visibility
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useUserStore } from "../../store/userStore";

const AllEvents = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const isAdmin = user.roleName === 'master' || user.roleName === 'admin';

    // State management
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // View mode states
    const [viewMode, setViewMode] = useState("upcoming"); // "upcoming" or "archive"
    const [openFilterDialog, setOpenFilterDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [eventTypeFilter, setEventTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Menu states for each event
    const [anchorEls, setAnchorEls] = useState({});

    // Generate year and month options for filters
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
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
        setError(null);
        try {
            let response;
            const params = {};

            // Add filters if not "all"
            if (eventTypeFilter !== "all") params.type = eventTypeFilter;
            if (statusFilter !== "all") params.status = statusFilter;

            if (viewMode === "upcoming") {
                // Fetch upcoming events
                response = isAdmin
                    ? await api.get(`/core/event/getAllEventAdmin`, { params })
                    : await api.get(`/core/event/getAllEventPublic`, { params });
            } else {
                // Fetch archive events
                response = isAdmin
                    ? await api.get(`/core/event/getAllPostEventAdmin`, { params })
                    : await api.get(`/core/event/getAllPostEventPublic`, { params });
            }

            if (response.data.success) {
                // API returns { success, data: { events: [], count } }
                setEvents(response.data.data?.events || []);
            } else {
                setError(response.data.message || 'Failed to load events');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort events (client-side filtering for month/year)
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

        // Apply month filter
        if (filterMonth) {
            filtered = filtered.filter(event => {
                try {
                    const eventDate = new Date(event.start_time);
                    return eventDate.getMonth() + 1 === parseInt(filterMonth);
                } catch (e) {
                    return false;
                }
            });
        }

        // Apply year filter
        if (filterYear) {
            filtered = filtered.filter(event => {
                try {
                    const eventDate = new Date(event.start_time);
                    return eventDate.getFullYear() === parseInt(filterYear);
                } catch (e) {
                    return false;
                }
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
        return searchTerm || filterMonth || filterYear || eventTypeFilter !== "all" || statusFilter !== "all";
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setFilterMonth("");
        setFilterYear("");
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
            setError('You do not have permission to delete events');
            handleMenuClose(event.id);
            return;
        }

        setEventToDelete(event);
        setOpenDeleteDialog(true);
        handleMenuClose(event.id);
    };

    // Handle edit event
    const handleEditClick = (event) => {
        if (!isAdmin) {
            setError('You do not have permission to edit events');
            handleMenuClose(event.id);
            return;
        }

        navigate(`/events/edit/${event.id}`);
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
            const response = await api.delete(`/core/event/${eventToDelete.id}`);

            if (response.data.success) {
                setSuccessMessage("Event deleted successfully");
                fetchEvents(); // Refresh list
            } else {
                setError("Failed to delete event");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "An error occurred");
            console.error("Error deleting event:", err);
        } finally {
            setOpenDeleteDialog(false);
            setEventToDelete(null);
        }
    };

    // Handle create event
    const handleCreateEvent = () => {
        navigate("/events/create");
    };

    // Clear messages
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Fetch events when filters or view changes
    useEffect(() => {
        fetchEvents();
    }, [viewMode, statusFilter, eventTypeFilter, isAdmin]);

    const groupedEvents = getGroupedEvents();
    const activeFilterCount = [searchTerm, filterMonth, filterYear, eventTypeFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

    return (
        <Box py={3}>
            {/* Controls */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between" }}>
                {/* View Mode Toggle */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant={viewMode === "upcoming" ? "contained" : "outlined"}
                        onClick={() => setViewMode("upcoming")}
                    >
                        Upcoming Events
                    </Button>
                    <Button
                        variant={viewMode === "archive" ? "contained" : "outlined"}
                        onClick={() => setViewMode("archive")}
                    >
                        Event Archive
                    </Button>
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

            {/* Success Message */}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters() && (
                <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={clearFilters}>
                            Clear All
                        </Button>
                    }
                >
                    Filters active ({activeFilterCount}) - Showing {getFilteredEvents().length} events
                </Alert>
            )}

            {/* Events List */}
            <Box sx={{ width: '100%' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : Object.keys(groupedEvents).length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            {hasActiveFilters()
                                ? "No events match your filters"
                                : `No ${viewMode === "upcoming" ? "upcoming" : "archive"} events found`
                            }
                        </Typography>
                        {isAdmin && !hasActiveFilters() && (
                            <Button
                                variant="outlined"
                                onClick={handleCreateEvent}
                                sx={{ mt: 1 }}
                            >
                                Create Your First Event
                            </Button>
                        )}
                        {hasActiveFilters() && (
                            <Button
                                variant="outlined"
                                startIcon={<Clear />}
                                onClick={clearFilters}
                                sx={{ mt: 1 }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </Box>
                ) : (
                    <List sx={{ width: '100%' }}>
                        {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                            <Box key={monthYear} sx={{ mb: 3, px: 2 }}>
                                {/* Month Header */}
                                <ListItem
                                    sx={{
                                        backgroundColor: 'background.main',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        py: 1
                                    }}
                                >
                                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                        {monthYear}
                                    </Typography>
                                </ListItem>

                                {/* Event Cards Grid */}
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    {monthEvents.map((event) => (
                                        <Grid key={event.id} item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>

                                            <Box
                                                sx={{
                                                    backgroundColor: 'background.paper',
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    boxShadow: 1,
                                                    cursor: 'pointer',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    '&:hover': { boxShadow: 3 }
                                                }}
                                            >
                                                {/* Image with perfect 16:9 ratio */}
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        aspectRatio: '16/9',
                                                        backgroundColor: 'background.default',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <Skeleton variant="rectangular" width="100%" height="100%" />
                                                </Box>

                                                {/* Card Content */}
                                                <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

                                                    {/* Name */}
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight="600"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {event.name}
                                                    </Typography>

                                                    {/* Date & Time */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Schedule sx={{ fontSize: 18 }} color="action" />
                                                        <Typography variant="body2">
                                                            {new Date(event.start_time).toLocaleDateString('en-US', {
                                                                day: 'numeric',
                                                                month: 'short'
                                                            })}{' '}
                                                            • {formatTime(event.start_time)}–{formatTime(event.end_time)}
                                                        </Typography>
                                                    </Box>

                                                    {/* Location */}
                                                    {event.location && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                            <LocationOn sx={{ fontSize: 18 }} color="action" />
                                                            <Typography variant="body2">{event.location}</Typography>
                                                        </Box>
                                                    )}

                                                    {/* Type & Status */}
                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {eventTypeOptions.find(t => t.value === event.type)?.label || event.type}
                                                        </Typography>

                                                        {isAdmin && (
                                                            <Chip
                                                                size="small"
                                                                label={statusOptions.find(s => s.value === event.status)?.label}
                                                                color={statusOptions.find(s => s.value === event.status)?.color}
                                                                sx={{ height: 22, fontSize: '0.7rem', borderRadius: 1 }}
                                                            />
                                                        )}
                                                    </Box>

                                                    {/* Menu */}
                                                    <Box sx={{ textAlign: 'right', mt: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleMenuOpen(event.id, e)}
                                                        >
                                                            <MoreVert fontSize="small" />
                                                        </IconButton>

                                                        <Menu
                                                            anchorEl={anchorEls[event.id]}
                                                            open={Boolean(anchorEls[event.id])}
                                                            onClose={() => handleMenuClose(event.id)}
                                                        >
                                                            <MenuItem onClick={() => handleViewDetails(event)}>
                                                                <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
                                                                <ListItemText>View Details</ListItemText>
                                                            </MenuItem>

                                                            {isAdmin && (
                                                                <>
                                                                    <MenuItem onClick={() => handleEditClick(event)}>
                                                                        <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                                                                        <ListItemText>Edit Event</ListItemText>
                                                                    </MenuItem>

                                                                    <Divider />

                                                                    <MenuItem onClick={() => handleDeleteClick(event)}>
                                                                        <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                                                                        <ListItemText sx={{ color: 'error.main' }}>Delete Event</ListItemText>
                                                                    </MenuItem>
                                                                </>
                                                            )}
                                                        </Menu>
                                                    </Box>

                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </List>
                )}
            </Box>

            {/* Filter Dialog */}
            <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Filter Events
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
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={filterMonth}
                                label="Month"
                                onChange={(e) => setFilterMonth(e.target.value)}
                            >
                                <MenuItem value="">All Months</MenuItem>
                                {monthOptions.map(month => (
                                    <MenuItem key={month.value} value={month.value}>
                                        {month.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={filterYear}
                                label="Year"
                                onChange={(e) => setFilterYear(e.target.value)}
                            >
                                <MenuItem value="">All Years</MenuItem>
                                {yearOptions.map(year => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Event Type</InputLabel>
                            <Select
                                value={eventTypeFilter}
                                label="Event Type"
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                            >
                                {eventTypeOptions.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {isAdmin && (
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

                        {hasActiveFilters() && (
                            <Alert severity="info">
                                {activeFilterCount} filter(s) active - Showing {getFilteredEvents().length} events
                            </Alert>
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
        </Box>
    );
};

export default AllEvents;