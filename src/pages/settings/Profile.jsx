import {
    Box,
    Typography,
    Button,
    TextField,
    Stack,
    useTheme,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
    Email,
    Phone,
    LocationOn,
    Person,
    Edit,
    Save,
    Cancel
} from '@mui/icons-material';
import api from '../../api';
import { useUserStore } from '../../store/userStore';

// Move DataRow component outside of Profile component
const DataRow = ({ icon, label, value, field, isEditable = true, editMode, editData, onInputChange, theme, inputType = 'text' }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        py: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider'
    }}>
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: 32,
            height: 32,
            mr: 3,
            color: 'grey.600'
        }}>
            {icon}
        </Box>

        <Box sx={{ minWidth: 140, mr: 30 }}>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: 0.5
                }}
            >
                {label}
            </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
            {editMode && isEditable ? (
                <TextField
                    variant="filled"
                    size="small"
                    fullWidth
                    type={inputType}
                    value={editData[field] || ''}
                    onChange={(e) => onInputChange(field, e.target.value)}
                    InputLabelProps={inputType === 'date' ? { shrink: true } : undefined}
                    sx={{
                        '& .MuiFilledInput-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            border: 'none',
                            '&:hover': {
                                backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.07)',
                            },
                            '&.Mui-focused': {
                                backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.09)',
                            },
                            '&:before': {
                                borderBottom: 'none',
                            },
                            '&:after': {
                                borderBottom: '2px solid',
                                borderBottomColor: 'primary.main',
                            },
                            '&:hover:not(.Mui-disabled):before': {
                                borderBottom: 'none',
                            }
                        },
                        '& .MuiFilledInput-input': {
                            padding: '12px',
                        }
                    }}
                />
            ) : (
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 500,
                        color: value ? 'text.primary' : 'text.disabled'
                    }}
                >
                    {value ? (inputType === 'date' ? new Date(value).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : value) : '—'}
                </Typography>
            )}
        </Box>
    </Box>
);

// Also move SectionHeader outside
const SectionHeader = ({ title }) => (
    <Typography
        variant="h6"
        sx={{
            fontWeight: 700,
            mb: 3,
            mt: 5,
            color: 'text.primary',
            '&:first-of-type': { mt: 0 }
        }}
    >
        {title}
    </Typography>
);

// And RoleLabel
const RoleLabel = ({ role }) => {
    const formattedRole = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : 'User';
    return formattedRole;
};

export default function Profile() {
    const [userData, setUserData] = useState({});
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const theme = useTheme();

    const { id } = useUserStore((state) => state.user);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get(`/user/getDetail/${id}`);
                const data = response.data.data;

                // Format DOB to YYYY-MM-DD for date input
                if (data.DOB) {
                    const date = new Date(data.DOB);
                    data.DOB = date.toISOString().split('T')[0];
                }

                setUserData(data);
                setEditData(data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                showNotification('Error fetching profile data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Check if there are changes between original and edit data
    useEffect(() => {
        const fieldsToCheck = ['first_name', 'last_name', 'phone_number', 'address', 'city', 'province', 'postal_code', 'DOB'];
        const changes = fieldsToCheck.some(field => userData[field] !== editData[field]);
        setHasChanges(changes);
    }, [userData, editData]);

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const handleEditClick = () => {
        setEditMode(true);
        setEditData({ ...userData });
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditData({ ...userData });
        setHasChanges(false);
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.post('/user/profile/edit', editData);
            const data = response.data.data;

            // Format DOB to YYYY-MM-DD for date input
            if (data.DOB) {
                const date = new Date(data.DOB);
                data.DOB = date.toISOString().split('T')[0];
            }

            setUserData(data);
            setEditData(data);
            setEditMode(false);
            setHasChanges(false);
            showNotification('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error updating profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    Loading profile...
                </Typography>
            </Box>
        );
    }

    if (!userData.id) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    Profile not found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, px: 5 }}>
            {/* Profile Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 5,
                pb: 4,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                        {userData.first_name} {userData.last_name}
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                        <Typography variant="h6" color="primary.main">
                            <RoleLabel role={userData.role_name} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            User ID: {userData.id}
                        </Typography>
                    </Stack>
                </Box>

                <Box>
                    {!editMode ? (
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={handleEditClick}
                            sx={{ ml: 2 }}
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            {hasChanges && (
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </Stack>
                    )}
                </Box>
            </Box>

            {/* Personal Information */}
            <SectionHeader title="Personal Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<Person fontSize="small" />}
                    label="First Name"
                    value={userData.first_name}
                    field="first_name"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<Person fontSize="small" />}
                    label="Last Name"
                    value={userData.last_name}
                    field="last_name"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<Person fontSize="small" />}
                    label="Date of Birth"
                    value={userData.DOB}
                    field="DOB"
                    inputType="date"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
            </Box>

            {/* Contact Information */}
            <SectionHeader title="Contact Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<Email fontSize="small" />}
                    label="Email Address"
                    value={userData.email}
                    field="email"
                    isEditable={false}
                    theme={theme}
                />
                <DataRow
                    icon={<Phone fontSize="small" />}
                    label="Phone Number"
                    value={userData.phone_number}
                    field="phone_number"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
            </Box>

            {/* Address Information */}
            <SectionHeader title="Address Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Address"
                    value={userData.address}
                    field="address"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="City"
                    value={userData.city}
                    field="city"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Province"
                    value={userData.province}
                    field="province"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Postal Code"
                    value={userData.postal_code}
                    field="postal_code"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
            </Box>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}