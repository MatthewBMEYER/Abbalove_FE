import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, Paper, IconButton, Button, Drawer,
    Typography, Checkbox, FormControlLabel, Stack, Divider, Tooltip,
    Snackbar, Alert, TableSortLabel
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { Settings } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function TeamMembers({ teamId }) {
    const [members, setMembers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [nonMembers, setNonMembers] = useState([]);
    const [filteredNonMembers, setFilteredNonMembers] = useState([]);
    const [nonMemberSearch, setNonMemberSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sorting state
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success' | 'error' | 'warning' | 'info'
    });

    const navigate = useNavigate();

    // Reset all state when teamId changes
    useEffect(() => {
        if (!teamId) return;

        // Reset all state to initial values
        setMembers([]);
        setFiltered([]);
        setSearch('');
        setSidebarOpen(false);
        setNonMembers([]);
        setFilteredNonMembers([]);
        setNonMemberSearch('');
        setSelectedUsers([]);
        setLoading(false);
        setOrderBy('name');
        setOrder('asc');

        // Fetch new data
        fetchMembers();
    }, [teamId]);

    // Sorting function
    const sortMembers = (membersToSort, sortBy, sortOrder) => {
        return [...membersToSort].sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = a.name?.toLowerCase() || '';
                    bValue = b.name?.toLowerCase() || '';
                    break;
                case 'role':
                    aValue = a.role?.toLowerCase() || '';
                    bValue = b.role?.toLowerCase() || '';
                    break;
                case 'position':
                    aValue = a.positions?.toLowerCase() || '';
                    bValue = b.positions?.toLowerCase() || '';
                    break;

                case 'joined':
                    // Assuming joined_at is a date string that can be compared
                    aValue = new Date(a.joined_at || 0);
                    bValue = new Date(b.joined_at || 0);
                    break;
                default:
                    return 0;
            }

            if (sortBy === 'joined') {
                // For dates, compare directly
                if (sortOrder === 'asc') {
                    return aValue - bValue;
                } else {
                    return bValue - aValue;
                }
            } else {
                // For strings, use localeCompare
                if (sortOrder === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            }
        });
    };

    useEffect(() => {
        const lower = search.toLowerCase();
        const searchFiltered = members.filter(m =>
            `${m.first_name} ${m.last_name} ${m.role} ${m.positions}`.toLowerCase().includes(lower)
        );

        // Apply sorting to filtered results
        const sorted = sortMembers(searchFiltered, orderBy, order);
        setFiltered(sorted);
    }, [search, members, orderBy, order]);

    // Filter non-members based on search
    useEffect(() => {
        const lower = nonMemberSearch.toLowerCase();
        setFilteredNonMembers(nonMembers.filter(user =>
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(lower) ||
            user.email.toLowerCase().includes(lower)
        ));
    }, [nonMemberSearch, nonMembers]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

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

    const fetchMembers = () => {
        api.post(`/team/getMembers`, { teamId })
            .then((res) => {
                setMembers(res.data.data);
                // Apply initial sorting
                const sorted = sortMembers(res.data.data, orderBy, order);
                setFiltered(sorted);
            })
            .catch((err) => {
                console.error(err);
                showSnackbar('Failed to fetch team members', 'error');
            });
    };

    const fetchNonMembers = () => {
        api.post(`/team/getNonMembers`, { teamId })
            .then((res) => {
                setNonMembers(res.data.data);
                setFilteredNonMembers(res.data.data);
            })
            .catch((err) => {
                console.error(err);
                showSnackbar('Failed to fetch available users', 'error');
            });
    };

    const handleAddClick = () => {
        setSidebarOpen(true);
        setNonMemberSearch(''); // Reset search when opening
        fetchNonMembers();
    };

    const handleCloseSidebar = () => {
        setSidebarOpen(false);
        setSelectedUsers([]);
        setNonMemberSearch('');
    };

    const handleUserSelect = (userId, checked) => {
        if (checked) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        }
    };

    const handleRowClick = (userId) => {
        const isSelected = selectedUsers.includes(userId);
        handleUserSelect(userId, !isSelected);
    };

    // const handleCheckboxClick = (e, userId) => {
    //     e.stopPropagation(); // Prevent row click from firing
    //     handleUserSelect(userId, e.target.checked);
    // };

    const handleSave = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        try {
            await api.post('/team/addMemberToTeam', {
                teamId,
                userIds: selectedUsers
            });

            // Show success message
            showSnackbar(
                `Successfully added ${selectedUsers.length} member${selectedUsers.length === 1 ? '' : 's'} to the team`,
                'success'
            );

            // Refetch members after successful addition
            fetchMembers();
            handleCloseSidebar();
        } catch (error) {
            console.error('Error adding members:', error);

            // Show error message
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to add members to the team';
            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box pt={3}>
            {/* Search and Add Button Row */}
            <Box display="flex" gap={2} mb={4} alignItems="center">
                <TextField
                    label="Search members"
                    size="small"
                    variant="outlined"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddClick}
                    sx={{
                        minWidth: 'auto',
                        height: '40px',
                        px: 3
                    }}
                >
                    Add
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleRequestSort('name')}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'role'}
                                    direction={orderBy === 'role' ? order : 'asc'}
                                    onClick={() => handleRequestSort('role')}
                                >
                                    Role
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'position'}
                                    direction={orderBy === 'position' ? order : 'asc'}
                                    onClick={() => handleRequestSort('position')}
                                >
                                    Position
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'joined'}
                                    direction={orderBy === 'joined' ? order : 'asc'}
                                    onClick={() => handleRequestSort('joined')}
                                >
                                    Joined
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((m) => (
                            <TableRow key={m.id}>
                                <TableCell>{m.name}</TableCell>
                                <TableCell>{m.role}</TableCell>
                                <TableCell>
                                    {(() => {
                                        if (!m.positions) return '-';
                                        const posArr = m.positions.split(',').map(p => p.trim());
                                        if (posArr.length <= 2) return posArr.join(', ');

                                        const hiddenCount = posArr.length - 2;
                                        const visiblePositions = posArr.slice(0, 2).join(', ');
                                        const hiddenPositions = posArr.slice(2).join(', ');

                                        return (
                                            <>
                                                {visiblePositions}{' '}
                                                <Tooltip title={hiddenPositions}>
                                                    <Typography
                                                        component="span"
                                                        color="primary"
                                                        sx={{ cursor: 'pointer', ml: 1 }}
                                                    >
                                                        +{hiddenCount} more
                                                    </Typography>
                                                </Tooltip>
                                            </>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>{new Date(m.joined_at).toLocaleDateString()}</TableCell>

                                <TableCell align="center">
                                    <IconButton
                                        sx={{ color: 'primary.main' }}
                                        onClick={() => navigate(`/teams/${teamId}/member/detail/${m.user_id}`)}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} height="70px" align="center">No members found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Members Sidebar */}
            <Drawer
                anchor="right"
                open={sidebarOpen}
                onClose={handleCloseSidebar}
                variant="persistent"
                PaperProps={{
                    sx: { width: 400 }
                }}
            >
                <Box p={3} height="100%" display="flex" flexDirection="column">
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6">Add Team Members</Typography>
                        <IconButton onClick={handleCloseSidebar} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Search Field */}
                    <TextField
                        label="Search users"
                        size="small"
                        variant="filled"
                        value={nonMemberSearch}
                        onChange={(e) => setNonMemberSearch(e.target.value)}
                        sx={{ mb: 3 }}
                        fullWidth
                    />

                    <Divider sx={{ mb: 2 }} />

                    {/* Selected Count */}
                    {selectedUsers.length > 0 && (
                        <Box mb={2}>
                            <Typography variant="body2" color="primary.main" fontWeight={500}>
                                {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'} selected
                            </Typography>
                        </Box>
                    )}

                    {/* Non-member users list */}
                    <Box flex={1} overflow="auto">
                        {filteredNonMembers.length === 0 ? (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                py={6}
                            >
                                <Typography color="text.secondary" textAlign="center" variant="body2">
                                    {nonMemberSearch ? 'No users match your search' : 'No available users to add'}
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0}>
                                {filteredNonMembers.map((user) => (
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
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => handleRowClick(user.id)}
                                    >
                                        <Checkbox
                                            checked={selectedUsers.includes(user.id)}
                                            //onChange={(e) => handleCheckboxClick(e, user.id)}
                                            size="small"
                                            sx={{ p: 0 }}
                                        />
                                        <Box flex={1} minWidth={0}>
                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                {user.first_name} {user.last_name}
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

                    {/* Footer buttons */}
                    <Box mt={3} pt={2} borderTop={1} borderColor="divider">
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={handleCloseSidebar}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={selectedUsers.length === 0 || loading}
                            >
                                {loading ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length === 1 ? '' : 's'}`}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Drawer>

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
}