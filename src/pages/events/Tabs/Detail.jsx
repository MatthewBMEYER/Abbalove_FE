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
    Divider
} from "@mui/material";
import {
    Save,
    Cancel,
    Edit
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const DetailTab = ({ eventData, onUpdate, isCreateMode }) => {
    const [isEditing, setIsEditing] = useState(isCreateMode);
    const [formData, setFormData] = useState(eventData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");

    // Update form data when eventData changes
    useEffect(() => {
        setFormData(eventData);
    }, [eventData]);

    const handleInputChange = (field, value) => {
        const updatedData = {
            ...formData,
            [field]: value
        };
        setFormData(updatedData);
        onUpdate(updatedData);
    };

    const handleSave = () => {
        setLoading(true);
        // In create mode, saving is handled by parent
        // In edit mode, we could save individual tab changes here
        setTimeout(() => {
            setIsEditing(false);
            setLoading(false);
            setSuccess('Details updated successfully');
        }, 500);
    };

    const handleCancel = () => {
        setFormData(eventData);
        if (isCreateMode) {
            // In create mode, keep editing mode but reset to original data
            setFormData(eventData);
        } else {
            setIsEditing(false);
        }
        setError(null);
        setSuccess("");
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Event type options
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

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ py: 3 }}>
                {/* Header with Edit Button (only in edit mode) */}
                {!isCreateMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        {!isEditing ? (
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Details
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Cancel />}
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    Save
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Success/Error Messages */}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Event Name */}
                    <TextField
                        label="Event Name"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        fullWidth
                        placeholder="e.g., Sunday Service, Annual Conference, Youth Retreat"
                        required
                        disabled={!isEditing && !isCreateMode}
                    />

                    {/* Event Type */}
                    <FormControl fullWidth>
                        <InputLabel>Event Type</InputLabel>
                        <Select
                            value={formData.type || 'service'}
                            label="Event Type"
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            disabled={!isEditing && !isCreateMode}
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
                        value={formData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        fullWidth
                        placeholder="e.g., Main Sanctuary, Community Hall, Online"
                        disabled={!isEditing && !isCreateMode}
                    />

                    {/* Description */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Description
                        </Typography>
                        <TextField
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            fullWidth
                            multiline
                            rows={4}
                            disabled={!isEditing && !isCreateMode}
                            placeholder="Describe the event purpose, agenda, and any special instructions..."
                        />
                    </Box>

                    {/* Date & Time */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Start Time
                            </Typography>
                            {isEditing || isCreateMode ? (
                                <DateTimePicker
                                    value={new Date(formData.start_time)}
                                    onChange={(date) => handleInputChange('start_time', date.toISOString())}
                                    ampm={false}
                                    format="dd/MM/yyyy HH:mm"
                                    sx={{ width: '100%' }}
                                />
                            ) : (
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography>
                                        {formatDate(formData.start_time)} at {formatTime(formData.start_time)}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 250 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                End Time
                            </Typography>
                            {isEditing || isCreateMode ? (
                                <DateTimePicker
                                    value={new Date(formData.end_time)}
                                    onChange={(date) => handleInputChange('end_time', date.toISOString())}
                                    minDateTime={new Date(formData.start_time)}
                                    ampm={false}
                                    format="dd/MM/yyyy HH:mm"
                                    sx={{ width: '100%' }}
                                />
                            ) : (
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography>
                                        {formatDate(formData.end_time)} at {formatTime(formData.end_time)}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    </Box>

                    {/* Read-only Information for Edit Mode */}
                    {!isCreateMode && !isEditing && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Created
                                    </Typography>
                                    <Typography variant="body1">
                                        {formData.created_at ? formatDate(formData.created_at) : 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {formData.updated_at ? formatDate(formData.updated_at) : 'Unknown'}
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default DetailTab;