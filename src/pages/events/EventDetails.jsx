import { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    CircularProgress,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
    Save,
    ArrowBack
} from "@mui/icons-material";
import api from "../../api";
import DetailTab from "./tabs/Detail";
import SingerTab from "./tabs/Singer";
import SpeakerTab from "./Tabs/Speaker";
import MusicTab from "./Tabs/Music";

const EventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [eventData, setEventData] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [confirmNavigate, setConfirmNavigate] = useState(false);

    // Use ref for teamAssignments to prevent re-renders
    const teamAssignmentsRef = useRef({});
    const [, forceUpdate] = useState(0);

    const isCreateMode = !eventId;

    const tabConfig = [
        { id: 'details', label: 'Event Details', component: DetailTab },
        { id: 'speaker', label: 'Speaker', component: SpeakerTab },
        { id: 'singers', label: 'Singers', component: SingerTab, teamId: 'team-singer' },
        { id: 'music', label: 'Musics', component: MusicTab, teamId: 'team-music' }
    ];

    const emptyEventData = {
        name: "",
        type: "service",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: "",
        description: "",
        is_public: true
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Force update helper
    const triggerUpdate = () => {
        forceUpdate(prev => prev + 1);
    };

    // Fetch event details and teams
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all main teams for tabs (for team data)
                const teamsResponse = await api.get('/team/getAllMain');
                if (teamsResponse.data.success) {
                    setTeams(teamsResponse.data.data);
                }

                // If edit mode, fetch existing event data
                if (eventId) {
                    const eventResponse = await api.get(`/events/${eventId}`);
                    if (eventResponse.data.success) {
                        setEventData(eventResponse.data.data);
                        await fetchTeamAssignments(eventId);
                    } else {
                        throw new Error('Failed to fetch event details');
                    }
                } else {
                    setEventData(emptyEventData);
                    // Initialize empty assignments for create mode
                    tabConfig.forEach(tab => {
                        if (tab.teamId) {
                            teamAssignmentsRef.current[tab.teamId] = [];
                        }
                    });
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                showSnackbar(err.response?.data?.message || err.message || 'Failed to load data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Fetch team assignments for existing event
    const fetchTeamAssignments = async (eventId) => {
        try {
            // TODO: Replace with actual API call
            // const response = await api.get(`/events/${eventId}/assignments`);
            // if (response.data.success) {
            //     teamAssignmentsRef.current = response.data.data;
            // }

            // For now, initialize with empty assignments for each team
            const initialAssignments = {};
            tabConfig.forEach(tab => {
                if (tab.teamId) {
                    initialAssignments[tab.teamId] = [];
                }
            });
            teamAssignmentsRef.current = initialAssignments;
            triggerUpdate();
        } catch (err) {
            console.error('Error fetching team assignments:', err);
            showSnackbar('Failed to load team assignments', 'error');
        }
    };

    // Handle event data updates
    const handleEventUpdate = (updatedData) => {
        setEventData(updatedData);
        setUnsavedChanges(true);
    };

    // Handle team assignments updates - FIXED: Use ref to prevent re-renders
    const handleTeamAssignmentUpdate = (teamId, members) => {
        teamAssignmentsRef.current[teamId] = members;
        setUnsavedChanges(true);
        // No need to trigger update here as child components manage their own state
    };

    // Save event (both create and update)
    const handleSaveEvent = async () => {
        setSaving(true);

        try {
            if (!eventData.name?.trim()) {
                showSnackbar('Event name is required', 'error');
                return;
            }

            let response;

            if (isCreateMode) {
                response = await api.post('/events/create', {
                    ...eventData,
                    team_assignments: teamAssignmentsRef.current
                });
            } else {
                response = await api.put(`/events/${eventId}`, {
                    ...eventData,
                    team_assignments: teamAssignmentsRef.current
                });
            }

            if (response.data.success) {
                showSnackbar(isCreateMode ? 'Event created successfully!' : 'Event updated successfully!');
                setUnsavedChanges(false);

                if (isCreateMode) {
                    setTimeout(() => {
                        navigate(`/events/${response.data.data.id}/edit`);
                    }, 1500);
                }
            } else {
                throw new Error(response.data.message || 'Failed to save event');
            }
        } catch (err) {
            console.error('Error saving event:', err);
            showSnackbar(err.response?.data?.message || err.message || 'Failed to save event', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleNavigation = (path) => {
        if (unsavedChanges) {
            setConfirmNavigate(path);
        } else {
            navigate(path);
        }
    };

    const confirmNavigation = () => {
        navigate(confirmNavigate);
        setConfirmNavigate(false);
    };

    const handleTabChange = (newValue) => {
        setActiveTab(newValue);
    };

    const getTeamForTab = (tabConfig) => {
        if (!tabConfig.teamId) return null;
        return teams.find(team => team.id === tabConfig.teamId);
    };

    const renderTabContent = () => {
        const currentTab = tabConfig[activeTab];

        switch (currentTab.id) {
            case 'details':
                const DetailComponent = currentTab.component;
                return (
                    <DetailComponent
                        eventData={eventData}
                        onUpdate={handleEventUpdate}
                        isCreateMode={isCreateMode}
                    />
                );

            case 'singers':
            case 'music':
                const TeamComponent = currentTab.component;
                const teamData = getTeamForTab(currentTab);
                return (
                    <TeamComponent
                        key={`${currentTab.id}-${teamData?.id}`} // Add key to force remount
                        team={teamData}
                        eventId={eventId}
                        assignedMembers={teamAssignmentsRef.current[currentTab.teamId] || []}
                        onAssignmentUpdate={(members) =>
                            handleTeamAssignmentUpdate(currentTab.teamId, members)
                        }
                        isCreateMode={isCreateMode}
                    />
                );

            default:
                const DefaultComponent = currentTab.component;
                return (
                    <DefaultComponent
                        eventData={eventData}
                        eventId={eventId}
                        isCreateMode={isCreateMode}
                    />
                );
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!eventData) {
        return (
            <Alert
                severity="error"
                sx={{ m: 2 }}
                action={
                    <Button color="inherit" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                }
            >
                Failed to load event data
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => handleNavigation(-1)}
                            sx={{ mr: 2 }}
                        >
                            Back
                        </Button>
                        {unsavedChanges && (
                            <Chip
                                label="Unsaved Changes"
                                color="warning"
                                variant="contained"
                                size="medium"
                            />
                        )}
                    </Box>

                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {isCreateMode ? 'Create New Event' : eventData.name || 'Untitled Event'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isCreateMode ? 'Create a new event and assign teams' : 'Edit event details and team assignments'}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveEvent}
                    disabled={saving || !eventData?.name?.trim()}
                    sx={{ minWidth: 120 }}
                >
                    {saving ? 'Saving...' : (isCreateMode ? 'Create Event' : 'Save Changes')}
                </Button>
            </Box>

            {/* Tabs */}
            <Paper sx={{ width: '100%', mb: 3, borderBottom: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => handleTabChange(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabConfig.map((tab, index) => (
                        <Tab
                            key={tab.id}
                            label={tab.label}
                            sx={{ textTransform: 'none' }}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Paper sx={{ p: 0 }} elevation={0}>
                {renderTabContent()}
            </Paper>

            {/* Unsaved Changes Dialog */}
            <Dialog
                open={!!confirmNavigate}
                onClose={() => setConfirmNavigate(false)}
            >
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <Typography>
                        You have unsaved changes. Are you sure you want to leave?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmNavigate(false)}>Stay</Button>
                    <Button onClick={confirmNavigation} color="error">Leave Anyway</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EventDetails;