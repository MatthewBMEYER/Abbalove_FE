import { useState, useEffect, useRef, useCallback } from "react";
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
    Chip
} from "@mui/material";
import {
    Close,
    Add,
    Person
} from "@mui/icons-material";
import api from "../../../api";

const SingerTab = ({
    team,
    assignedMembers,
    onUpdate,
    isViewMode,
    isEditMode
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [worshipLeaders, setWorshipLeaders] = useState(() => {
        if (!assignedMembers) return [];
        return assignedMembers.filter(member =>
            member.role_in_event === 'worship_leader'
        );
    });
    const [singers, setSingers] = useState(() => {
        if (!assignedMembers) return [];
        return assignedMembers.filter(member =>
            member.role_in_event === 'singer'
        );
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectionType, setSelectionType] = useState(null);
    const [tempSelection, setTempSelection] = useState([]);

    // Use refs to track previous values
    const prevWorshipLeadersRef = useRef([]);
    const prevSingersRef = useRef([]);
    const isInitialMount = useRef(true);

    // Initialize refs on mount
    useEffect(() => {
        prevWorshipLeadersRef.current = worshipLeaders;
        prevSingersRef.current = singers;
    }, []);

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

    // Update parent only when there are actual changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentWLIds = worshipLeaders.map(w => w.user_id).sort();
        const prevWLIds = prevWorshipLeadersRef.current.map(w => w.user_id).sort();

        const currentSingerIds = singers.map(s => s.user_id).sort();
        const prevSingerIds = prevSingersRef.current.map(s => s.user_id).sort();

        const hasWorshipLeadersChanged =
            JSON.stringify(currentWLIds) !== JSON.stringify(prevWLIds);
        const hasSingersChanged =
            JSON.stringify(currentSingerIds) !== JSON.stringify(prevSingerIds);

        if (hasWorshipLeadersChanged || hasSingersChanged) {
            const allAssignments = [
                ...worshipLeaders.map(wl => ({
                    ...wl,
                    role_in_event: 'worship_leader'
                })),
                ...singers.map(singer => ({
                    ...singer,
                    role_in_event: 'singer'
                }))
            ];

            onUpdate(allAssignments);

            // Update refs AFTER calling onUpdate
            prevWorshipLeadersRef.current = [...worshipLeaders];
            prevSingersRef.current = [...singers];
        }
    }, [worshipLeaders, singers, onUpdate]);

    // Open drawer for selection
    const openSelectionDrawer = (type) => {
        fetchTeamMembers();
        setSelectionType(type);
        if (type === 'worship_leader') {
            setTempSelection(worshipLeaders.map(wl => wl.user_id));
        } else {
            setTempSelection(singers.map(singer => singer.user_id));
        }
        setDrawerOpen(true);
    };

    // Close drawer without saving
    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectionType(null);
        setTempSelection([]);
    };

    // Save selection from drawer
    const saveSelection = () => {
        const selectedMembers = teamMembers.filter(member =>
            tempSelection.includes(member.user_id)
        );

        if (selectionType === 'worship_leader') {
            setWorshipLeaders(selectedMembers);
        } else {
            setSingers(selectedMembers);
        }
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

    // Remove member from worship leaders
    const removeWorshipLeader = useCallback((userId) => {
        setWorshipLeaders(prev => prev.filter(wl => wl.user_id !== userId));
    }, []);

    // Remove member from singers
    const removeSinger = useCallback((userId) => {
        setSingers(prev => prev.filter(singer => singer.user_id !== userId));
    }, []);

    // Check if member is assigned to other role
    const getMemberAssignmentStatus = (userId) => {
        const isWL = worshipLeaders.some(wl => wl.user_id === userId);
        const isSinger = singers.some(singer => singer.user_id === userId);

        if (isWL && isSinger) return 'Both';
        if (isWL) return 'Worship Leader';
        if (isSinger) return 'Singer';
        return null;
    };

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
                    Worship Leader & Singers
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

            {/* Summary - Always show when there are any assignments */}
            {(worshipLeaders.length > 0 || singers.length > 0) && (
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
                        <strong>Total Assigned:</strong> {worshipLeaders.length} Worship Leader(s), {singers.length} Singer(s)
                    </Typography>
                </Paper>
            )}

            {/* View mode info */}
            {isViewMode && worshipLeaders.length === 0 && singers.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No worship leaders or singers assigned for this event.
                </Alert>
            )}

            {/* Dual Card Layout */}
            <Grid container spacing={3} sx={{ gap: 3, width: '100%', minHeight: '500px', maxWidth: 1600 }}>
                {/* Worship Leader Card */}
                <Grid item size={{ xs: 12, lg: 6 }}>
                    <Card elevation={1} sx={{
                        height: '100%',
                        backgroundColor: 'background.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1,
                        opacity: isViewMode ? 0.9 : 1
                    }}>
                        <CardHeader
                            title={
                                <Typography variant="h6">
                                    Worship Leaders
                                </Typography>
                            }
                            subheader={isViewMode ? "Worship leaders for this event" : "Select worship leaders for this event"}
                            action={
                                isEditMode && (
                                    <Button
                                        startIcon={<Add />}
                                        onClick={() => openSelectionDrawer('worship_leader')}
                                        variant="contained"
                                        size="small"
                                    >
                                        {worshipLeaders.length > 0 ? 'Edit' : 'Select'}
                                    </Button>
                                )
                            }
                        />
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                            {worshipLeaders.length === 0 ? (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 120,
                                    p: 2
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                                        {isViewMode ? 'No worship leaders assigned' : 'No worship leaders selected'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <List dense sx={{ flex: 1, overflow: 'auto' }}>
                                        {worshipLeaders.map((leader) => (
                                            <ListItem
                                                key={leader.user_id}
                                                sx={{ px: 2 }}
                                                secondaryAction={
                                                    isEditMode && (
                                                        <IconButton
                                                            edge="end"
                                                            size="small"
                                                            onClick={() => removeWorshipLeader(leader.user_id)}
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    )
                                                }
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <Person fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={leader.name}
                                                    secondary={leader.email || ''}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {worshipLeaders.length} worship leader(s) {isViewMode ? 'assigned' : 'selected'}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Singers Card */}
                <Grid item size={{ xs: 12, lg: 6 }}>
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
                                    Singers
                                </Typography>
                            }
                            subheader={isViewMode ? "Singers for this event" : "Select singers for this event"}
                            action={
                                isEditMode && (
                                    <Button
                                        startIcon={<Add />}
                                        onClick={() => openSelectionDrawer('singer')}
                                        variant="contained"
                                        size="small"
                                    >
                                        {singers.length > 0 ? 'Edit' : 'Select'}
                                    </Button>
                                )
                            }
                        />
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                            {singers.length === 0 ? (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 120,
                                    p: 2
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                                        {isViewMode ? 'No singers assigned' : 'No singers selected'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <List dense sx={{ flex: 1, overflow: 'auto' }}>
                                        {singers.map((singer) => (
                                            <ListItem
                                                key={singer.user_id}
                                                sx={{ px: 2 }}
                                                secondaryAction={
                                                    isEditMode && (
                                                        <IconButton
                                                            edge="end"
                                                            size="small"
                                                            onClick={() => removeSinger(singer.user_id)}
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    )
                                                }
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <Person fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={singer.name}
                                                    secondary={singer.email || ''}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {singers.length} singer(s) {isViewMode ? 'assigned' : 'selected'}
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
                                Select {selectionType === 'worship_leader' ? 'Worship Leaders' : 'Singers'}
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
                                    const assignmentStatus = getMemberAssignmentStatus(member.user_id);

                                    return (
                                        <ListItem
                                            key={member.user_id}
                                            dense
                                            button
                                            onClick={() => handleTempSelectionToggle(member.user_id)}
                                            disabled={!isEditMode}
                                        >
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                    disabled={!isEditMode}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={member.name}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            {member.positions || 'Member'}
                                                        </Typography>
                                                        {assignmentStatus && (
                                                            <Chip
                                                                label={assignmentStatus}
                                                                size="small"
                                                                variant="outlined"
                                                                color="info"
                                                                sx={{ mt: 0.5 }}
                                                            />
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

export default SingerTab;