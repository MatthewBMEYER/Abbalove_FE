import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Alert,
    CircularProgress,
    Drawer,
    IconButton,
    Grid,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Chip
} from "@mui/material";
import {
    Close,
    Add,
    Person
} from "@mui/icons-material";
import api from "../../../api";

const UsherTab = ({
    team,
    assignedMembers = [],
    onUpdate,
    isViewMode,
    isEditMode
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);

    // Initialize ushers from assignedMembers
    const initialUshers = useMemo(() => {
        if (!assignedMembers || assignedMembers.length === 0) return [];
        return assignedMembers.filter(member =>
            member.role_in_event === 'usher'
        );
    }, [assignedMembers]);

    const initialUsherDetails = useMemo(() => {
        const details = {};
        if (assignedMembers && assignedMembers.length > 0) {
            assignedMembers.forEach(usher => {
                if (usher.role_in_event === 'usher') {
                    details[usher.user_id] = usher.details || '';
                }
            });
        }
        return details;
    }, [assignedMembers]);

    const [ushers, setUshers] = useState(initialUshers);
    const [usherDetails, setUsherDetails] = useState(initialUsherDetails);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tempSelection, setTempSelection] = useState([]);

    // Track previous ushers to detect changes
    const prevUshersRef = useRef(initialUshers);
    const prevUsherDetailsRef = useRef(initialUsherDetails);
    const isInitialMount = useRef(true);

    // Reset state when mode changes or assignedMembers changes
    useEffect(() => {
        setUshers(initialUshers);
        setUsherDetails(initialUsherDetails);
        prevUshersRef.current = initialUshers;
        prevUsherDetailsRef.current = initialUsherDetails;
    }, [initialUshers, initialUsherDetails, isEditMode, isViewMode]);

    // Fetch team members when component mounts
    const fetchTeamMembers = async () => {
        if (!team?.id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/team/getMembers', { teamId: team.id });
            if (response.data.success) {
                setTeamMembers(response.data.data);
            } else {
                throw new Error('Failed to fetch team members');
            }
        } catch (err) {
            console.error('Error fetching team members:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    // Memoize the onUpdate callback to prevent unnecessary re-renders
    const handleUpdate = useCallback((updatedUshers) => {
        onUpdate(updatedUshers);
    }, [onUpdate]);

    // Update parent only when there are actual changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Compare current ushers with previous ushers
        const currentUsherIds = ushers.map(u => u.user_id).sort();
        const prevUsherIds = prevUshersRef.current.map(u => u.user_id).sort();

        // Check if ushers changed
        const hasUshersChanged = JSON.stringify(currentUsherIds) !== JSON.stringify(prevUsherIds);

        // Check if details changed for any usher
        let hasDetailsChanged = false;
        if (!hasUshersChanged) {
            for (const usher of ushers) {
                const currentDetail = usherDetails[usher.user_id] || '';
                const prevDetail = prevUsherDetailsRef.current[usher.user_id] || '';
                if (currentDetail !== prevDetail) {
                    hasDetailsChanged = true;
                    break;
                }
            }
        }

        // Only update parent if there are changes
        if (hasUshersChanged || hasDetailsChanged) {
            const allAssignments = ushers.map(usher => ({
                ...usher,
                role_in_event: 'usher',
                details: usherDetails[usher.user_id] || ''
            }));

            // Update refs before calling parent update
            prevUshersRef.current = ushers;
            prevUsherDetailsRef.current = { ...usherDetails };

            handleUpdate(allAssignments);
        }
    }, [ushers, usherDetails, handleUpdate]);

    // Open drawer for selection
    const openSelectionDrawer = useCallback(() => {
        fetchTeamMembers();
        if (!isEditMode) return;

        setTempSelection(ushers.map(usher => usher.user_id));
        setDrawerOpen(true);
    }, [ushers, isEditMode]);

    // Close drawer without saving
    const closeDrawer = () => {
        setDrawerOpen(false);
        setTempSelection([]);
    };

    // Save selection from drawer
    const saveSelection = () => {
        const selectedMembers = teamMembers.filter(member =>
            tempSelection.includes(member.user_id)
        );

        // Initialize details for new ushers
        const newDetails = { ...usherDetails };
        selectedMembers.forEach(member => {
            if (!newDetails[member.user_id]) {
                newDetails[member.user_id] = '';
            }
        });

        setUshers(selectedMembers);
        setUsherDetails(newDetails);
        closeDrawer();
    };

    // Handle checkbox toggle in drawer
    const handleTempSelectionToggle = (userId) => {
        setTempSelection(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Select all/none in drawer
    const handleSelectAll = () => {
        if (tempSelection.length === teamMembers.length) {
            setTempSelection([]);
        } else {
            setTempSelection(teamMembers.map(member => member.user_id));
        }
    };

    // Remove usher
    const removeUsher = useCallback((userId) => {
        setUshers(prev => prev.filter(usher => usher.user_id !== userId));
        // Remove details for removed usher
        setUsherDetails(prev => {
            const newDetails = { ...prev };
            delete newDetails[userId];
            return newDetails;
        });
    }, []);

    // Update usher details
    const handleDetailChange = useCallback((userId, detail) => {
        setUsherDetails(prev => ({
            ...prev,
            [userId]: detail
        }));
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ gap: 3, width: '100%', px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight="600">
                    Ushers & Prayers
                </Typography>
                {isViewMode && (
                    <Chip
                        label="View Mode"
                        color="info"
                        variant="outlined"
                        size="small"
                    />
                )}
            </Box>

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* View mode info */}
            {isViewMode && ushers.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No ushers assigned for this event.
                </Alert>
            )}

            {/* Summary - Always show when there are any assignments */}
            {ushers.length > 0 && (
                <Paper sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    color: 'text.main',
                    mb: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }} elevation={1}>
                    <Typography variant="body2">
                        <strong>Total Assigned:</strong> {ushers.length} Usher(s)
                    </Typography>
                </Paper>
            )}

            {/* Main Card */}
            <Grid container spacing={3} sx={{ width: '100%', minHeight: '500px', maxWidth: 1600 }}>
                <Grid item size={{ xs: 12, lg: 12 }}>
                    <Card elevation={1} sx={{
                        height: '100%',
                        backgroundColor: 'background.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        p: 1,
                        flexDirection: 'column',
                        opacity: isViewMode ? 0.9 : 1
                    }}>
                        <CardHeader
                            title={
                                <Typography variant="h6">
                                    Ushers
                                </Typography>
                            }
                            subheader={isViewMode ? "Ushers for this event" : "Select ushers and specify their roles for this event"}
                            action={
                                isEditMode && (
                                    <Button
                                        startIcon={<Add />}
                                        onClick={openSelectionDrawer}
                                        variant="contained"
                                        size="small"
                                    >
                                        {ushers.length > 0 ? 'Edit Ushers' : 'Select Ushers'}
                                    </Button>
                                )
                            }
                        />
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                            {ushers.length === 0 ? (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 200,
                                    p: 2
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                                        {isViewMode ? 'No ushers assigned' : 'No ushers selected'}
                                    </Typography>
                                    {isEditMode && (
                                        <Button
                                            startIcon={<Add />}
                                            onClick={openSelectionDrawer}
                                            variant="outlined"
                                            size="small"
                                        >
                                            Add Ushers
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <List dense sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                                        {ushers.map((usher) => (
                                            <ListItem
                                                key={usher.user_id}
                                                sx={{
                                                    px: 2,
                                                    py: 1.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2
                                                }}
                                                secondaryAction={
                                                    isEditMode && (
                                                        <IconButton
                                                            edge="end"
                                                            size="small"
                                                            onClick={() => removeUsher(usher.user_id)}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    )
                                                }
                                            >
                                                {/* Person Icon */}
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <Person fontSize="small" />
                                                </ListItemIcon>

                                                {/* Username */}
                                                <Typography variant="subtitle1" fontWeight="medium" sx={{ minWidth: 150 }}>
                                                    {usher.name}
                                                </Typography>

                                                {/* Text Field for Details */}
                                                {isEditMode ? (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="What will this usher do? (e.g., welcoming on 1st floor, seating guests, offering prayer)"
                                                        value={usherDetails[usher.user_id] || ''}
                                                        onChange={(e) => handleDetailChange(usher.user_id, e.target.value)}
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1.5,
                                                            flex: 1,
                                                            backgroundColor: 'background.default',
                                                            minHeight: 40,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Typography variant="body2" color="text.secondary">
                                                            {usherDetails[usher.user_id] || 'No details provided'}
                                                        </Typography>
                                                    </Paper>
                                                )}
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {ushers.length} usher(s) {isViewMode ? 'assigned' : 'selected'}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Selection Drawer - Only in edit mode */}
            {isEditMode && (
                <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={closeDrawer}
                    PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
                >
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Select Ushers
                            </Typography>
                            <IconButton onClick={closeDrawer}>
                                <Close />
                            </IconButton>
                        </Box>

                        {/* Select All Button */}
                        <Button
                            onClick={handleSelectAll}
                            variant="outlined"
                            sx={{ mb: 2 }}
                            fullWidth
                        >
                            {tempSelection.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                        </Button>

                        {/* Members List */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <List>
                                {teamMembers.map((member) => {
                                    const isSelected = tempSelection.includes(member.user_id);
                                    return (
                                        <ListItem
                                            key={member.user_id}
                                            dense
                                            button
                                            onClick={() => handleTempSelectionToggle(member.user_id)}
                                        >
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={member.name}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            {member.positions || 'Usher'}
                                                        </Typography>
                                                        {member.email && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {member.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>

                        {/* Footer Actions */}
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button
                                variant="contained"
                                onClick={saveSelection}
                                fullWidth
                            >
                                Save Selection ({tempSelection.length})
                            </Button>
                        </Box>
                    </Box>
                </Drawer>
            )}
        </Box>
    );
};

export default UsherTab;