import {
    Box,
    Typography,
    Chip,
    Avatar,
    Stack,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Snackbar,
    Alert
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Email,
    Phone,
    LocationOn,
    Person,
    AccessTime,
    CalendarToday,
    CheckCircle,
    Cancel,
    Edit as EditIcon
} from '@mui/icons-material';
import api from '../../api';
import LastSeenLabel from '../../components/LastSeenLabel';
import { useUserStore } from '../../store/userStore';


export default function UserDetail() {
    const { id } = useParams();
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        // Pull from Zustand store
        const { roleName } = useUserStore.getState().user || {};
        console.log(roleName);

        setCurrentUserRole(roleName || '');

        fetchUserData();
    }, [id]);

    const canEdit = () => {
        return currentUserRole === 'admin' || currentUserRole === 'master';
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/user/getDetail/${id}`);
            setUserData(response.data.data);
            setSelectedRole(response.data.data.role_name || 'user');
            setSelectedStatus(response.data.data.is_active || false);
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetRole = async () => {
        try {
            await api.post(`/user/setRole/${id}`, { role: selectedRole });
            setRoleDialogOpen(false);
            showSnackbar('Role updated successfully');

            // Refetch user data to get the latest from DB
            await fetchUserData();
        } catch (error) {
            console.error('Error changing role to user:', error);
            showSnackbar('Failed to update role', 'error');
        }
    };

    const handleSetStatus = async () => {
        try {
            await api.post(`/user/setStatus/${id}`, { is_active: selectedStatus });
            setStatusDialogOpen(false);
            showSnackbar('Status updated successfully');

            // Refetch user data to get the latest from DB
            await fetchUserData();
        } catch (error) {
            console.error('Error changing status to user:', error);
            showSnackbar('Failed to update status', 'error');
        }
    };

    const DataRow = ({ icon, label, value, isDate = false, inputType, showRelativeTime = false, onEdit = null, showEdit = false }) => (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            py: 2,
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

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    {isDate && showRelativeTime && value ? (
                        <LastSeenLabel date={value} />
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

                {showEdit && canEdit() && (
                    <IconButton
                        size="small"
                        onClick={onEdit}
                        sx={{
                            ml: 2,
                            color: 'primary.main',
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    );

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

    const RoleLabel = ({ role }) => {
        const formattedRole = role
            ? role.charAt(0).toUpperCase() + role.slice(1)
            : 'User';
        return formattedRole;
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    Loading user details...
                </Typography>
            </Box>
        );
    }

    // No user found
    if (!userData.id) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    No user found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, px: 5 }}>
            {/* User Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
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
            </Box>

            {/* Contact Information */}
            <SectionHeader title="Contact Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<Email fontSize="small" />}
                    label="Email Address"
                    value={userData.email}
                />
                <DataRow
                    icon={<Phone fontSize="small" />}
                    label="Phone Number"
                    value={userData.phone_number}
                />
            </Box>

            {/* Address Information */}
            <SectionHeader title="Personal Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<CalendarToday fontSize="small" />}
                    label="Date of Birth"
                    inputType="date"
                    value={userData.DOB}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Address"
                    value={userData.address}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="City"
                    value={userData.city}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Province"
                    value={userData.province}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Postal Code"
                    value={userData.postal_code}
                />
            </Box>

            {/* Account Information */}
            <SectionHeader title="Account Information" />
            <Box>
                <DataRow
                    icon={<Person fontSize="small" />}
                    label="Role"
                    value={<RoleLabel role={userData.role_name} />}
                    showEdit={true}
                    onEdit={() => setRoleDialogOpen(true)}
                />
                <DataRow
                    icon={userData.is_active ?
                        <CheckCircle fontSize="small" /> :
                        <Cancel fontSize="small" />
                    }
                    label="Account Status"
                    value={userData.is_active ? 'Active' : 'Inactive'}
                    showEdit={true}
                    onEdit={() => setStatusDialogOpen(true)}
                />
                <DataRow
                    icon={<AccessTime fontSize="small" />}
                    label="Last Login"
                    value={userData.last_login}
                    isDate={true}
                    showRelativeTime={true}
                />
                <DataRow
                    icon={<CalendarToday fontSize="small" />}
                    label="Account Created"
                    value={formatDate(userData.create_at)}
                />
                <DataRow
                    icon={<CalendarToday fontSize="small" />}
                    label="Last Updated"
                    value={formatDate(userData.update_at)}
                />
            </Box>

            {/* Role Edit Dialog */}
            <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update User Role</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            label="Role"
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="servant">Servant</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="master">Master</MenuItem>

                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetRole} variant="contained">Update Role</Button>
                </DialogActions>
            </Dialog>

            {/* Status Edit Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Account Status</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.checked)}
                                />
                            }
                            label={selectedStatus ? 'Active' : 'Inactive'}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {selectedStatus
                                ? 'User will be able to access the system'
                                : 'User will be blocked from accessing the system'
                            }
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetStatus} variant="contained">Update Status</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}