import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Tooltip,
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
    ArrowBack,
    Error,
    Visibility,
    Edit as EditIcon,
} from "@mui/icons-material";
import api from "../../api";
import DetailTab from "./tabs/Detail";
import SingerTab from "./tabs/Singer";
import SpeakerTab from "./Tabs/Speaker";
import MusicTab from "./Tabs/Music";
import SongTab from "./Tabs/Song";
import UsherTab from "./Tabs/Usher";
import MultimediaTab from "./Tabs/MultiMedia&Tech";

const EventDetails = () => {
    const { eventId } = useParams();
    console.log(eventId)
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [mode, setMode] = useState(eventId ? 'view' : 'create'); // 'view', 'edit', 'create'
    const [eventData, setEventData] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [confirmNavigate, setConfirmNavigate] = useState(false);

    const isCreateMode = mode === 'create';
    const isEditMode = mode === 'edit' || isCreateMode;
    const isViewMode = mode === 'view';

    const tabConfig = [
        { id: 'details', label: 'Event Details', component: DetailTab },
        { id: 'speaker', label: 'Speaker', component: SpeakerTab },
        { id: 'singers', label: 'Singers', component: SingerTab, teamId: 'team-singer' },
        { id: 'music', label: 'Musics', component: MusicTab, teamId: 'team-music' },
        { id: 'songs', label: 'Songs', component: SongTab },
        { id: 'usher', label: 'Usher', component: UsherTab, teamId: 'team-usher' },
        { id: 'multimedia', label: 'Multimedia & Tech', component: MultimediaTab, teamId: 'team-media' }
    ];

    // Unified event data structure
    const emptyEventData = {
        // Basic event info
        name: "",
        type: "service",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: "",
        description: "",
        is_public: true,

        // Tab-specific data
        speakers: [],
        translators: [],
        presentations: [],
        songs: [],

        // Team assignments
        team_assignments: {
            'team-singer': [],
            'team-music': [],
            'team-usher': [],
            'team-media': []
        }
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Fetch event details and teams
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all main teams for tabs
                const teamsResponse = await api.get('/team/getAllMain');
                if (teamsResponse.data.success) {
                    setTeams(teamsResponse.data.data);
                }

                if (eventId) {
                    // Fetch existing event with ALL related data
                    const eventResponse = await api.get(`/core/event/get/${eventId}`);
                    if (eventResponse.data.success) {
                        // Merge fetched data with our structure
                        const fetchedData = eventResponse.data.data;
                        setEventData({
                            ...emptyEventData,
                            ...fetchedData,
                            // Ensure team_assignments structure exists
                            team_assignments: {
                                ...emptyEventData.team_assignments,
                                ...(fetchedData.team_assignments || {})
                            }
                        });
                    } else {
                        throw new Error('Failed to fetch event details');
                    }
                } else {
                    // Create mode - start with empty data
                    setEventData(emptyEventData);
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

    // Unified update handler for all tab data
    const handleEventUpdate = (updates) => {
        setEventData(prev => ({
            ...prev,
            ...updates
        }));
        setUnsavedChanges(true);
    };

    // Update specific section of event data (for structured data)
    const handleSectionUpdate = (section, data) => {
        setEventData(prev => ({
            ...prev,
            [section]: data
        }));
        setUnsavedChanges(true);
    };

    // Update team assignments
    const handleTeamUpdate = (teamId, members) => {
        setEventData(prev => ({
            ...prev,
            team_assignments: {
                ...prev.team_assignments,
                [teamId]: members
            }
        }));
        setUnsavedChanges(true);
    };

    // Save event (both create and update)
    const handleSaveEvent = async () => {
        setSaving(true);

        try {
            // Validate required fields
            if (!eventData.name?.trim()) {
                showSnackbar('Event name is required', 'error');
                return;
            }

            // Prepare data for API
            const saveData = {
                ...eventData,
                // Ensure all data is included
                team_assignments: eventData.team_assignments
            };

            let response;
            if (isCreateMode) {
                response = await api.post('/core/event/create', saveData);
            } else {
                response = await api.put(`core/event/update/${eventId}`, saveData);
            }

            if (response.data.success) {
                showSnackbar(isCreateMode ? 'Event created successfully!' : 'Event updated successfully!');
                setUnsavedChanges(false);

                //setMode('view');
                setTimeout(() => {
                    navigate(`/events/all?mode=draft`);
                }, 1500);

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

    // Toggle between view and edit mode
    const toggleEditMode = () => {
        if (isViewMode) {
            setMode('edit');
        } else if (isEditMode) {
            setMode('view');
            if (unsavedChanges) {
                // Reload original data when canceling edits
                // You might want to confirm with user first
                //fetchEventData();
            }
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
        const TabComponent = currentTab.component;

        switch (currentTab.id) {
            case 'details':
                return (
                    <TabComponent
                        data={eventData}
                        onUpdate={handleEventUpdate}
                        isViewMode={isViewMode}
                        isEditMode={isEditMode}
                    />
                );

            case 'speaker':
                return (
                    <SpeakerTab
                        speakerData={{
                            speakers: eventData.speakers || [],
                            translators: eventData.translators || [],
                            presentations: eventData.presentations || []
                        }}
                        onUpdate={(fullSpeakerData) => {
                            handleSectionUpdate('speakers', fullSpeakerData.speakers);
                            handleSectionUpdate('translators', fullSpeakerData.translators);
                            handleSectionUpdate('presentations', fullSpeakerData.presentations);
                        }}
                        isViewMode={isViewMode}
                        isEditMode={isEditMode}
                    />
                );
            case 'songs':
                return (
                    <TabComponent
                        songs={eventData.songs}
                        onUpdate={(songs) => handleSectionUpdate('songs', songs)}
                        isViewMode={isViewMode}
                        isEditMode={isEditMode}
                    />
                );
            case 'singers':
            case 'music':
            case 'usher':
            case 'multimedia':
                const teamData = getTeamForTab(currentTab);
                return (
                    <TabComponent
                        key={`${currentTab.id}-${teamData?.id}`}
                        team={teamData}
                        assignedMembers={eventData.team_assignments[currentTab.teamId] || []}
                        onUpdate={(members) => handleTeamUpdate(currentTab.teamId, members)}
                        isViewMode={isViewMode}
                        isEditMode={isEditMode}
                    />
                );

            default:
                return (
                    <TabComponent
                        data={eventData}
                        onUpdate={handleEventUpdate}
                        isViewMode={isViewMode}
                        isEditMode={isEditMode}
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

                    </Box>

                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {isCreateMode ? 'Create New Event' : eventData.name || 'Untitled Event'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isCreateMode ? 'Create a new event and assign teams' :
                            isEditMode ? 'Edit event details and team assignments' :
                                'View event details'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {!isCreateMode && (
                        <Button
                            variant={isEditMode ? "outlined" : "contained"}
                            startIcon={isEditMode ? <Visibility /> : <EditIcon />}
                            onClick={toggleEditMode}
                            sx={{ minWidth: 120 }}
                        >
                            {isEditMode ? 'View Mode' : 'Edit Mode'}
                        </Button>
                    )}

                    {unsavedChanges && (
                        <Tooltip title="Unsaved Changes" color="warning" placement="left">
                            <Box>
                                <Error color="warning" fontSize="large" />
                            </Box>
                        </Tooltip>
                    )}

                    {isEditMode && (
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                            onClick={handleSaveEvent}
                            disabled={saving || !eventData?.name?.trim()}
                            sx={{ minWidth: 120 }}
                        >
                            {saving ? 'Saving...' : (isCreateMode ? 'Create Event' : 'Save Changes')}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ width: '100%', mb: 3, borderBottom: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => handleTabChange(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabConfig.map((tab) => (
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