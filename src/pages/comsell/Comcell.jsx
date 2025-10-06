import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Grid,
    Chip,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
    Divider,
    Drawer,
    IconButton,
    Checkbox,
    Stack,
    Snackbar,
    Alert,
    Radio,
    RadioGroup,
    FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from '@mui/icons-material/Close';
import api from "../../api";
import { useUserStore } from '../../store/userStore';
import { useNavigate } from "react-router-dom";


const Comsell = ({ groups, refreshGroups }) => {
    const [search, setSearch] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: "",
        description: "",
        category: "",
        leaderId: "",
        coLeaderId: "",
    });

    const navigate = useNavigate();

    // Member selection states
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [leaderSidebarOpen, setLeaderSidebarOpen] = useState(false);
    const [coLeaderSidebarOpen, setCoLeaderSidebarOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filteredLeaderUsers, setFilteredLeaderUsers] = useState([]);
    const [filteredCoLeaderUsers, setFilteredCoLeaderUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [leaderSearch, setLeaderSearch] = useState('');
    const [coLeaderSearch, setCoLeaderSearch] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('');

    const handleViewGroup = (groupId) => {
        navigate(`/comcell/detail/${groupId}`);
    };

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const filteredGroups = groups.filter((group) => {
        const searchLower = search.toLowerCase();
        return (
            (group.name && group.name.toLowerCase().includes(searchLower)) ||
            (group.leader_name && group.leader_name.toLowerCase().includes(searchLower)) ||
            (group.co_leader_name && group.co_leader_name.toLowerCase().includes(searchLower))
        );
    });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    useEffect(() => {
        // Pull from Zustand store
        const { roleName } = useUserStore.getState().user || {};
        setCurrentUserRole(roleName || '');
    }, []);

    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'master';

    const fetchAllUsers = async () => {
        try {
            const res = await api.get("/user/getAll");
            setAllUsers(res.data.data);
            setFilteredUsers(res.data.data);
            setFilteredLeaderUsers(res.data.data);
            setFilteredCoLeaderUsers(res.data.data);
            return res.data.data;
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to fetch users', 'error');
            return [];
        }
    };

    // Filter users based on search and role exclusions
    const handleUserSearch = (searchTerm, searchType = 'member', users = allUsers) => {
        const lower = searchTerm.toLowerCase();
        let baseFiltered = users.filter(user =>
            `${user.name}`.toLowerCase().includes(lower) ||
            user.email.toLowerCase().includes(lower)
        );

        switch (searchType) {
            case 'leader':
                // Exclude co-leader from leader options
                const filteredLeaders = baseFiltered.filter(user => user.id !== newGroup.coLeaderId);
                setLeaderSearch(searchTerm);
                setFilteredLeaderUsers(filteredLeaders);
                break;
            case 'coLeader':
                // Exclude leader from co-leader options
                const filteredCoLeaders = baseFiltered.filter(user => user.id !== newGroup.leaderId);
                setCoLeaderSearch(searchTerm);
                setFilteredCoLeaderUsers(filteredCoLeaders);
                break;
            default:
                // Exclude both leader and co-leader from member options
                const filteredMembers = baseFiltered.filter(user =>
                    user.id !== newGroup.leaderId && user.id !== newGroup.coLeaderId
                );
                setUserSearch(searchTerm);
                setFilteredUsers(filteredMembers);
                break;
        }
    };


    const handleAddMembersClick = async () => {
        setSidebarOpen(true);
        setUserSearch('');
        const users = await fetchAllUsers();
        handleUserSearch('', 'member', users);
    };

    const handleSelectLeaderClick = async () => {
        setLeaderSidebarOpen(true);
        setLeaderSearch('');
        const users = await fetchAllUsers();
        handleUserSearch('', 'leader', users);
    };

    const handleSelectCoLeaderClick = async () => {
        setCoLeaderSidebarOpen(true);
        setCoLeaderSearch('');
        const users = await fetchAllUsers();
        handleUserSearch('', 'coLeader', users);
    };


    const handleCloseSidebar = () => {
        setSidebarOpen(false);
        setUserSearch('');
    };

    const handleCloseLeaderSidebar = () => {
        setLeaderSidebarOpen(false);
        setLeaderSearch('');
    };

    const handleCloseCoLeaderSidebar = () => {
        setCoLeaderSidebarOpen(false);
        setCoLeaderSearch('');
    };

    const handleMemberSelect = (userId, checked) => {
        if (checked) {
            setSelectedMembers(prev => [...prev, userId]);
        } else {
            setSelectedMembers(prev => prev.filter(id => id !== userId));
        }
    };

    const handleLeaderSelect = (userId) => {
        const selectedUser = allUsers.find(user => user.id === userId);
        if (selectedUser) {
            // Remove the new leader from selected members if they were previously selected
            setSelectedMembers(prev => prev.filter(id => id !== userId));

            setNewGroup(prev => ({ ...prev, leaderId: userId }));
            setLeaderSidebarOpen(false);

            // Re-filter member and co-leader lists to exclude the new leader
            handleUserSearch(userSearch, 'member');
            handleUserSearch(coLeaderSearch, 'coLeader');
        }
    };

    const handleCoLeaderSelect = (userId) => {
        const selectedUser = allUsers.find(user => user.id === userId);
        if (selectedUser) {
            // Remove the new co-leader from selected members if they were previously selected
            setSelectedMembers(prev => prev.filter(id => id !== userId));

            setNewGroup(prev => ({ ...prev, coLeaderId: userId }));
            setCoLeaderSidebarOpen(false);

            // Re-filter member and leader lists to exclude the new co-leader
            handleUserSearch(userSearch, 'member');
            handleUserSearch(leaderSearch, 'leader');
        }
    };

    const handleMemberRowClick = (userId) => {
        const isSelected = selectedMembers.includes(userId);
        handleMemberSelect(userId, !isSelected);
    };

    const handleAddGroup = async () => {
        if (!newGroup.name.trim()) {
            showSnackbar('Group name is required', 'error');
            return;
        }

        if (!newGroup.leaderId) {
            showSnackbar('Please select a group leader', 'error');
            return;
        }

        if (!newGroup.coLeaderId) {
            showSnackbar('Please select a group co-leader', 'error');
            return;
        }

        // Check if leader and co-leader are the same person (extra safety check)
        if (newGroup.leaderId === newGroup.coLeaderId) {
            showSnackbar('Leader and co-leader cannot be the same person', 'error');
            return;
        }

        // Final check: ensure no leader/co-leader is in members list
        const finalMembers = selectedMembers.filter(id =>
            id !== newGroup.leaderId && id !== newGroup.coLeaderId
        );

        if (finalMembers.length !== selectedMembers.length) {
            showSnackbar('Leaders cannot also be regular members', 'warning');
            setSelectedMembers(finalMembers);
            return;
        }

        setLoading(true);
        try {
            const groupData = {
                ...newGroup,
                memberIds: finalMembers
            };

            const res = await api.post("/comcell/createComcellGroup", groupData);
            if (res.data.success) {
                setOpenDialog(false);
                setNewGroup({ name: "", description: "", category: "", leaderId: "", coLeaderId: "" });
                setSelectedMembers([]);
                showSnackbar(`Group created successfully with ${finalMembers.length} members`, 'success');
                if (refreshGroups) refreshGroups();
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Failed to create group';
            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setNewGroup({ name: "", description: "", category: "", leaderId: "", coLeaderId: "" });
        setSelectedMembers([]);
        setAllUsers([]);
        handleCloseSidebar();
        handleCloseLeaderSidebar();
        handleCloseCoLeaderSidebar();
    };

    const getLeaderName = () => {
        if (!newGroup.leaderId) return "Select a leader";
        const leader = allUsers.find(user => user.id === newGroup.leaderId);
        return leader ? `${leader.name}` : "Select a leader";
    };

    const getCoLeaderName = () => {
        if (!newGroup.coLeaderId) return "Select a co-leader";
        const coLeader = allUsers.find(user => user.id === newGroup.coLeaderId);
        return coLeader ? `${coLeader.name}` : "Select a co-leader";
    };

    // Filter out already selected leader from co-leader options
    const getFilteredCoLeaderUsers = () => {
        return filteredCoLeaderUsers.filter(user => user.id !== newGroup.leaderId);
    };

    // Filter out already selected co-leader from leader options
    const getFilteredLeaderUsers = () => {
        return filteredLeaderUsers.filter(user => user.id !== newGroup.coLeaderId);
    };

    // Filter out leaders from member options
    const getFilteredMemberUsers = () => {
        return filteredUsers.filter(user =>
            user.id !== newGroup.leaderId && user.id !== newGroup.coLeaderId
        );
    };

    return (
        <Box>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >
                <TextField
                    variant="outlined"
                    label="Search groups"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1, mr: 2 }}
                />

                {isAdmin && <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ minWidth: 120 }}
                >
                    Create Group
                </Button>}
            </Box>

            {/* Group Cards */}
            {filteredGroups.length === 0 ? (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={8}
                >
                    <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No groups found
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Try adjusting your search or create a new group
                    </Typography>
                </Box>
            ) : (
                <Grid
                    container
                    spacing={2.5}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(370px, 1fr))",
                        gridAutoRows: "1fr",
                        maxWidth: "100%",
                    }}
                >
                    {filteredGroups.map((group) => (
                        <Card
                            key={group.id}
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
                                        ? "0px 4px 20px rgba(0, 0, 0, 0.3)"
                                        : "0px 4px 20px rgba(0, 0, 0, 0.08)",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: (theme) =>
                                        theme.palette.mode === "dark"
                                            ? "0px 8px 32px rgba(0, 0, 0, 0.4)"
                                            : "0px 8px 32px rgba(0, 0, 0, 0.12)",
                                },
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                                {/* Header */}
                                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Typography variant="h6" fontWeight={600} noWrap color="text.primary">
                                            {group.name || group.id}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        label={group.category || "General"}
                                        size="small"
                                        variant="filled"
                                        sx={{
                                            fontSize: '0.75rem',
                                            borderRadius: 1,
                                            height: 24,
                                            color: "white",
                                            bgcolor: "primary.main",
                                            '&:hover': {
                                                bgcolor: "primary.dark",
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Description */}
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 2,
                                        minHeight: 40,
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        lineHeight: 1.5
                                    }}
                                >
                                    {group.description || " "}
                                </Typography>

                                <Divider sx={{
                                    mb: 2,
                                    borderColor: (theme) => theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.12)'
                                        : 'rgba(0, 0, 0, 0.08)'
                                }} />

                                {/* Stats */}
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box display="flex" flexDirection="column" alignItems="left" gap={1}>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Leader: {group.leader_name || "Unknown"}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Co-Leader: {group.co_leader_name || "Unknown"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {group.member_count || 0} members
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>

                            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => handleViewGroup(group.id)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        borderColor: (theme) => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.23)'
                                            : 'rgba(0, 0, 0, 0.23)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                                ? 'rgba(238, 90, 87, 0.08)'
                                                : 'rgba(205, 71, 68, 0.04)',
                                        }
                                    }}
                                >
                                    View Group
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </Grid>
            )}

            {/* Add Group Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                    }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AddIcon />
                        <Typography variant="h6" color="text.primary">
                            Create New Group
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Group Name*"
                            fullWidth
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                            variant="filled"
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newGroup.description}
                            onChange={(e) =>
                                setNewGroup({ ...newGroup, description: e.target.value })
                            }
                            variant="filled"
                        />
                        <FormControl fullWidth variant="filled">
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select
                                labelId="category-label"
                                value={newGroup.category}
                                onChange={(e) =>
                                    setNewGroup({ ...newGroup, category: e.target.value })
                                }
                            >
                                <MenuItem value="Adult">Adult</MenuItem>
                                <MenuItem value="Youth">Youth</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Leader Selection */}
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2" color="text.primary">
                                    Group Leader*
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={handleSelectLeaderClick}
                                sx={{ justifyContent: 'flex-start' }}
                            >
                                {getLeaderName()}
                            </Button>
                        </Box>

                        {/* Co-Leader Selection */}
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2" color="text.primary">
                                    Group Co-Leader*
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={handleSelectCoLeaderClick}
                                sx={{ justifyContent: 'flex-start' }}
                            >
                                {getCoLeaderName()}
                            </Button>
                        </Box>

                        {/* Members Section */}
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2" color="text.primary">
                                    Members ({selectedMembers.length})
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddMembersClick}
                                >
                                    Add Members
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleDialogClose} color="inherit" disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleAddGroup} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Group'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Members Modal */}
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

                    {/* Warning if leaders are selected */}
                    {(newGroup.leaderId || newGroup.coLeaderId) && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: 'info.main',
                                borderRadius: 1,
                            }}
                        >
                            <Typography variant="caption" color="info.contrastText">
                                Selected leaders are excluded from member options
                            </Typography>
                        </Box>
                    )}

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
                                    {userSearch ? 'No users match your search' : 'No users available'}
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
                        onClick={handleCloseSidebar}
                        disabled={selectedMembers.length === 0}
                    >
                        Add {selectedMembers.length} Member{selectedMembers.length === 1 ? '' : 's'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Select Leader Modal */}
            <Dialog
                open={leaderSidebarOpen}
                onClose={handleCloseLeaderSidebar}
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
                        <Typography variant="h6">Select Group Leader</Typography>
                        <IconButton onClick={handleCloseLeaderSidebar} size="small">
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
                        value={leaderSearch}
                        onChange={(e) => handleUserSearch(e.target.value, 'leader')}
                        fullWidth
                    />

                    {/* Users list */}
                    <Box flex={1} overflow="auto" sx={{ minWidth: 0 }}>
                        {getFilteredLeaderUsers().length === 0 ? (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                py={6}
                            >
                                <Typography color="text.secondary" textAlign="center" variant="body2">
                                    {leaderSearch ? 'No users match your search' : 'No users available'}
                                </Typography>
                            </Box>
                        ) : (
                            <RadioGroup value={newGroup.leaderId}>
                                <Stack spacing={0}>
                                    {getFilteredLeaderUsers().map((user) => (
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
                                            onClick={() => handleLeaderSelect(user.id)}
                                        >
                                            <Radio
                                                value={user.id}
                                                checked={newGroup.leaderId === user.id}
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
                            </RadioGroup>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseLeaderSidebar}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCloseLeaderSidebar}
                        disabled={!newGroup.leaderId}
                    >
                        Select Leader
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Select Co-Leader Modal */}
            <Dialog
                open={coLeaderSidebarOpen}
                onClose={handleCloseCoLeaderSidebar}
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
                        <Typography variant="h6">Select Group Co-Leader</Typography>
                        <IconButton onClick={handleCloseCoLeaderSidebar} size="small">
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
                        value={coLeaderSearch}
                        onChange={(e) => handleUserSearch(e.target.value, 'coLeader')}
                        fullWidth
                    />

                    {/* Warning if leader is selected */}
                    {newGroup.leaderId && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: 'info.main',
                                borderRadius: 1,
                            }}
                        >
                            <Typography variant="caption" color="info.contrastText">
                                The selected leader will be excluded from co-leader options
                            </Typography>
                        </Box>
                    )}

                    {/* Users list */}
                    <Box flex={1} overflow="auto" sx={{ minHeight: 0 }}>
                        {getFilteredCoLeaderUsers().length === 0 ? (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                py={6}
                            >
                                <Typography color="text.secondary" textAlign="center" variant="body2">
                                    {coLeaderSearch ? 'No users match your search' : 'No users available'}
                                </Typography>
                            </Box>
                        ) : (
                            <RadioGroup value={newGroup.coLeaderId}>
                                <Stack spacing={0}>
                                    {getFilteredCoLeaderUsers().map((user) => (
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
                                            onClick={() => handleCoLeaderSelect(user.id)}
                                        >
                                            <Radio
                                                value={user.id}
                                                checked={newGroup.coLeaderId === user.id}
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
                            </RadioGroup>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseCoLeaderSidebar}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCloseCoLeaderSidebar}
                        disabled={!newGroup.coLeaderId}
                    >
                        Select Co-Leader
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

export default Comsell;