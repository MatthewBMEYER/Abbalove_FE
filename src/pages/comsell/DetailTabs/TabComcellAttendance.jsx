import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    FormControlLabel,
    Menu,
    ListItemIcon,
    ListItemText,
    Tooltip
} from "@mui/material";
import { Add, Delete, Save, MoreVert, Lock } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import api from "../../../api";
import { useUserStore } from "../../../store/userStore";

const TabComcellAttendance = ({ groupId, groupData }) => {
    // Get user data from store
    const { user } = useUserStore();

    // State management
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [events, setEvents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Dialog states
    const [openEventDialog, setOpenEventDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [eventName, setEventName] = useState("");
    const [startTime, setStartTime] = useState(() => {
        const defaultStart = new Date();
        defaultStart.setHours(18, 0, 0, 0); // 6 PM
        return defaultStart;
    });
    const [endTime, setEndTime] = useState(() => {
        const defaultEnd = new Date();
        defaultEnd.setHours(20, 0, 0, 0); // 8 PM
        return defaultEnd;
    });
    const [location, setLocation] = useState("");

    // Menu states for each event
    const [anchorEls, setAnchorEls] = useState({});

    // Authorization helper function
    const canModifyAttendance = () => {
        if (!user || !user.id) return false;

        // Check if user is master (profile role)
        if (user.roleName === 'master' || user.roleName === 'admin') return true;

        // Check if user is group leader or co-leader
        if (groupData) {
            return user.id === groupData.leader_id || user.id === groupData.co_leader_id;
        }

        return false;
    };

    // Get user permission level for display
    const getUserPermissionLevel = () => {
        if (!user || !user.id) return 'none';

        if (user.roleName === 'master') return 'master';
        if (groupData) {
            if (user.id === groupData.leaderId) return 'leader';
            if (user.id === groupData.coLeaderId) return 'co-leader';
        }

        return 'none';
    };

    // Generate year and month options
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

    // Filter events by selected month/year - FIXED FILTERING
    const getFilteredEvents = () => {
        return events.filter(event => {
            const eventDate = new Date(event.start_time);
            return eventDate.getMonth() + 1 === selectedMonth &&
                eventDate.getFullYear() === selectedYear;
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)); // Sort by date ascending
    };

    // Fetch events and attendance data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch events for this group
            const eventsRes = await api.get(`/events/getAllEventByGroupId/${groupId}`);

            if (eventsRes.data.success) {
                const allEvents = eventsRes.data.data || [];
                setEvents(allEvents);

                // Get events for selected month/year
                const filteredEvents = allEvents.filter(event => {
                    const eventDate = new Date(event.start_time);
                    return eventDate.getMonth() + 1 === selectedMonth &&
                        eventDate.getFullYear() === selectedYear;
                });

                if (filteredEvents.length > 0) {
                    // Fetch attendance for these events
                    const eventIds = filteredEvents.map(event => event.id);
                    const attendanceRes = await api.post('/events/getAttendance', {
                        eventIds: eventIds
                    });

                    if (attendanceRes.data.success) {
                        setAttendanceData(attendanceRes.data.data || {});
                    }
                } else {
                    setAttendanceData({});
                }
            } else {
                setError('Failed to load events');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Create new event
    const handleAddEvent = async () => {
        // Check authorization
        if (!canModifyAttendance()) {
            setError('You do not have permission to create events');
            return;
        }

        // Clear previous errors
        setError(null);

        if (!eventName.trim()) {
            setError('Please enter an event name');
            return;
        }

        // Validate that start time is in selected month/year
        const eventDate = new Date(startTime);
        if (eventDate.getMonth() + 1 !== selectedMonth || eventDate.getFullYear() !== selectedYear) {
            setError('Event date must be in the selected month and year');
            return;
        }

        // Validate end time is after start time
        if (new Date(endTime) <= new Date(startTime)) {
            setError('End time must be after start time');
            return;
        }

        try {
            const res = await api.post('/events/createEvent', {
                name: eventName.trim(),
                type: "comcell",
                groupId: groupId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                location: location.trim() || "TBD"
            });

            if (res.data.success) {
                setSuccessMessage('Event created successfully');
                await fetchData(); // Refresh data
                handleCloseEventDialog();
            } else {
                setError(res.data.message || 'Failed to create event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create event');
        }
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

    const handleDeleteClick = (event) => {
        // Check authorization
        if (!canModifyAttendance()) {
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
        if (!canModifyAttendance()) {
            setError('You do not have permission to delete events');
            setOpenDeleteDialog(false);
            setEventToDelete(null);
            return;
        }

        try {
            const res = await api.delete(`/events/deleteEvent/${eventToDelete.id}`);

            if (res.data.success) {
                setSuccessMessage('Event deleted successfully');
                await fetchData(); // Refresh data
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

    // Handle attendance status change - UPDATED FOR CHECKBOX
    const handleAttendanceChange = (attendanceId, isChecked) => {
        // Check authorization
        if (!canModifyAttendance()) {
            setError('You do not have permission to modify attendance');
            return;
        }

        setAttendanceData(prev => {
            const updated = { ...prev };

            // Find the event that contains this attendance record
            Object.keys(updated).forEach(eventId => {
                const attendanceList = updated[eventId];
                const attendanceIndex = attendanceList.findIndex(
                    attendance => attendance.attendance_id === attendanceId
                );

                if (attendanceIndex !== -1) {
                    updated[eventId][attendanceIndex] = {
                        ...updated[eventId][attendanceIndex],
                        status: isChecked ? 'present' : 'absent'
                    };
                }
            });

            return updated;
        });
    };

    // Save all attendance changes
    const handleSaveAttendance = async () => {
        // Check authorization
        if (!canModifyAttendance()) {
            setError('You do not have permission to save attendance');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Collect all attendance updates
            const updates = [];

            Object.values(attendanceData).forEach(eventAttendance => {
                eventAttendance.forEach(attendance => {
                    updates.push({
                        attendance_id: attendance.attendance_id,
                        status: attendance.status,
                        notes: attendance.notes || ""
                    });
                });
            });

            if (updates.length === 0) {
                setError('No attendance data to save');
                return;
            }

            const res = await api.post('/events/updateAttendance', {
                updates: updates
            });

            if (res.data.success) {
                setSuccessMessage('Attendance saved successfully');
            } else {
                setError('Failed to save attendance');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error saving attendance:', err);
        } finally {
            setSaving(false);
        }
    };

    // Dialog helpers
    const handleCloseEventDialog = () => {
        setOpenEventDialog(false);
        setEventName("");
        // Set default times: today at 6 PM for start, 8 PM for end
        const defaultStart = new Date();
        defaultStart.setHours(18, 0, 0, 0);
        const defaultEnd = new Date();
        defaultEnd.setHours(20, 0, 0, 0);
        setStartTime(defaultStart);
        setEndTime(defaultEnd);
        setLocation("");
        setError(null); // Clear any errors when closing dialog
    };

    // Clear messages after some time
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Load data when month/year changes
    useEffect(() => {
        if (groupId) {
            fetchData();
        }
    }, [selectedMonth, selectedYear, groupId]);

    // Get unique users across all events for the table rows
    const getAllUsers = () => {
        const usersMap = new Map();

        Object.values(attendanceData).forEach(eventAttendance => {
            eventAttendance.forEach(attendance => {
                if (!usersMap.has(attendance.user_id)) {
                    usersMap.set(attendance.user_id, {
                        id: attendance.user_id,
                        name: attendance.user_name,
                        email: attendance.user_email
                    });
                }
            });
        });

        return Array.from(usersMap.values());
    };

    // Get attendance status for a specific user and event
    const getAttendanceStatus = (userId, eventId) => {
        const eventAttendance = attendanceData[eventId] || [];
        const userAttendance = eventAttendance.find(attendance => attendance.user_id === userId);
        return userAttendance ? userAttendance.status : 'absent';
    };

    // Get attendance ID for a specific user and event
    const getAttendanceId = (userId, eventId) => {
        const eventAttendance = attendanceData[eventId] || [];
        const userAttendance = eventAttendance.find(attendance => attendance.user_id === userId);
        return userAttendance ? userAttendance.attendance_id : null;
    };

    const filteredEvents = getFilteredEvents();
    const allUsers = getAllUsers();
    const hasEditPermission = canModifyAttendance();
    const permissionLevel = getUserPermissionLevel();

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box py={3}>
                {/* Permission Status Display */}
                {!hasEditPermission && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Lock fontSize="small" />
                            <Typography variant="body2">
                                You are viewing in read-only mode. Only group leaders, co-leaders, and masters can modify attendance data.
                                {permissionLevel !== 'none' && ` Your role: ${permissionLevel}`}
                            </Typography>
                        </Box>
                    </Alert>
                )}

                {/* Controls */}
                <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between" }}>
                    {/* Month/Year Selection */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={selectedMonth}
                                label="Month"
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                {monthOptions.map(month => (
                                    <MenuItem key={month.value} value={month.value}>
                                        {month.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 100 }}>
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={selectedYear}
                                label="Year"
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {yearOptions.map(year => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box>
                        {/* Add Event Button */}
                        <Tooltip title={!hasEditPermission ? "Only group leaders, co-leaders, and masters can add events" : ""}>
                            <span>
                                <Button
                                    variant="outlined"
                                    startIcon={hasEditPermission ? <Add /> : <Lock />}
                                    onClick={() => setOpenEventDialog(true)}
                                    sx={{ mr: 1 }}
                                    disabled={!hasEditPermission}
                                >
                                    Add Event
                                </Button>
                            </span>
                        </Tooltip>

                        {/* Save Button */}
                        <Tooltip title={!hasEditPermission ? "Only group leaders, co-leaders, and masters can save attendance" : ""}>
                            <span>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} /> : (hasEditPermission ? <Save /> : <Lock />)}
                                    onClick={handleSaveAttendance}
                                    disabled={!hasEditPermission || saving || filteredEvents.length === 0}
                                >
                                    {saving ? 'Saving...' : 'Save Attendance'}
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

                {/* Attendance Table - FIXED OVERFLOW */}
                <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
                    <TableContainer sx={{
                        maxHeight: '70vh',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        // Hide scrollbars but keep scrolling functionality
                        '&::-webkit-scrollbar': {
                            display: 'none', // Chrome, Safari, Edge
                        },
                        '-ms-overflow-style': 'none', // Internet Explorer 10+
                        'scrollbar-width': 'none', // Firefox
                    }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            fontWeight: 'bold',
                                            minWidth: 220,
                                            maxWidth: 220,
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: 'background.paper',
                                            zIndex: 100,
                                            borderRight: '1px solid rgba(224, 224, 224, 1)'
                                        }}
                                    >
                                        Team Member
                                    </TableCell>
                                    {filteredEvents.map(event => (
                                        <TableCell
                                            key={event.id}
                                            sx={{
                                                fontWeight: 'bold',
                                                minWidth: 180,
                                                maxWidth: 180,
                                                backgroundColor: 'background.paper'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                                    <Typography variant="body2" noWrap title={event.name}>
                                                        {event.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {new Date(event.start_time).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </Box>
                                                {hasEditPermission && (
                                                    <>
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
                                                            <MenuItem onClick={() => handleDeleteClick(event)}>
                                                                <ListItemIcon>
                                                                    <Delete fontSize="small" color="error" />
                                                                </ListItemIcon>
                                                                <ListItemText>Delete Event</ListItemText>
                                                            </MenuItem>
                                                        </Menu>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={filteredEvents.length + 1} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} align="center">
                                            <Typography color="text.secondary">
                                                No events found for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : allUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={filteredEvents.length + 1} align="center">
                                            <Typography color="text.secondary">
                                                No attendance records found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    allUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell
                                                sx={{
                                                    minWidth: 220,
                                                    maxWidth: 220,
                                                    position: 'sticky',
                                                    left: 0,
                                                    backgroundColor: 'background.paper',
                                                    zIndex: 1,
                                                    borderRight: '1px solid rgba(224, 224, 224, 1)'
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body1" noWrap title={user.name}>
                                                        {user.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            {filteredEvents.map(event => {
                                                const attendanceId = getAttendanceId(user.id, event.id);
                                                const currentStatus = getAttendanceStatus(user.id, event.id);

                                                return (
                                                    <TableCell key={event.id} align="center" sx={{ minWidth: 180, maxWidth: 180 }}>
                                                        {attendanceId ? (
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={currentStatus === 'present'}
                                                                        onChange={(e) => handleAttendanceChange(attendanceId, e.target.checked)}
                                                                        color="primary"
                                                                        disabled={!hasEditPermission}
                                                                    />
                                                                }
                                                                label={currentStatus === 'present' ? 'Present' : 'Absent'}
                                                                slotProps={{
                                                                    typography: {
                                                                        fontSize: '0.75rem',
                                                                        color: !hasEditPermission ? 'text.disabled' : 'text.secondary'
                                                                    }
                                                                }}
                                                                sx={{
                                                                    margin: 0,
                                                                    opacity: !hasEditPermission ? 0.6 : 1
                                                                }}
                                                            />
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary">
                                                                No record
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Add Event Dialog */}
                <Dialog open={openEventDialog} onClose={handleCloseEventDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label="Event Name"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                fullWidth
                                placeholder="e.g., Weekly Meeting, Bible Study"
                                required
                            />

                            <TextField
                                label="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                fullWidth
                                placeholder="e.g., Conference Room A, Living Room"
                            />

                            <DateTimePicker
                                label="Start Date & Time"
                                value={startTime}
                                onChange={(date) => {
                                    setStartTime(date);
                                    // Auto-adjust end time to be 2 hours later if it's not already set properly
                                    if (!endTime || endTime <= date) {
                                        const newEndTime = new Date(date);
                                        newEndTime.setHours(newEndTime.getHours() + 2);
                                        setEndTime(newEndTime);
                                    }
                                }}
                                shouldDisableDate={(date) => {
                                    return date.getMonth() + 1 !== selectedMonth ||
                                        date.getFullYear() !== selectedYear;
                                }}
                                ampm={false}
                                format="dd/MM/yyyy HH:mm"
                            />

                            <DateTimePicker
                                label="End Date & Time"
                                value={endTime}
                                onChange={(date) => {
                                    setEndTime(date);
                                }}
                                minDateTime={startTime}
                                shouldDisableDate={(date) => {
                                    return date.getMonth() + 1 !== selectedMonth ||
                                        date.getFullYear() !== selectedYear;
                                }}
                                ampm={false}
                                format="dd/MM/yyyy HH:mm"
                            />

                            <Typography variant="caption" color="text.secondary">
                                Event must be scheduled in {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEventDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddEvent}
                            variant="contained"
                            disabled={!eventName.trim()}
                            sx={{ minWidth: 100 }}
                        >
                            Add Event
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Custom Delete Confirmation Dialog */}
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

export default TabComcellAttendance;