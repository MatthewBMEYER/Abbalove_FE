import { useState, useRef } from "react";
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
    Switch,
    FormControlLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Checkbox,
    Grid,
    Avatar,
    AvatarGroup,
    Badge
} from "@mui/material";
import {
    Add,
    Clear,
    Image as ImageIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Description as DescriptionIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    Notifications as NotificationsIcon,
    Upload as UploadIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    Person as PersonIcon,
    Engineering as TeamIcon,
    Engineering
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { useUserStore } from "../../store/userStore";

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const fileInputRef = useRef(null);

    // Event form states
    const [eventName, setEventName] = useState("");
    const [eventType, setEventType] = useState("service");
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
    const [isPublic, setIsPublic] = useState(true);

    // Image upload states
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});

    // Reminder states
    const [reminders, setReminders] = useState([30]); // Default: 30 minutes before

    // Private event invite states
    const [inviteType, setInviteType] = useState("users"); // 'users', 'groups', 'teams', 'roles'
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [openInviteDialog, setOpenInviteDialog] = useState(false);

    // Event type options for general events
    const eventTypeOptions = [
        { value: 'service', label: 'Sunday Service' },
        { value: 'prayer', label: 'Prayer Meeting' },
        { value: 'training', label: 'Training Session' },
        { value: 'outreach', label: 'Outreach Event' },
        { value: 'social', label: 'Social Gathering' },
        { value: 'fellowship', label: 'Fellowship' },
        { value: 'conference', label: 'Conference' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'retreat', label: 'Retreat' },
        { value: 'other', label: 'Other Event' }
    ];

    // Reminder options
    const reminderOptions = [
        { value: 15, label: '15 minutes before' },
        { value: 30, label: '30 minutes before' },
        { value: 60, label: '1 hour before' },
        { value: 1440, label: '1 day before' },
        { value: 10080, label: '1 week before' }
    ];

    // Invite type options
    const inviteTypeOptions = [
        { value: 'users', label: 'Individual Users', icon: <PersonIcon /> },
        { value: 'groups', label: 'Comcell Groups', icon: <GroupIcon /> },
        { value: 'teams', label: 'Worship Teams', icon: <TeamIcon /> },
        { value: 'roles', label: 'By Role', icon: <Engineering /> }
    ];

    // Handle multiple image selection
    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        const validFiles = files.filter(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select valid image files only');
                return false;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return false;
            }

            return true;
        });

        if (validFiles.length > 0) {
            const newImages = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));

            setSelectedImages(prev => [...prev, ...newImages]);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Remove selected image
    const handleRemoveImage = (imageId) => {
        setSelectedImages(prev => {
            const imageToRemove = prev.find(img => img.id === imageId);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
            return prev.filter(img => img.id !== imageId);
        });
    };

    // Add reminder
    const handleAddReminder = () => {
        setReminders(prev => [...prev, 30]); // Default to 30 minutes
    };

    // Remove reminder
    const handleRemoveReminder = (index) => {
        setReminders(prev => prev.filter((_, i) => i !== index));
    };

    // Update reminder time
    const handleReminderChange = (index, value) => {
        setReminders(prev => prev.map((time, i) => i === index ? value : time));
    };

    // Simulate image upload progress
    const simulateUpload = (imageId) => {
        return new Promise((resolve) => {
            setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    if (newProgress[imageId] >= 100) {
                        clearInterval(interval);
                        resolve();
                        return newProgress;
                    }
                    newProgress[imageId] = (newProgress[imageId] || 0) + 10;
                    return newProgress;
                });
            }, 100);
        });
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

        if (!description.trim()) {
            setError('Please enter event description');
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            setError('End time must be after start time');
            return;
        }

        if (!isPublic && selectedUsers.length === 0 && selectedGroups.length === 0 && selectedTeams.length === 0 && selectedRoles.length === 0) {
            setError('Please invite at least one person, group, team, or role for private events');
            return;
        }

        setLoading(true);

        try {
            const imageUrls = [];

            // Upload images if selected
            for (const image of selectedImages) {
                await simulateUpload(image.id);

                // In real implementation, you would upload to your server/cloud storage
                // const formData = new FormData();
                // formData.append('image', image.file);
                // const uploadResponse = await api.post('/upload/image', formData);
                // imageUrls.push(uploadResponse.data.url);

                imageUrls.push("https://example.com/event-image.jpg"); // Mock URL
            }

            // Prepare invite data for private events
            const inviteData = !isPublic ? {
                users: selectedUsers,
                groups: selectedGroups,
                teams: selectedTeams,
                roles: selectedRoles
            } : null;

            // Create the event
            const response = await api.post('/events/createPublicEvent', {
                name: eventName.trim(),
                type: eventType,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                location: location.trim(),
                description: description.trim(),
                isPublic: isPublic,
                imageUrls: imageUrls,
                reminders: reminders.map(minutes => ({ minutesBefore: minutes })),
                inviteData: inviteData,
                createdBy: user?.id
            });

            if (response.data.success) {
                setSuccessMessage('Event created successfully!');
                setTimeout(() => {
                    navigate('/events');
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to create event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create event');
        } finally {
            setLoading(false);
            setUploadProgress({});
        }
    };

    // Get invite summary for display
    const getInviteSummary = () => {
        const parts = [];
        if (selectedUsers.length > 0) parts.push(`${selectedUsers.length} users`);
        if (selectedGroups.length > 0) parts.push(`${selectedGroups.length} groups`);
        if (selectedTeams.length > 0) parts.push(`${selectedTeams.length} teams`);
        if (selectedRoles.length > 0) parts.push(`${selectedRoles.length} roles`);
        return parts.join(', ') || 'No one invited';
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ maxWidth: 1300, margin: '0 auto', p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        Create New Event
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Share an upcoming event with the church community
                    </Typography>
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

                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    {/* Event Poster Upload */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <ImageIcon color="action" />
                            <Box>
                                <Typography variant="h6">
                                    Event Posters
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Upload multiple images for your event (optional)
                                </Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={2}>
                            {/* Image Upload Card */}
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        backgroundColor: 'background.default',
                                        cursor: 'pointer',
                                        height: 140,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Add sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Add Images
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Image Previews */}
                            {selectedImages.map((image, index) => (
                                <Grid key={image.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            component="img"
                                            src={image.preview}
                                            alt={`Event preview ${index + 1}`}
                                            sx={{
                                                width: '100%',
                                                height: 140,
                                                borderRadius: 1,
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <IconButton
                                            onClick={() => handleRemoveImage(image.id)}
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0,0,0,0.7)'
                                                }
                                            }}
                                            size="small"
                                        >
                                            <Clear fontSize="small" />
                                        </IconButton>

                                        {uploadProgress[image.id] > 0 && uploadProgress[image.id] < 100 && (
                                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)' }}>
                                                <Typography variant="caption" sx={{ color: 'white', p: 0.5 }}>
                                                    Uploading... {uploadProgress[image.id]}%
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                        />
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Event Details */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <ScheduleIcon color="action" />
                            <Typography variant="h6">
                                Event Details
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                            <TextField
                                label="Event Name"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                fullWidth
                                placeholder="e.g., Sunday Service, Annual Conference, Youth Retreat"
                                required
                            />

                            {/* Event Type */}
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

                            {/* Location */}
                            <TextField
                                label="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                fullWidth
                                placeholder="e.g., Main Sanctuary, Community Hall, Online"
                            />

                            {/* Date & Time */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
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
                                        sx={{ flex: 1, minWidth: 250 }}
                                    />
                                    <DateTimePicker
                                        label="End Date & Time"
                                        value={endTime}
                                        onChange={setEndTime}
                                        minDateTime={startTime}
                                        ampm={false}
                                        format="dd/MM/yyyy HH:mm"
                                        sx={{ flex: 1, minWidth: 250 }}
                                    />
                                </Box>
                            </Box>

                            {/* Description */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Event Description *
                                    </Typography>
                                    <TextField
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={6}
                                        placeholder="Describe your event in detail... What can attendees expect? What's the purpose? Any special instructions?"
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Event Settings */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <PublicIcon color="action" />
                            <Typography variant="h6">
                                Event Settings
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Privacy Setting */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body1">
                                                {isPublic ? 'Public Event' : 'Private Event'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {isPublic
                                                    ? 'Visible to everyone in the church'
                                                    : 'Only visible to invited members'
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ width: '100%', mx: 0 }}
                                />
                            </Box>

                            {/* Private Event Invites */}
                            {!isPublic && (
                                <Box sx={{ ml: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Invite People
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {getInviteSummary()}
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Add />}
                                                onClick={() => setOpenInviteDialog(true)}
                                            >
                                                Manage Invites
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Reminders */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <NotificationsIcon color="action" />
                            <Typography variant="h6">
                                Reminders
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {reminders.map((reminder, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FormControl sx={{ minWidth: 200 }}>
                                        <InputLabel>Reminder {index + 1}</InputLabel>
                                        <Select
                                            value={reminder}
                                            label={`Reminder ${index + 1}`}
                                            onChange={(e) => handleReminderChange(index, e.target.value)}
                                        >
                                            {reminderOptions.map(option => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {reminders.length > 1 && (
                                        <IconButton
                                            onClick={() => handleRemoveReminder(index)}
                                            size="small"
                                        >
                                            <Clear />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}

                            <Button
                                startIcon={<Add />}
                                onClick={handleAddReminder}
                                variant="text"
                                sx={{ alignSelf: 'flex-start', ml: 4 }}
                            >
                                Add Another Reminder
                            </Button>
                        </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/events')}
                            disabled={loading}
                            sx={{ minWidth: 100 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateEvent}
                            disabled={loading || !eventName.trim() || !description.trim()}
                            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                            sx={{ minWidth: 140 }}
                        >
                            {loading ? 'Creating...' : 'Publish Event'}
                        </Button>
                    </Box>
                </Paper>

                {/* Invite Dialog - Placeholder for future implementation */}
                <Dialog
                    open={openInviteDialog}
                    onClose={() => setOpenInviteDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <GroupIcon />
                            <Typography variant="h6">Invite People to Event</Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Invite functionality will be implemented in the next phase.
                            This will allow you to invite individual users, comcell groups,
                            worship teams, or people by role.
                        </Typography>

                        <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                            <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Invite System Coming Soon
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                You'll be able to invite specific people, groups, teams, or roles to your private events.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenInviteDialog(false)}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default CreateEvent;