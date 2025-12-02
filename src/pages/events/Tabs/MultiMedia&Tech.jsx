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
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
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
    const [techTeam, setTechTeam] = useState(() => {
        if (!assignedMembers || assignedMembers.length === 0) return [];
        return assignedMembers;
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tempSelection, setTempSelection] = useState([]);
    const [techRoles, setTechRoles] = useState(() => {
        const roles = {};
        if (assignedMembers && assignedMembers.length > 0) {
            assignedMembers.forEach(member => {
                roles[member.user_id] = member.tech_roles || [];
            });
        }
        return roles;
    });

    // Tech role options
    const roleOptions = [
        { value: 'audio', label: 'Audio Engineer' },
        { value: 'video', label: 'Video Operator' },
        { value: 'projection', label: 'Projection/Lyrics' },
        { value: 'lighting', label: 'Lighting Operator' },
        { value: 'streaming', label: 'Live Streaming' },
        { value: 'stage_tech', label: 'Stage Technician' }
    ];

    // Use ref to track previous values
    const prevTechTeamRef = useRef([]);
    const isInitialMount = useRef(true);

    // Initialize refs on mount
    useEffect(() => {
        prevTechTeamRef.current = techTeam;
    }, []);

    // Fetch team members
    useEffect(() => {
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

        fetchTeamMembers();
    }, [team?.id]);

    // Update parent only when there are actual changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentTeamIds = techTeam.map(t => t.user_id).sort();
        const prevTeamIds = prevTechTeamRef.current.map(t => t.user_id).sort();

        const hasTeamChanged = JSON.stringify(currentTeamIds) !== JSON.stringify(prevTeamIds);

        // Check if roles changed for existing members
        const hasRolesChanged = techTeam.some((member, index) => {
            const prevMember = prevTechTeamRef.current[index];
            return prevMember && JSON.stringify(techRoles[member.user_id]) !== JSON.stringify(prevMember.tech_roles);
        });

        if (hasTeamChanged || hasRolesChanged) {
            const membersWithRoles = techTeam.map(member => ({
                ...member,
                tech_roles: techRoles[member.user_id] || []
            }));

            onUpdate(membersWithRoles);
            prevTechTeamRef.current = [...techTeam];
        }
    }, [techTeam, techRoles, onUpdate]);

    // Open drawer for selection
    const openSelectionDrawer = useCallback(() => {
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
            if (!newRoles[member.user_id]) {
                newRoles[member.user_id] = [];
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

    // Update tech roles for a member
    const handleRoleChange = useCallback((userId, roles) => {
        setTechRoles(prev => ({
            ...prev,
            [userId]: roles
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
                                                <Typography variant="subtitle1" fontWeight="medium" noWrap sx={{ width: '100%' }}>
                                                    {member.name}
                                                </Typography>

                                                {/* Role Selection */}
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Tech Roles</InputLabel>
                                                    {isEditMode ? (
                                                        <Select
                                                            multiple
                                                            value={techRoles[member.user_id] || []}
                                                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                            label="Tech Roles"
                                                            renderValue={(selected) => (
                                                                <Typography variant="body2">
                                                                    {selected.map(value => roleOptions.find(r => r.value === value)?.label || value).join(', ')}
                                                                </Typography>
                                                            )}
                                                        >
                                                            {roleOptions.map((role) => (
                                                                <MenuItem key={role.value} value={role.value}>
                                                                    {role.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    ) : (
                                                        <Paper
                                                            variant="outlined"
                                                            sx={{
                                                                p: 1.5,
                                                                backgroundColor: 'background.default',
                                                                minHeight: 40,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Typography variant="body2" color="text.secondary">
                                                                {techRoles[member.user_id]?.length > 0
                                                                    ? techRoles[member.user_id].map(value =>
                                                                        roleOptions.find(r => r.value === value)?.label || value
                                                                    ).join(', ')
                                                                    : 'No roles assigned'
                                                                }
                                                            </Typography>
                                                        </Paper>
                                                    )}
                                                </FormControl>

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