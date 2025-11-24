import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Divider,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Checkbox,
    Avatar,
    AvatarGroup
} from "@mui/material";
import {
    Add,
    Search,
    Clear,
    Group,
    Person,
    ArrowBack
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";
import { useUserStore } from "../../../store/userStore";

const CreateEvent = () => {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { user } = useUserStore();

    // Event form states
    const [eventName, setEventName] = useState("");
    const [eventType, setEventType] = useState("comcell");
    const [startTime, setStartTime] = useState(() => {
        const defaultStart = new Date();
        defaultStart.setHours(18, 0, 0, 0);
        return defaultStart;
    });
    const [endTime, setEndTime] = useState(() => {
        const defaultEnd = new Date();
        defaultEnd.setHours(20, 0, 0, 0);
        return defaultEnd;
    });
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");

    // Group selection states
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Event type options
    const eventTypeOptions = [
        { value: 'comcell', label: 'Cell Meeting' },
        { value: 'prayer', label: 'Prayer Meeting' },
        { value: 'outreach', label: 'Outreach' },
        { value: 'social', label: 'Social Event' },
        { value: 'training', label: 'Training' },
        { value: 'other', label: 'Other' }
    ];

    // Fetch available groups
    const fetchAvailableGroups = async () => {
        setLoadingGroups(true);
        try {
            const response = await api.get('/comcell/getAll');
            if (response.data.success) {
                // Filter out current group and already selected groups
                const filteredGroups = response.data.data.filter(group =>
                    group.id !== groupId &&
                    !selectedGroups.find(selected => selected.id === group.id)
                );
                setAvailableGroups(filteredGroups);
            }
        } catch (err) {
            console.error('Error fetching groups:', err);
            setError('Failed to load groups');
        } finally {
            setLoadingGroups(false);
        }
    };

    // Filter groups based on search term
    const getFilteredGroups = () => {
        if (!searchTerm) return availableGroups;

        const searchLower = searchTerm.toLowerCase();
        return availableGroups.filter(group =>
            group.name.toLowerCase().includes(searchLower) ||
            group.leader_name?.toLowerCase().includes(searchLower) ||
            group.co_leader_name?.toLowerCase().includes(searchLower) ||
            group.category?.toLowerCase().includes(searchLower)
        );
    };

    // Handle group selection
    const handleGroupSelect = (group) => {
        setSelectedGroups(prev => [...prev, group]);
        setAvailableGroups(prev => prev.filter(g => g.id !== group.id));
        setSearchTerm("");
    };

    // Handle group removal
    const handleGroupRemove = (groupId) => {
        const groupToRemove = selectedGroups.find(g => g.id === groupId);
        if (groupToRemove) {
            setSelectedGroups(prev => prev.filter(g => g.id !== groupId));
            setAvailableGroups(prev => [...prev, groupToRemove]);
        }
    };

    // Open group selection dialog
    const handleOpenGroupDialog = () => {
        fetchAvailableGroups();
        setOpenGroupDialog(true);
    };

    // Close group selection dialog
    const handleCloseGroupDialog = () => {
        setOpenGroupDialog(false);
        setSearchTerm("");
    };

    // Create event
    const handleCreateEvent = async () => {
        setError(null);
        setSuccessMessage("");

        // Validation
        if (!eventName.trim()) {
            setError('Please enter an event name');
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            setError('End time must be after start time');
            return;
        }
        setLoading(true);

        try {
            const groupIds = [groupId, ...selectedGroups.map(group => group.id)];

            const response = await api.post('/events/createComcellEvent', {
                name: eventName.trim(),
                type: eventType,
                groupIds: groupIds,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                location: location.trim() || "TBD",
                description: description.trim(),
                createdBy: user?.id
            });

            if (response.data.success) {
                setSuccessMessage('Event created successfully!');
                setTimeout(() => {
                    navigate(-1);
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to create event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    // Clear messages after some time
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const filteredGroups = getFilteredGroups();

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        Create Comcell Event
                    </Typography>
                </Box>

                <Paper sx={{ p: 3 }}>
                    {/* Event Details */}
                    <Typography variant="h6" gutterBottom>
                        Event Details
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Event Name"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            fullWidth
                            placeholder="e.g., Joint Cell Meeting, Combined Prayer Session"
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Event Type</InputLabel>
                            <Select
                                value={eventType}
                                label="Event Type"
                                onChange={(e) => setEventType(e.target.value)}
                            >
                                {eventTypeOptions.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            fullWidth
                            placeholder="e.g., Main Auditorium, Community Hall"
                        />

                        <TextField
                            label="Description (Optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Describe the event purpose, agenda, or special instructions..."
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DateTimePicker
                                label="Start Date & Time"
                                value={startTime}
                                onChange={(date) => {
                                    setStartTime(date);
                                    if (!endTime || endTime <= date) {
                                        const newEndTime = new Date(date);
                                        newEndTime.setHours(newEndTime.getHours() + 2);
                                        setEndTime(newEndTime);
                                    }
                                }}
                                ampm={false}
                                format="dd/MM/yyyy HH:mm"
                                sx={{ flex: 1 }}
                            />

                            <DateTimePicker
                                label="End Date & Time"
                                value={endTime}
                                onChange={setEndTime}
                                minDateTime={startTime}
                                ampm={false}
                                format="dd/MM/yyyy HH:mm"
                                sx={{ flex: 1 }}
                            />
                        </Box>

                        <Divider />

                        {/* Group Selection */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Invited Groups
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    onClick={handleOpenGroupDialog}
                                >
                                    Add Groups
                                </Button>
                            </Box>

                            {/* Selected Groups Display */}
                            {selectedGroups.length === 0 ? (
                                <Alert severity="info">
                                    No groups selected yet. Click "Add Groups" to invite other groups to this event.
                                </Alert>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {selectedGroups.length} group(s) invited to this event:
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedGroups.map((group) => (
                                            <Chip
                                                key={group.id}
                                                label={group.name}
                                                onDelete={() => handleGroupRemove(group.id)}
                                                color="primary"
                                                variant="outlined"
                                                avatar={
                                                    <Avatar sx={{ width: 24, height: 24 }}>
                                                        <Group fontSize="small" />
                                                    </Avatar>
                                                }
                                            />
                                        ))}
                                    </Box>

                                    {/* Group Details */}
                                    <Box sx={{ mt: 2 }}>
                                        {selectedGroups.map((group) => (
                                            <Card key={group.id} variant="outlined" sx={{ mb: 1 }}>
                                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box>
                                                            <Typography variant="subtitle2">
                                                                {group.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {group.category} • {group.member_count} members
                                                            </Typography>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleGroupRemove(group.id)}
                                                            color="error"
                                                        >
                                                            <Clear fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                        <Typography variant="caption">
                                                            <Person fontSize="small" sx={{ fontSize: 14, mr: 0.5 }} />
                                                            Leader: {group.leader_name}
                                                        </Typography>
                                                        {group.co_leader_name && (
                                                            <Typography variant="caption">
                                                                <Person fontSize="small" sx={{ fontSize: 14, mr: 0.5 }} />
                                                                Co-leader: {group.co_leader_name}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Success Message */}
                        {successMessage && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                {successMessage}
                            </Alert>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(-1)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleCreateEvent}
                                disabled={loading}
                                sx={{ minWidth: 120 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Create Event'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Group Selection Dialog */}
                <Dialog
                    open={openGroupDialog}
                    onClose={handleCloseGroupDialog}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { height: '70vh' } }}
                >
                    <DialogTitle>
                        Select Groups to Invite
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Choose other comcell groups to join this event
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        {/* Search */}
                        <TextField
                            placeholder="Search groups by name, leader, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
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
                        />

                        {/* Groups List */}
                        {loadingGroups ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredGroups.length === 0 ? (
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                                <Typography color="text.secondary">
                                    {searchTerm ? 'No groups match your search' : 'No groups available to invite'}
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {filteredGroups.map((group) => (
                                    <ListItem
                                        key={group.id}
                                        button
                                        onClick={() => handleGroupSelect(group)}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            mb: 1,
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" fontWeight="600">
                                                    {group.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="body2" color="text.primary">
                                                        {group.category} • {group.member_count} members
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Leader: {group.leader_name}
                                                        {group.co_leader_name && ` • Co-leader: ${group.co_leader_name}`}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Add />}
                                                onClick={() => handleGroupSelect(group)}
                                            >
                                                Invite
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseGroupDialog}>
                            Done
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default CreateEvent;