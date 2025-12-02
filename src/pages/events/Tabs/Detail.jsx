import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider
} from "@mui/material";
import {
    Edit as EditIcon,
    Save,
    Cancel
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const DetailTab = ({ data, onUpdate, isViewMode, isEditMode }) => {
    const [localData, setLocalData] = useState(data);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    // Update local data when parent data changes
    useEffect(() => {
        setLocalData(data);
    }, [data]);

    // Validate field
    const validateField = (field, value) => {
        switch (field) {
            case 'name':
                return value?.trim() ? '' : 'Event name is required';
            case 'start_time':
                return value ? '' : 'Start time is required';
            case 'end_time':
                if (!value) return 'End time is required';
                if (new Date(value) <= new Date(data.start_time)) {
                    return 'End time must be after start time';
                }
                return '';
            default:
                return '';
        }
    };

    // Handle field change
    const handleChange = (field, value) => {
        const updatedData = {
            ...localData,
            [field]: value
        };

        setLocalData(updatedData);
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate
        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));

        // Only update parent if valid
        if (!error) {
            onUpdate(updatedData);
        }
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

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
                    Event Details
                </Typography>

                {/* Show errors if any */}
                {Object.values(errors).some(error => error) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Please fix the errors before saving
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Event Name */}
                    <TextField
                        label="Event Name *"
                        value={localData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        fullWidth
                        placeholder="e.g., Sunday Service, Annual Conference"
                        required
                        disabled={!isEditMode}
                        error={touched.name && !!errors.name}
                        helperText={touched.name && errors.name}
                    />

                    {/* Event Type */}
                    <FormControl fullWidth disabled={!isEditMode}>
                        <InputLabel>Event Type</InputLabel>
                        <Select
                            value={localData.type || 'service'}
                            label="Event Type"
                            onChange={(e) => handleChange('type', e.target.value)}
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
                        value={localData.location || ''}
                        onChange={(e) => handleChange('location', e.target.value)}
                        fullWidth
                        placeholder="e.g., Main Sanctuary, Community Hall, Online"
                        disabled={!isEditMode}
                    />

                    {/* Description */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Description
                        </Typography>
                        <TextField
                            value={localData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            fullWidth
                            multiline
                            rows={4}
                            disabled={!isEditMode}
                            placeholder="Describe the event purpose, agenda, and any special instructions..."
                        />
                    </Box>

                    {/* Date & Time */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Start Time *
                            </Typography>
                            {isEditMode ? (
                                <DateTimePicker
                                    value={new Date(localData.start_time)}
                                    onChange={(date) => handleChange('start_time', date.toISOString())}
                                    ampm={false}
                                    format="dd/MM/yyyy HH:mm"
                                    sx={{ width: '100%' }}
                                    disabled={!isEditMode}
                                />
                            ) : (
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography>
                                        {formatDate(localData.start_time)} at {formatTime(localData.start_time)}
                                    </Typography>
                                </Paper>
                            )}
                            {touched.start_time && errors.start_time && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                    {errors.start_time}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 250 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                End Time *
                            </Typography>
                            {isEditMode ? (
                                <DateTimePicker
                                    value={new Date(localData.end_time)}
                                    onChange={(date) => handleChange('end_time', date.toISOString())}
                                    minDateTime={new Date(localData.start_time)}
                                    ampm={false}
                                    format="dd/MM/yyyy HH:mm"
                                    sx={{ width: '100%' }}
                                    disabled={!isEditMode}
                                />
                            ) : (
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography>
                                        {formatDate(localData.end_time)} at {formatTime(localData.end_time)}
                                    </Typography>
                                </Paper>
                            )}
                            {touched.end_time && errors.end_time && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                    {errors.end_time}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Read-only Information for View Mode */}
                    {isViewMode && data.created_at && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Created
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(data.created_at)}
                                    </Typography>
                                </Box>
                                {data.updated_at && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(data.updated_at)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default DetailTab;