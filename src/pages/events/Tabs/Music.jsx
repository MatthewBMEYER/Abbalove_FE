import { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Card,
    IconButton,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Drawer,
    TextField,
    Divider,
    Chip
} from "@mui/material";
import {
    Add,
    Close,
    Person,
    Search,
    MusicNote
} from "@mui/icons-material";
import api from "../../../api";

const MusicTab = ({
    team,
    assignedMembers,
    onUpdate,
    isViewMode,
    isEditMode
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [positions, setPositions] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);

    // Group assigned members by role_in_event (position name)
    const [positionAssignments, setPositionAssignments] = useState(() => {
        if (!assignedMembers || assignedMembers.length === 0) return {};

        const assignments = {};
        assignedMembers.forEach(member => {
            const positionName = member.role_in_event;  // Use role_in_event as position name
            if (positionName) {
                if (!assignments[positionName]) {
                    assignments[positionName] = [];
                }
                assignments[positionName].push(member);
            }
        });
        return assignments;
    });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [tempSelection, setTempSelection] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Use ref to track previous assignments
    const prevAssignmentsRef = useRef({});
    const isInitialMount = useRef(true);

    // Initialize ref on mount
    useEffect(() => {
        prevAssignmentsRef.current = positionAssignments;
    }, []);

    // Fetch positions and team members
    useEffect(() => {
        const fetchData = async () => {
            if (!team?.id) return;

            setLoading(true);
            setError(null);
            try {
                // Fetch positions for UI display
                const positionsResponse = await api.post('/team/getAllPositions', { teamId: team.id });
                if (positionsResponse.data.success) {
                    setPositions(positionsResponse.data.data || []);
                } else {
                    throw new Error('Failed to fetch positions');
                }

                // Fetch team members
                const membersResponse = await api.post('/team/getMembers', { teamId: team.id });
                if (membersResponse.data.success) {
                    setTeamMembers(membersResponse.data.data || []);
                } else {
                    throw new Error('Failed to fetch team members');
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [team?.id]);

    // Update parent only when there are actual changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const hasAssignmentsChanged = JSON.stringify(positionAssignments) !== JSON.stringify(prevAssignmentsRef.current);

        if (hasAssignmentsChanged) {
            const allAssignments = [];
            Object.entries(positionAssignments).forEach(([positionName, members]) => {
                members.forEach(member => {
                    allAssignments.push({
                        user_id: member.user_id,
                        name: member.name,
                        role_in_event: positionName,  // Save position name as role_in_event
                        details: member.details || null
                    });
                });
            });

            onUpdate(allAssignments);
            prevAssignmentsRef.current = { ...positionAssignments };
        }
    }, [positionAssignments, onUpdate]);

    // Open drawer for position selection
    const openSelectionDrawer = (position) => {
        setCurrentPosition(position);
        // Get currently assigned members for this position
        const currentAssigned = positionAssignments[position.label] || [];
        setTempSelection(currentAssigned.map(member => member.user_id));
        setDrawerOpen(true);
    };

    // Close drawer without saving
    const closeDrawer = () => {
        setDrawerOpen(false);
        setCurrentPosition(null);
        setTempSelection([]);
        setSearchTerm("");
    };

    // Save selection from drawer
    const saveSelection = () => {
        if (!currentPosition) return;

        const selectedMembers = teamMembers
            .filter(member => tempSelection.includes(member.user_id))
            .map(member => ({
                user_id: member.user_id,
                name: member.name,
                role_in_event: currentPosition.label,  // Save position label as role_in_event
                details: null
            }));

        setPositionAssignments(prev => ({
            ...prev,
            [currentPosition.label]: selectedMembers  // Group by position label
        }));
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
        const filteredMembers = getFilteredMembers();
        if (tempSelection.length === filteredMembers.length) {
            setTempSelection([]);
        } else {
            setTempSelection(filteredMembers.map(member => member.user_id));
        }
    };

    // Get filtered members based on search
    const getFilteredMembers = () => {
        if (!searchTerm.trim()) return teamMembers;
        return teamMembers.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.positions && member.positions.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    // Remove member from position
    const removeMemberFromPosition = useCallback((positionName, userId) => {
        setPositionAssignments(prev => {
            const newAssignments = { ...prev };
            if (newAssignments[positionName]) {
                newAssignments[positionName] = newAssignments[positionName]
                    .filter(member => member.user_id !== userId);

                // Remove empty position groups
                if (newAssignments[positionName].length === 0) {
                    delete newAssignments[positionName];
                }
            }
            return newAssignments;
        });
    }, []);

    // Find member assignment status
    const getMemberAssignmentStatus = useCallback((userId) => {
        const assignedPositions = [];
        Object.entries(positionAssignments).forEach(([positionName, members]) => {
            if (members.some(m => m.user_id === userId)) {
                assignedPositions.push(positionName);
            }
        });

        if (assignedPositions.length > 0) {
            return assignedPositions.join(', ');
        }
        return null;
    }, [positionAssignments]);

    // Group positions with their assigned members
    const getPositionWithMembers = () => {
        return positions.map(position => {
            const members = positionAssignments[position.label] || [];
            return { position, members };
        });
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
                    Musicians
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
            {isViewMode && assignedMembers.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No musicians assigned for this event.
                </Alert>
            )}

            {/* Positions Grid */}
            <Grid container spacing={2}>
                {getPositionWithMembers().map(({ position, members }) => (
                    <Grid item size={{ md: 12, lg: 12, xs: 12 }} key={position.id}>
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                minHeight: members.length > 0 ? 'auto' : 80,
                                display: 'flex',
                                alignItems: 'stretch',
                                backgroundColor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                opacity: isViewMode ? 0.9 : 1
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                width: '100%',
                                minHeight: '100%'
                            }}>
                                {/* Position Label */}
                                <Box sx={{
                                    minWidth: 120,
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%'
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {position.label}
                                    </Typography>
                                </Box>

                                <Divider orientation="vertical" flexItem />

                                {/* Assigned Users */}
                                <Box sx={{
                                    flex: 1,
                                    minHeight: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    {members.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontStyle: 'italic',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {isViewMode ? 'No one assigned' : 'No one assigned yet'}
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {members.map((member) => (
                                                <Box
                                                    key={member.user_id}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        p: 1.5,
                                                        backgroundColor: 'background.default',
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'divider'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Person fontSize="small" color="action" />
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {member.name}
                                                        </Typography>
                                                    </Box>
                                                    {isEditMode && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeMemberFromPosition(position.label, member.user_id)}
                                                            color="error"
                                                        >
                                                            <Close fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>

                                {/* Add Button */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%'
                                }}>
                                    {isEditMode && (
                                        <Button
                                            variant="contained"
                                            startIcon={<Add />}
                                            onClick={() => openSelectionDrawer(position)}
                                            size="small"
                                            sx={{ minWidth: 'auto' }}
                                        >
                                            Add
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Display unassigned members (if any) */}
            {Object.entries(positionAssignments).some(([positionName, members]) => {
                // Check if this positionName doesn't exist in positions array
                return !positions.some(p => p.label === positionName) && members.length > 0;
            }) && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Unrecognized Positions
                        </Typography>
                        {Object.entries(positionAssignments)
                            .filter(([positionName, members]) =>
                                !positions.some(p => p.label === positionName) && members.length > 0
                            )
                            .map(([positionName, members]) => (
                                <Card key={positionName} sx={{ mb: 2, p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        {positionName}
                                    </Typography>
                                    {members.map(member => (
                                        <Box key={member.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Person fontSize="small" />
                                            <Typography variant="body2">{member.name}</Typography>
                                            {isEditMode && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeMemberFromPosition(positionName, member.user_id)}
                                                    color="error"
                                                >
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    ))}
                                </Card>
                            ))}
                    </Box>
                )}

            {/* Empty State */}
            {positions.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <MusicNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Music Positions Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        No music positions have been configured for this team yet.
                    </Typography>
                </Box>
            )}

            {/* Selection Drawer - Only in edit mode */}
            {isEditMode && (
                <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={closeDrawer}
                    PaperProps={{ sx: { width: { xs: '100%', sm: 500 } } }}
                >
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="h6">
                                    Select Musicians
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    For: {currentPosition?.label}
                                </Typography>
                            </Box>
                            <IconButton onClick={closeDrawer}>
                                <Close />
                            </IconButton>
                        </Box>

                        {/* Search */}
                        <TextField
                            fullWidth
                            placeholder="Search by name or positions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Select All Button */}
                        <Button
                            onClick={handleSelectAll}
                            variant="outlined"
                            sx={{ mb: 2 }}
                            fullWidth
                        >
                            {tempSelection.length === getFilteredMembers().length ? 'Deselect All' : 'Select All'}
                        </Button>

                        {/* Members List */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <List>
                                {getFilteredMembers().map((member) => {
                                    const isSelected = tempSelection.includes(member.user_id);
                                    const assignmentStatus = getMemberAssignmentStatus(member.user_id);

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
                                                            {member.positions || 'No positions listed'}
                                                        </Typography>
                                                        {assignmentStatus && (
                                                            <Chip
                                                                label={`Already assigned to: ${assignmentStatus}`}
                                                                size="small"
                                                                variant="outlined"
                                                                color="warning"
                                                                sx={{ mt: 0.5 }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                                {getFilteredMembers().length === 0 && (
                                    <ListItem>
                                        <ListItemText
                                            primary="No team members found"
                                            secondary="Try adjusting your search terms"
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Box>

                        {/* Footer Actions */}
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button
                                variant="contained"
                                onClick={saveSelection}
                                fullWidth
                                disabled={tempSelection.length === 0}
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

export default MusicTab;