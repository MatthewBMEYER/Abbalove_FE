import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Stack,
    useTheme,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Divider,
} from "@mui/material";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Group as GroupIcon,
    Category as CategoryIcon,
    Description as DescriptionIcon,
    SupervisorAccount as LeaderIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Lock as LockIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import api from "../../../api";
import { useUserStore } from '../../../store/userStore';
import { useNavigate } from "react-router-dom";

// Move DataRow component outside of main component

const DataRow = ({ icon, label, value, field, isEditable = true, editMode, editData, onInputChange, theme, isSelect = false, selectOptions = [] }) => (
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
                isSelect ? (
                    <FormControl fullWidth variant="filled" size="small">
                        <Select
                            value={editData[field] || ''}
                            onChange={(e) => onInputChange(field, e.target.value)}
                            displayEmpty
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
                                }
                            }}
                        >
                            {selectOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                                    {option.display}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <TextField
                        variant="filled"
                        size="small"
                        fullWidth
                        multiline={field === 'description'}
                        // rows={field === 'description' ? 3 : 1}
                        rows={1}
                        value={editData[field] || ''}
                        onChange={(e) => onInputChange(field, e.target.value)}
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
                )
            ) : (
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 500,
                        color: value ? 'text.primary' : 'text.disabled',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    {field === 'leader_id' || field === 'co_leader_id' ? (
                        value ? (
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: field === 'leader_id' ? 'primary.main' : 'secondary.main' }}>
                                    {value.charAt(0)?.toUpperCase()}
                                </Avatar>
                                {value}
                            </Box>
                        ) : (
                            field === 'co_leader_id' ? 'No co-leader assigned' : '—'
                        )
                    ) : (
                        value || '—'
                    )}
                </Typography>
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

// Delete Row component to match the DataRow style
const DeleteRow = ({ onDelete, disabled, theme }) => (
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
            <DeleteIcon fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 140, mr: 30 }}>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: 0.5,

                }}
                textTransform="noWrap"

            >
                Delete Group
            </Typography>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mr: 2 }}
            >
                Permanently delete this group and remove all members. This action cannot be undone.
            </Typography>
            <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
                disabled={disabled}
                sx={{
                    minWidth: 140,
                    '&:hover': {
                        backgroundColor: 'error.dark',
                    }
                }}
            >
                Delete Group
            </Button>
        </Box>
    </Box>
);

const TabComcellDetails = ({ groupId, isActive, refreshGroupDetails, groupData }) => {
    const [groupDetails, setGroupDetails] = useState({});
    const [groupMembers, setGroupMembers] = useState([]); // Changed from allUsers to groupMembers
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const [deleting, setDeleting] = useState(false);
    const theme = useTheme();
    const navigate = useNavigate();

    // Get user data from store
    const { user } = useUserStore();

    // Snackbar state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Authorization helper function
    const canModifyGroup = () => {
        if (!user || !user.id) return false;

        // Check if user is master (profile role)
        if (user.roleName === 'master' || user.roleName === 'admin') return true;

        // Check if user is group leader or co-leader from group members
        const currentUserMember = groupMembers.find(member => member.user_id === user.id);
        if (currentUserMember && (currentUserMember.role === 'leader' || currentUserMember.role === 'co-leader')) {
            return true;
        }

        // Fallback to using groupData if available
        if (groupData) {
            return user.id === groupData.leader_id || user.id === groupData.co_leader_id;
        }

        // Fallback to using groupDetails if groupData not available
        if (groupDetails) {
            return user.id === groupDetails.leader_id || user.id === groupDetails.co_leader_id;
        }

        return false;
    };

    // Get user permission level for display
    const getUserPermissionLevel = () => {
        if (!user || !user.id) return 'none';

        if (user.roleName === 'master') return 'master';
        if (user.roleName === 'admin') return 'admin';
        if (user.roleName === 'member') return 'member';

        // Check from group members first
        const currentUserMember = groupMembers.find(member => member.user_id === user.id);
        if (currentUserMember) {
            return currentUserMember.role; // 'leader' or 'co-leader'
        }

        // Fallback check
        const checkData = groupData || groupDetails;
        if (checkData) {
            const leaderId = checkData.leaderId || checkData.leader_id;
            const coLeaderId = checkData.coLeaderId || checkData.co_leader_id;

            if (user.id === leaderId) return 'leader';
            if (user.id === coLeaderId) return 'co-leader';
        }

        return 'none';
    };

    useEffect(() => {
        if (isActive) {
            fetchGroupDetails();
            fetchGroupMembers();
        }
    }, [groupId, isActive]);

    // Check if there are changes between original and edit data
    useEffect(() => {
        const fieldsToCheck = ['name', 'category', 'description', 'leader_id', 'co_leader_id'];
        const changes = fieldsToCheck.some(field => groupDetails[field] !== editData[field]);
        setHasChanges(changes);
    }, [groupDetails, editData]);

    // Countdown effect for delete dialog
    useEffect(() => {
        let timer;
        if (deleteDialogOpen && deleteCountdown > 0) {
            timer = setTimeout(() => {
                setDeleteCountdown(deleteCountdown - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [deleteDialogOpen, deleteCountdown]);

    const fetchGroupDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/comcell/getComcellGroupDetail/${groupId}`);
            if (res.data.success) {
                const data = res.data.data;
                setGroupDetails(data);
                setEditData(data);
            }
        } catch (err) {
            console.error("Failed to fetch group details:", err);
            showNotification('Failed to load group details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupMembers = async () => {
        try {
            const res = await api.get(`/comcell/getComcellGroupMembers/${groupId}`);
            if (res.data.success) {
                setGroupMembers(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch group members:", err);
        }
    };

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const handleEditClick = () => {
        // Check authorization
        if (!canModifyGroup()) {
            showNotification('You do not have permission to edit group details', 'error');
            return;
        }

        setEditMode(true);
        setEditData({ ...groupDetails });
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditData({ ...groupDetails });
        setHasChanges(false);
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        // Double check authorization
        if (!canModifyGroup()) {
            showNotification('You do not have permission to save changes', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await api.post(`/comcell/updateComcellGroup/${groupId}`, editData);
            if (res.data.success) {
                showNotification('Group details updated successfully', 'success');
                setGroupDetails(res.data.data || editData);
                setEditData(res.data.data || editData);
                setEditMode(false);
                setHasChanges(false);
                if (refreshGroupDetails) refreshGroupDetails();
            } else {
                showNotification(res.data.message || 'Failed to update group details', 'error');
            }
        } catch (err) {
            console.error("Failed to update group details:", err);
            showNotification('Something went wrong, please try again.', 'error');
        } finally {
            setSaving(false);
            fetchGroupDetails();
        }
    };

    const handleDeleteClick = () => {
        // Check authorization
        if (!canModifyGroup()) {
            showNotification('You do not have permission to delete this group', 'error');
            return;
        }

        setDeleteCountdown(5);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            const res = await api.delete(`/comcell/deleteComcellGroup/${groupId}`);
            if (res.data.success) {
                showNotification('Group deleted successfully', 'success');
                setDeleteDialogOpen(false);
                // Navigate back or refresh parent component
                if (refreshGroupDetails) refreshGroupDetails();
            } else {
                showNotification(res.data.message || 'Failed to delete group', 'error');
            }
        } catch (err) {
            console.error("Failed to delete group:", err);
            showNotification('Something went wrong, please try again.', 'error');
        } finally {
            setDeleting(false);
            navigate(-1);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setDeleteCountdown(5);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper functions to get leader/co-leader info from group members
    const getLeaderInfo = () => {
        const leader = groupMembers.find(member => member.role === 'leader');
        return leader ? leader.name : null;
    };

    const getCoLeaderInfo = () => {
        const coLeader = groupMembers.find(member => member.role === 'co-leader');
        return coLeader ? coLeader.name : null;
    };

    const getLeaderUserId = () => {
        const leader = groupMembers.find(member => member.role === 'leader');
        return leader ? leader.user_id : null;
    };

    const getCoLeaderUserId = () => {
        const coLeader = groupMembers.find(member => member.role === 'co-leader');
        return coLeader ? coLeader.user_id : null;
    };

    // Prepare select options for leader/co-leader
    const getLeaderOptions = (isCoLeader = false) => {
        const options = [
            { value: '', display: isCoLeader ? 'No co-leader' : 'Select leader', disabled: false }
        ];

        groupMembers.forEach(member => {
            const isDisabled = isCoLeader && member.user_id === editData.leader_id;
            options.push({
                value: member.user_id,
                display: (
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                            {member.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        {member.name}
                    </Box>
                ),
                disabled: isDisabled
            });
        });

        return options;
    };

    const hasEditPermission = canModifyGroup();
    const permissionLevel = getUserPermissionLevel();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    Loading group details...
                </Typography>
            </Box>
        );
    }

    if (!groupDetails.id) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    Group details not found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Permission Status Display */}
            {!hasEditPermission && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon fontSize="small" />
                        <Typography variant="body2">
                            You are viewing in read-only mode. Only group leaders, co-leaders, and masters can modify group details.
                            {permissionLevel !== 'none' && ` Your role: ${permissionLevel}`}
                        </Typography>
                    </Box>
                </Alert>
            )}

            {/* Group Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <SectionHeader title="Basic Information" />

                <Box>
                    {!editMode ? (
                        <Tooltip title={!hasEditPermission ? "Only group leaders, co-leaders, and masters can edit group details" : ""}>
                            <span>
                                <Button
                                    variant="contained"
                                    startIcon={hasEditPermission ? <EditIcon /> : <LockIcon />}
                                    onClick={handleEditClick}
                                    sx={{ ml: 2 }}
                                    disabled={!hasEditPermission}
                                >
                                    Edit Details
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            {hasChanges && (
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
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

            {/* Basic Information */}
            <Box sx={{ mb: 3 }}>
                <DataRow
                    icon={<GroupIcon fontSize="small" />}
                    label="Group Name"
                    value={groupDetails.name}
                    field="name"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<CategoryIcon fontSize="small" />}
                    label="Category"
                    value={
                        groupDetails.category
                            ? groupDetails.category
                            : "General" // display fallback for null
                    }
                    field="category"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                    isSelect
                    selectOptions={[
                        { value: "Youth", display: "Youth" },
                        { value: "Adult", display: "Adult" },
                        { value: "", display: "General" }, // treat empty string as null
                    ]}
                />

                <DataRow
                    icon={<DescriptionIcon fontSize="small" />}
                    label="Description"
                    value={groupDetails.description}
                    field="description"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<PersonIcon fontSize="small" />}
                    label="Member Count"
                    value={groupDetails.member_count?.toString()}
                    field="member_count"
                    isEditable={false}
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
            </Box>

            {/* Leadership */}
            <SectionHeader title="Leadership" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<LeaderIcon fontSize="small" />}
                    label="Leader"
                    value={getLeaderInfo()} // Use the helper function
                    field="leader_id"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                    isSelect={true}
                    selectOptions={getLeaderOptions(false)}
                />
                <DataRow
                    icon={<LeaderIcon fontSize="small" />}
                    label="Co-Leader"
                    value={getCoLeaderInfo()} // Use the helper function
                    field="co_leader_id"
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                    isSelect={true}
                    selectOptions={getLeaderOptions(true)}
                />
            </Box>

            {/* Timestamps */}
            <SectionHeader title="Timestamps" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<CalendarIcon fontSize="small" />}
                    label="Created"
                    value={formatDate(groupDetails.create_at)}
                    field="create_at"
                    isEditable={false}
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
                <DataRow
                    icon={<CalendarIcon fontSize="small" />}
                    label="Last Updated"
                    value={formatDate(groupDetails.update_at)}
                    field="update_at"
                    isEditable={false}
                    editMode={editMode}
                    editData={editData}
                    onInputChange={handleInputChange}
                    theme={theme}
                />
            </Box>

            {/* Danger Zone */}
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    mb: 3,
                    mt: 5,
                    color: 'error.main',
                    '&:first-of-type': { mt: 0 }
                }}
            >
                Danger Zone
            </Typography>

            <Box sx={{ mb: 3 }}>
                <DeleteRow
                    onDelete={handleDeleteClick}
                    disabled={!hasEditPermission || editMode || saving}
                    theme={theme}
                />
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    color: 'error.main',
                    pb: 1
                }}>
                    <WarningIcon />
                    Delete Group Confirmation
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 3 }}>
                    <DialogContentText sx={{ mb: 2 }}>
                        Are you sure you want to delete the group <strong>"{groupDetails.name}"</strong>?
                    </DialogContentText>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            This action will permanently:
                        </Typography>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>Delete the group and all its data</li>
                            <li>Remove all group members</li>
                            <li>Cannot be undone</li>
                        </ul>
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        Please confirm by clicking the delete button below.
                        {deleteCountdown > 0 && (
                            <Typography
                                component="span"
                                sx={{
                                    display: 'block',
                                    mt: 1,
                                    fontWeight: 'bold',
                                    color: 'error.main'
                                }}
                            >
                                You can delete in {deleteCountdown} second{deleteCountdown !== 1 ? 's' : ''}...
                            </Typography>
                        )}
                    </Typography>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button
                        onClick={handleDeleteCancel}
                        variant="outlined"
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        disabled={deleteCountdown > 0 || deleting}
                        sx={{
                            minWidth: 120,
                        }}
                    >
                        {deleting ? 'Deleting...' : 'Delete Group'}
                    </Button>
                </DialogActions>
            </Dialog>

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
};

export default TabComcellDetails;