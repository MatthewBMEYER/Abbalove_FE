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
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from "@mui/material";
import {
    Close,
    Add,
    Person,
    Videocam
} from "@mui/icons-material";
import api from "../../../api";

const MultimediaTab = ({
    team,
    assignedMembers = [],
    onUpdate,
    isViewMode,
    isEditMode
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);

    // Initialize tech team from assignedMembers
    const initialTechTeam = useMemo(() => {
        if (!assignedMembers || assignedMembers.length === 0) return [];
        return assignedMembers.filter(member =>
            member.role_in_event === 'tech'
        );
    }, [assignedMembers]);

    const initialTechRoles = useMemo(() => {
        const roles = {};
        if (assignedMembers && assignedMembers.length > 0) {
            assignedMembers.forEach(member => {
                if (member.role_in_event === 'tech') {
                    // Store the selected role in the details field
                    roles[member.user_id] = member.details || '';
                }
            });
        }
        return roles;
    }, [assignedMembers]);

    const [techTeam, setTechTeam] = useState(initialTechTeam);
    const [techRoles, setTechRoles] = useState(initialTechRoles);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tempSelection, setTempSelection] = useState([]);

    // Tech role options for the details dropdown
    const roleOptions = [
        { value: 'Audio Engineer', label: 'Audio Engineer' },
        { value: 'Video Operator', label: 'Video Operator' },
        { value: 'Projection/Lyrics', label: 'Projection/Lyrics' },
        { value: 'Lighting Operator', label: 'Lighting Operator' },
        { value: 'Live Streaming', label: 'Live Streaming' },
        { value: 'Stage Technician', label: 'Stage Technician' },
        { value: 'Other', label: 'Other' }
    ];

    // Track previous values to detect changes
    const prevTechTeamRef = useRef(initialTechTeam);
    const prevTechRolesRef = useRef(initialTechRoles);
    const isInitialMount = useRef(true);

    // Reset state when mode changes or assignedMembers changes
    useEffect(() => {
        setTechTeam(initialTechTeam);
        setTechRoles(initialTechRoles);
        prevTechTeamRef.current = initialTechTeam;
        prevTechRolesRef.current = initialTechRoles;
    }, [initialTechTeam, initialTechRoles, isEditMode, isViewMode]);

    // Fetch team members
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

    const handleUpdate = useCallback((updatedTeam) => {
        onUpdate(updatedTeam);
    }, [onUpdate]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Compare current team with previous team
        const currentTeamIds = techTeam.map(t => t.user_id).sort();
        const prevTeamIds = prevTechTeamRef.current.map(t => t.user_id).sort();
        const hasTeamChanged = JSON.stringify(currentTeamIds) !== JSON.stringify(prevTeamIds);

        // Check if roles changed for existing members
        let hasRolesChanged = false;
        if (!hasTeamChanged) {
            for (const member of techTeam) {
                const currentRole = techRoles[member.user_id] || '';
                const prevRole = prevTechRolesRef.current[member.user_id] || '';
                if (currentRole !== prevRole) {
                    hasRolesChanged = true;
                    break;
                }
            }
        }

        // Also check if any member was removed (their roles are gone)
        if (!hasRolesChanged && !hasTeamChanged) {
            const currentUserIds = Object.keys(techRoles);
            const prevUserIds = Object.keys(prevTechRolesRef.current);
            if (JSON.stringify(currentUserIds.sort()) !== JSON.stringify(prevUserIds.sort())) {
                hasRolesChanged = true;
            }
        }

        // Only update parent if there are changes
        if (hasTeamChanged || hasRolesChanged) {
            const membersWithRoles = techTeam.map(member => {
                const originalMember = teamMembers.find(m => m.user_id === member.user_id) || member;
                const selectedRole = techRoles[member.user_id] || '';

                return {
                    ...originalMember,
                    role_in_event: 'tech', // Fixed role
                    details: selectedRole // Role selection goes in details field
                };
            });

            // Update refs before calling parent update
            prevTechTeamRef.current = [...techTeam];
            prevTechRolesRef.current = { ...techRoles };

            console.log('Updating tech team:', membersWithRoles);
            handleUpdate(membersWithRoles);
        }
    }, [techTeam, techRoles, handleUpdate, teamMembers]);

    // Open drawer for selection
    const openSelectionDrawer = useCallback(() => {
        fetchTeamMembers();
        if (!isEditMode) return;

        setTempSelection(techTeam.map(member => member.user_id));
        setDrawerOpen(true);
    }, [techTeam, isEditMode]);

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

        const newRoles = { ...techRoles };
        selectedMembers.forEach(member => {
            // Initialize with empty string if not exists
            if (!newRoles[member.user_id]) {
                newRoles[member.user_id] = '';
            }
        });

        // Clean up roles for members who are no longer selected
        Object.keys(newRoles).forEach(userId => {
            if (!selectedMembers.find(m => m.user_id === userId)) {
                delete newRoles[userId];
            }
        });

        setTechTeam(selectedMembers);
        setTechRoles(newRoles);
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

    // Remove tech member
    const removeTechMember = useCallback((userId) => {
        setTechTeam(prev => prev.filter(member => member.user_id !== userId));
        setTechRoles(prev => {
            const newRoles = { ...prev };
            delete newRoles[userId];
            return newRoles;
        });
    }, []);

    // Update tech role for a member (stores in details)
    const handleRoleChange = useCallback((userId, role) => {
        setTechRoles(prev => ({
            ...prev,
            [userId]: role
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
                    Multimedia & Tech Team
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
            {isViewMode && techTeam.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No multimedia/tech team assigned for this event.
                </Alert>
            )}

            {/* Summary */}
            {techTeam.length > 0 && (
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
                        <strong>Team Members:</strong> {techTeam.length} person(s) assigned to tech roles
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
                        flexDirection: 'column',
                        p: 1,
                        opacity: isViewMode ? 0.9 : 1
                    }}>
                        <CardHeader
                            title={
                                <Typography variant="h6">
                                    Tech Team Members
                                </Typography>
                            }
                            subheader={isViewMode ? "Multimedia and technical team for this event" : "Assign team members to multimedia and technical roles"}
                            action={
                                isEditMode && (
                                    <Button
                                        startIcon={<Add />}
                                        onClick={openSelectionDrawer}
                                        variant="contained"
                                        size="small"
                                    >
                                        {techTeam.length > 0 ? 'Edit Team' : 'Select Team'}
                                    </Button>
                                )
                            }
                        />
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                            {techTeam.length === 0 ? (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 200,
                                    p: 2
                                }}>
                                    <Videocam sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {isViewMode ? 'No Tech Team Assigned' : 'No Tech Team Assigned'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {isViewMode ? 'No multimedia/tech team assigned' : 'Add multimedia and technical team members'}
                                    </Typography>
                                    {isEditMode && (
                                        <Button
                                            startIcon={<Add />}
                                            onClick={openSelectionDrawer}
                                            variant="outlined"
                                            size="small"
                                        >
                                            Add Team
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <List dense sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                                        {techTeam.map((member) => (
                                            <ListItem
                                                key={member.user_id}
                                                sx={{
                                                    px: 2,
                                                    py: 1.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2
                                                }}
                                            >
                                                {/* Person Icon */}
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <Person fontSize="small" />
                                                </ListItemIcon>

                                                {/* Username */}
                                                <Typography variant="subtitle1" fontWeight="medium" noWrap sx={{ width: '100%', minWidth: 150 }}>
                                                    {member.name}
                                                </Typography>

                                                {/* Role Selection Dropdown */}
                                                {isEditMode ? (
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id={`tech-role-label-${member.user_id}`}>Tech Role</InputLabel>
                                                        <Select
                                                            value={techRoles[member.user_id] || ''}
                                                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                            labelId={`tech-role-label-${member.user_id}`}
                                                            label="Tech Role"
                                                        >
                                                            <MenuItem value="">
                                                                <em>Select a tech role...</em>
                                                            </MenuItem>
                                                            {roleOptions.map((role) => (
                                                                <MenuItem key={role.value} value={role.value}>
                                                                    {role.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
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
                                                            {techRoles[member.user_id] || 'No role assigned'}
                                                        </Typography>
                                                    </Paper>
                                                )}

                                                {/* Remove Button - Only in edit mode */}
                                                {isEditMode && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeTechMember(member.user_id)}
                                                    >
                                                        <Close />
                                                    </IconButton>
                                                )}
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {techTeam.length} team member(s) {isViewMode ? 'assigned' : 'selected'}
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
                                Select Tech Team
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
                                                            {member.positions || 'Tech Team'}
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

export default MultimediaTab;