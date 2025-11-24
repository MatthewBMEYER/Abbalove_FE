import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Paper,
    Divider,
    Menu,
    ListItemIcon,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Badge
} from "@mui/material";
import { Edit, Delete, MoreVert, LocationOn, Schedule, Search, FilterList, Clear } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { useUserStore } from "../../../store/userStore";

const TabComcellEvents = ({ groupId, groupData }) => {
    const navigate = useNavigate();
    const { user } = useUserStore();

    // State management
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [viewMode, setViewMode] = useState("upcoming"); // "upcoming" or "history"

    // Dialog states
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openFilterDialog, setOpenFilterDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [startDateFilter, setStartDateFilter] = useState(null);
    const [endDateFilter, setEndDateFilter] = useState(null);

    // Menu states for each event
    const [anchorEls, setAnchorEls] = useState({});

    // Authorization helper function
    const canModifyEvents = () => {
        if (!user || !user.id) return false;

        // Check if user is master (profile role)
        if (user.roleName === 'master' || user.roleName === 'admin') return true;

        // Check if user is group leader or co-leader
        if (groupData) {
            return user.id === groupData.leader_id || user.id === groupData.co_leader_id;
        }

        return false;
    };

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
        { value: 'comcell', label: 'Cell Meeting' },
        { value: 'prayer', label: 'Prayer Meeting' },
        { value: 'outreach', label: 'Outreach' },
        { value: 'social', label: 'Social Event' },
        { value: 'training', label: 'Training' },
        { value: 'other', label: 'Other' }
    ];

    // Format time for display
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Fetch events
    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const eventsRes = await api.get(`/events/getComcellEventsByGroupId/${groupId}`);

            if (eventsRes.data.success) {
                const allEvents = eventsRes.data.data || [];
                setEvents(allEvents);
            } else {
                setError('Failed to load events');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort events
    const getFilteredEvents = () => {
        const now = new Date();

        let filtered = events.filter(event => {
            const eventDate = new Date(event.start_time);
            const matchesViewMode = viewMode === "upcoming"
                ? eventDate >= now
                : eventDate < now;

            const matchesSearch = !searchTerm ||
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesMonth = !filterMonth || eventDate.getMonth() + 1 === parseInt(filterMonth);
            const matchesYear = !filterYear || eventDate.getFullYear() === parseInt(filterYear);

            const matchesStartDate = !startDateFilter || eventDate >= new Date(startDateFilter);
            const matchesEndDate = !endDateFilter || eventDate <= new Date(endDateFilter);

            return matchesViewMode && matchesSearch && matchesMonth && matchesYear && matchesStartDate && matchesEndDate;
        });

        // Sort by date (ascending for upcoming, descending for history)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.start_time);
            const dateB = new Date(b.start_time);
            return viewMode === "upcoming" ? dateA - dateB : dateB - dateA;
        });
    };

    // Group events by month-year
    const getGroupedEvents = () => {
        const filteredEvents = getFilteredEvents();
        const grouped = {};

        filteredEvents.forEach(event => {
            const eventDate = new Date(event.start_time);
            const monthYear = eventDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });

            if (!grouped[monthYear]) {
                grouped[monthYear] = [];
            }
            grouped[monthYear].push(event);
        });

        return grouped;
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm || filterMonth || filterYear || startDateFilter || endDateFilter;
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setFilterMonth("");
        setFilterYear("");
        setStartDateFilter(null);
        setEndDateFilter(null);
    };

    // Handle menu operations
    const handleMenuOpen = (eventId, event) => {
        setAnchorEls(prev => ({
            ...prev,
            [eventId]: event.currentTarget
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
        if (!canModifyEvents()) {
            setError('You do not have permission to delete events');
            handleMenuClose(event.id);
            return;
        }

        setEventToDelete(event);
        setOpenDeleteDialog(true);
        handleMenuClose(event.id);
    };

    // Delete event
    const handleConfirmDelete = async () => {
        // Double check authorization
        if (!canModifyEvents()) {
            setError('You do not have permission to delete events');
            setOpenDeleteDialog(false);
            setEventToDelete(null);
            return;
        }

        try {
            const res = await api.delete(`/events/deleteEvent/${eventToDelete.id}`);

            if (res.data.success) {
                setSuccessMessage('Event deleted successfully');
                await fetchEvents(); // Refresh data
            } else {
                setError('Failed to delete event');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error deleting event:', err);
        } finally {
            setOpenDeleteDialog(false);
            setEventToDelete(null);
        }
    };

    // Navigate to create event page
    const handleCreateEvent = () => {
        navigate(`/comcell/${groupId}/events/create`);
    };

    // Clear messages after some time
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Load data when groupId changes
    useEffect(() => {
        if (groupId) {
            fetchEvents();
        }
    }, [groupId]);

    const groupedEvents = getGroupedEvents();
    const hasEditPermission = canModifyEvents();
    const activeFilterCount = [searchTerm, filterMonth, filterYear, startDateFilter, endDateFilter].filter(Boolean).length;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                            variant={viewMode === "history" ? "contained" : "outlined"}
                            onClick={() => setViewMode("history")}
                        >
                            Past Events
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
                        <Tooltip title={!hasEditPermission ? "Only group leaders, co-leaders, and masters can add events" : ""}>
                            <span>
                                <Button
                                    variant="contained"
                                    onClick={handleCreateEvent}
                                    disabled={!hasEditPermission}
                                >
                                    Create Event
                                </Button>
                            </span>
                        </Tooltip>
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
                        Filters active ({activeFilterCount}) - Showing {Object.values(groupedEvents).flat().length} events
                    </Alert>
                )}

                {/* Events List */}
                <Paper sx={{ width: '100%', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : Object.keys(groupedEvents).length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {hasActiveFilters()
                                    ? "No events match your filters"
                                    : `No ${viewMode === "upcoming" ? "upcoming" : "past"} events found`
                                }
                            </Typography>
                            {hasEditPermission && !hasActiveFilters() && (
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
                                <Box key={monthYear}>
                                    {/* Month Header */}
                                    <ListItem sx={{
                                        backgroundColor: 'background.main',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        py: 1
                                    }}>
                                        <Typography
                                            variant="h6"
                                            color="primary.main"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {monthYear}
                                        </Typography>
                                    </ListItem>

                                    {/* Events for this month */}
                                    {monthEvents.map((event, index) => (
                                        <Box key={event.id}>
                                            <ListItem
                                                alignItems="center"
                                                sx={{
                                                    py: 2,
                                                    px: 2,
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        borderRadius: 1
                                                    }
                                                }}
                                            >
                                                {/* Date Only - Left Side */}
                                                <Box sx={{ minWidth: 52, textAlign: 'center', mt: 0.5, }}>
                                                    <Typography variant="h6" color="text.primary" fontWeight="600">
                                                        {new Date(event.start_time).getDate()}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                                                    </Typography>
                                                </Box>

                                                {/* Event Content - Middle */}
                                                <ListItemText
                                                    sx={{ ml: 2, mr: 2 }}
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5 }}>
                                                            {event.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Schedule fontSize="small" color="action" sx={{ fontSize: 16 }} />
                                                                <Typography variant="body2" color="text.primary">
                                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                                </Typography>
                                                            </Box>
                                                            {event.location && event.location !== "TBD" && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <LocationOn fontSize="small" color="action" sx={{ fontSize: 16 }} />
                                                                    <Typography variant="body2" color="text.primary">
                                                                        {event.location}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    }
                                                />

                                                {/* Additional Info & Actions - Right Side */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, minWidth: 120, mr: 3 }}>
                                                    {/* Event Type */}
                                                    <Typography variant="body2" color="text.main" textAlign="right">
                                                        {eventTypeOptions.find(t => t.value === event.type)?.label || event.type}
                                                    </Typography>

                                                    {/* Created Date */}
                                                    <Typography variant="caption" color="text.secondary" textAlign="right">
                                                        Created {new Date(event.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>

                                                {/* Menu Button */}
                                                {hasEditPermission && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(event.id, e)}
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        <MoreVert fontSize="small" />
                                                    </IconButton>
                                                )}

                                                {/* Menu */}
                                                <Menu
                                                    anchorEl={anchorEls[event.id]}
                                                    open={Boolean(anchorEls[event.id])}
                                                    onClose={() => handleMenuClose(event.id)}
                                                >
                                                    <MenuItem onClick={() => handleDeleteClick(event)}>
                                                        <ListItemIcon>
                                                            <Delete fontSize="small" color="error" />
                                                        </ListItemIcon>
                                                        <ListItemText>Delete Event</ListItemText>
                                                    </MenuItem>
                                                </Menu>
                                            </ListItem>
                                            {index < monthEvents.length - 1 && <Divider variant="inset" component="li" />}
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </List>
                    )}
                </Paper>

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
                            <FormControl fullWidth>
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

                            <FormControl fullWidth>
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

                            <DateTimePicker
                                label="Start Date From"
                                value={startDateFilter}
                                onChange={setStartDateFilter}
                                ampm={false}
                                format="dd/MM/yyyy HH:mm"
                            />

                            <DateTimePicker
                                label="Start Date To"
                                value={endDateFilter}
                                onChange={setEndDateFilter}
                                ampm={false}
                                format="dd/MM/yyyy HH:mm"
                            />

                            {hasActiveFilters() && (
                                <Alert severity="info">
                                    {activeFilterCount} filter(s) active - Showing {Object.values(groupedEvents).flat().length} events
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
                            Are you sure you want to delete "{eventToDelete?.name}"? This will also remove all attendance records for this event.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This action cannot be undone.
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
        </LocalizationProvider>
    );
};

export default TabComcellEvents;