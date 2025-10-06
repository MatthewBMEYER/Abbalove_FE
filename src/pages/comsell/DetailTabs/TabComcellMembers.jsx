import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Chip,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Snackbar,
    Alert,
    TextField,
    Stack,
    Checkbox,
    Tooltip,
} from "@mui/material";
import {
    PersonAdd as PersonAddIcon,
    MoreVert as MoreVertIcon,
    Grade as GradeIcon,
    PersonRemove as PersonRemoveIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    Lock as LockIcon,
} from "@mui/icons-material";
import api from "../../../api";
import { useUserStore } from '../../../store/userStore';

const TabComcellMembers = ({ groupId, groupData, refreshGroupDetails, isActive }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get user data from store
    const { user } = useUserStore();

    // Add members dialog states
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    // Menu states
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        action: null
    });

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Authorization helper function
    const canModifyMembers = () => {
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
        if (user.roleName === 'admin') return 'admin';
        if (user.roleName === 'member') return 'member';


        if (groupData) {
            if (user.id === groupData.leaderId) return 'leader';
            if (user.id === groupData.coLeaderId) return 'co-leader';
        }

        return 'none';
    };

    useEffect(() => {
        // Only fetch members when this tab becomes active
        if (isActive) {
            fetchMembers();
        }
    }, [groupId, isActive]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/comcell/getComcellGroupMembers/${groupId}`);
            if (res.data.success) {
                setMembers(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch members:", err);
            showSnackbar('Failed to load members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await api.get("/user/getAll");
            setAllUsers(res.data.data);
            setFilteredUsers(res.data.data);
            return res.data.data;
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to fetch users', 'error');
            return [];
        }
    };

    const handleOpenAddMembers = async () => {
        // Check authorization
        if (!canModifyMembers()) {
            showSnackbar('You do not have permission to add members', 'error');
            return;
        }

        setSidebarOpen(true);
        setSelectedMembers([]);
        setUserSearch('');
        await fetchAllUsers();
    };

    const handleCloseSidebar = () => {
        setSidebarOpen(false);
        setSelectedMembers([]);
        setUserSearch('');
        setFilteredUsers([]);
    };

    const handleUserSearch = (searchValue, type) => {
        setUserSearch(searchValue);

        if (searchValue.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const filtered = allUsers.filter(user =>
                user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                user.email.toLowerCase().includes(searchValue.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    };

    const getFilteredMemberUsers = () => {
        // Get current member user IDs to exclude them
        const currentMemberIds = members.map(member => member.user_id);

        // Filter out users who are already members
        return filteredUsers.filter(user => !currentMemberIds.includes(user.id));
    };

    const handleMemberRowClick = (userId) => {
        setSelectedMembers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleAddSelectedMembers = async () => {
        if (selectedMembers.length === 0) return;

        // Double check authorization
        if (!canModifyMembers()) {
            showSnackbar('You do not have permission to add members', 'error');
            return;
        }

        try {
            const res = await api.post('/comcell/addMemberToComcellGroup', {
                groupId,
                userIds: selectedMembers
            });

            if (res.data.success) {
                showSnackbar(`${selectedMembers.length} member${selectedMembers.length === 1 ? '' : 's'} added successfully`, 'success');
                fetchMembers();
                if (refreshGroupDetails) refreshGroupDetails();
                handleCloseSidebar();
            } else {
                showSnackbar(res.data.message || 'Failed to add members', 'error');
            }
        } catch (err) {
            console.error("Failed to add members:", err);

            // Try to pull message from backend response first
            const backendMessage = err.response?.data?.message;

            showSnackbar(
                backendMessage || err.message || 'Something went wrong',
                'error'
            );
        }

    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleMenuOpen = (event, member) => {
        setAnchorEl(event.currentTarget);
        setSelectedMember(member);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedMember(null);
    };

    const handleRemoveMember = (member) => {
        // Check authorization
        if (!canModifyMembers()) {
            showSnackbar('You do not have permission to remove members', 'error');
            handleMenuClose();
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Remove Member',
            message: `Are you sure you want to remove ${member.name} from this group?`,
            action: () => removeMember(member.user_id)
        });
        handleMenuClose();
    };

    const removeMember = async (userId) => {
        // Double check authorization
        if (!canModifyMembers()) {
            showSnackbar('You do not have permission to remove members', 'error');
            setConfirmDialog({ open: false, title: '', message: '', action: null });
            return;
        }

        try {
            const res = await api.post(`/comcell/removeMemberFromComcellGroup`, {
                groupId,
                userId
            });

            if (res.data.success) {
                showSnackbar('Member removed successfully', 'success');
                fetchMembers();
                if (refreshGroupDetails) refreshGroupDetails();
            } else {
                showSnackbar(res.data.message || 'Failed to remove member', 'error');
            }
        } catch (err) {
            console.error("Failed to remove member:", err);
            showSnackbar('Something went wrong, please try again.', 'error');
        }

        setConfirmDialog({ open: false, title: '', message: '', action: null });
    };

    const formatJoinDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'leader':
                return { bgcolor: 'primary.main', color: 'white' };
            case 'co-leader':
                return { bgcolor: 'primary.main', color: 'white' };
            default:
                return { bgcolor: 'background.default', color: 'text.primary' };
        }
    };

    const getAvatarColor = (role) => {
        switch (role?.toLowerCase()) {
            // case 'leader':
            //     return 'warning.main';
            // case 'co-leader':
            //     return 'info.main';
            default:
                return 'primary.main';
        }
    };

    const hasEditPermission = canModifyMembers();
    const permissionLevel = getUserPermissionLevel();
    const isLeader = (member) => member.role === 'leader';
    const isCoLeader = (member) => member.role === 'co-leader';

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography color="text.secondary">Loading members...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 3 }}>
            {/* Permission Status Display */}
            {!hasEditPermission && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon fontSize="small" />
                        <Typography variant="body2">
                            You are viewing in read-only mode. Only group leaders, co-leaders, and masters can modify group members.
                            {permissionLevel !== 'none' && ` Your role: ${permissionLevel}`}
                        </Typography>
                    </Box>
                </Alert>
            )}

            {/* Header with Member Count and Add Button */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="body2" color="text.secondary">
                    {/* {members.length} members */}
                </Typography>

                <Tooltip title={!hasEditPermission ? "Only group leaders, co-leaders, and masters can add members" : ""}>
                    <span>
                        <Button
                            variant="contained"
                            startIcon={hasEditPermission ? <PersonAddIcon /> : <LockIcon />}
                            size="small"
                            onClick={handleOpenAddMembers}
                            sx={{ minWidth: 140, whiteSpace: 'noWrap' }}
                            disabled={!hasEditPermission}
                        >
                            Add Members
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            {/* Members Grid */}
            {members.length === 0 ? (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={8}
                >
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.300', mb: 2 }}>
                        <PersonAddIcon sx={{ fontSize: 32, color: 'grey.600' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No members yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Members will appear here once added
                    </Typography>
                </Box>
            ) : (
                <Grid
                    container
                    spacing={2.5}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gridAutoRows: "1fr",
                    }}
                >
                    {members.map((member) => (
                        <Card
                            key={member.id}
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 2,
                                bgcolor: "background.paper",
                                border: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? "1px solid rgba(255, 255, 255, 0.12)"
                                        : "1px solid rgba(0, 0, 0, 0.08)",
                                boxShadow: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? "0px 2px 12px rgba(0, 0, 0, 0.2)"
                                        : "0px 2px 12px rgba(0, 0, 0, 0.06)",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                    transform: "translateY(-1px)",
                                    boxShadow: (theme) =>
                                        theme.palette.mode === "dark"
                                            ? "0px 4px 20px rgba(0, 0, 0, 0.3)"
                                            : "0px 4px 20px rgba(0, 0, 0, 0.08)",
                                },
                            }}
                        >
                            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Avatar with Menu Button */}
                                <Box display="flex" justifyContent="center" alignItems="flex-start" mb={3} mt={1} position="relative">
                                    <Avatar
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            bgcolor: getAvatarColor(member.role),
                                            fontSize: '1.5rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {member.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </Avatar>

                                    {hasEditPermission && (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, member)}
                                            sx={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 0,
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>

                                {/* Member Info */}
                                <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} flex={1}>
                                    {/* Name */}
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        textAlign="center"
                                        color="text.primary"
                                        sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}
                                    >
                                        {member.name || 'Unknown User'}
                                    </Typography>

                                    {/* Role */}
                                    <Chip
                                        label={member.role?.charAt(0).toUpperCase() + member.role?.slice(1) || 'Member'}
                                        size="small"
                                        variant="filled"
                                        sx={{
                                            ...getRoleColor(member.role),
                                            fontSize: '0.75rem',
                                            height: 24,
                                            fontWeight: 500,
                                            minWidth: 80
                                        }}
                                    />

                                    {/* Join Date */}
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        textAlign="center"
                                        sx={{ mt: 'auto', fontSize: '0.8rem' }}
                                    >
                                        Joined {formatJoinDate(member.join_at)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Grid>
            )}

            {/* Add Members Dialog */}
            <Dialog
                open={sidebarOpen}
                onClose={handleCloseSidebar}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                        height: '70vh',
                        maxHeight: '600px'
                    }
                }}
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Add Group Members</Typography>
                        <IconButton onClick={handleCloseSidebar} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Search Field */}
                    <TextField
                        label="Search users"
                        size="small"
                        variant="filled"
                        value={userSearch}
                        onChange={(e) => handleUserSearch(e.target.value, 'member')}
                        fullWidth
                    />

                    {/* Selected Count */}
                    {selectedMembers.length > 0 && (
                        <Typography variant="body2" color="primary.main" fontWeight={500}>
                            {selectedMembers.length} user{selectedMembers.length === 1 ? '' : 's'} selected
                        </Typography>
                    )}

                    {/* Users list */}
                    <Box flex={1} overflow="auto" sx={{ minHeight: 0 }}>
                        {getFilteredMemberUsers().length === 0 ? (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                py={6}
                            >
                                <Typography color="text.secondary" textAlign="center" variant="body2">
                                    {userSearch ? 'No users match your search' : 'No users available to add'}
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0}>
                                {getFilteredMemberUsers().map((user) => (
                                    <Box
                                        key={user.id}
                                        display="flex"
                                        alignItems="center"
                                        gap={2}
                                        px={1}
                                        py={2}
                                        sx={{
                                            borderRadius: 1,
                                            border: '1px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => handleMemberRowClick(user.id)}
                                    >
                                        <Checkbox
                                            checked={selectedMembers.includes(user.id)}
                                            size="small"
                                            sx={{ p: 0 }}
                                        />
                                        <Box flex={1} minWidth={0}>
                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                {user.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseSidebar}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddSelectedMembers}
                        disabled={selectedMembers.length === 0}
                    >
                        Add {selectedMembers.length} Member{selectedMembers.length === 1 ? '' : 's'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { minWidth: 180 }
                }}
            >
                <MenuItem
                    disabled={selectedMember && (isLeader(selectedMember) || isCoLeader(selectedMember))}
                    onClick={() => handleRemoveMember(selectedMember)}
                    sx={{ color: 'error.main' }}
                >
                    <PersonRemoveIcon sx={{ fontSize: 18, mr: 1 }} />
                    Remove Member
                </MenuItem>
            </Menu>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDialog.action}
                        variant="contained"
                        color={confirmDialog.title.includes('Remove') ? 'error' : 'primary'}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TabComcellMembers;