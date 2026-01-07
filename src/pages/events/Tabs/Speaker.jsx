import { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    IconButton,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Drawer
} from "@mui/material";
import {
    Add,
    Clear,
    Person,
    Translate,
    Slideshow,
    Upload,
    Delete,
    Close,
    Search
} from "@mui/icons-material";
import api from "../../../api";

const SpeakerTab = ({
    speakerData = {},
    onUpdate,
    isViewMode,
    isEditMode
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");

    // User selection states
    const [allUsers, setAllUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectionType, setSelectionType] = useState(null); // 'speaker' or 'translator'
    const [tempSelection, setTempSelection] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Form states for Guest entries
    const [newSpeakerName, setNewSpeakerName] = useState("");
    const [newTranslatorName, setNewTranslatorName] = useState("");
    const [uploadingFile, setUploadingFile] = useState(false);

    // Destructure speakerData with defaults
    const {
        speakers = [],
        translators = [],
        presentationFiles = []
    } = speakerData;

    // Ref to track previous data
    const prevSpeakerDataRef = useRef({ speakers, translators, presentationFiles });

    const fetchAllUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await api.get('/user/getAll');
            if (response.data.success) {
                setAllUsers(response.data.data || []);
            } else {
                throw new Error('Failed to fetch users');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    // Update parent when data changes
    useEffect(() => {
        const hasChanged =
            JSON.stringify(speakers) !== JSON.stringify(prevSpeakerDataRef.current.speakers) ||
            JSON.stringify(translators) !== JSON.stringify(prevSpeakerDataRef.current.translators) ||
            JSON.stringify(presentationFiles) !== JSON.stringify(prevSpeakerDataRef.current.presentationFiles);

        if (hasChanged) {
            onUpdate({
                speakers,
                translators,
                presentationFiles
            });
            prevSpeakerDataRef.current = { speakers, translators, presentationFiles };
        }
    }, [speakers, translators, presentationFiles, onUpdate]);

    // Open drawer for user selection
    const openUserSelectionDrawer = useCallback((type) => {
        if (!isEditMode) return;
        fetchAllUsers();

        setSelectionType(type);
        if (type === 'speaker') {
            setTempSelection(speakers.filter(s => s.type === 'user').map(s => s.userId));
        } else {
            setTempSelection(translators.filter(t => t.type === 'user').map(t => t.userId));
        }
        setDrawerOpen(true);
    }, [speakers, translators, isEditMode]);

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectionType(null);
        setTempSelection([]);
        setSearchTerm("");
    };

    const saveUserSelection = useCallback(() => {
        const selectedUsers = allUsers.filter(user =>
            tempSelection.includes(user.id)
        );

        const newEntries = selectedUsers.map(user => ({
            id: `${user.id}-${Date.now()}`,
            type: 'user',
            name: user.name,
            userId: user.id,
            email: user.email,
            addedAt: new Date().toISOString()
        }));

        if (selectionType === 'speaker') {
            const existingGuestSpeakers = speakers.filter(s => s.type === 'name');
            const existingUserSpeakers = speakers.filter(s => s.type === 'user');
            const updatedSpeakers = [...existingGuestSpeakers, ...newEntries];

            onUpdate({
                speakers: updatedSpeakers,
                translators,
                presentationFiles
            });
        } else {
            const existingGuestTranslators = translators.filter(t => t.type === 'name');
            const existingUserTranslators = translators.filter(t => t.type === 'user');

            const updatedTranslators = [...existingGuestTranslators, ...newEntries];

            onUpdate({
                speakers,
                translators: updatedTranslators,
                presentationFiles
            });
        }

        setSuccess(`${selectionType === 'speaker' ? 'Speakers' : 'Translators'} updated successfully`);
        closeDrawer();
    }, [allUsers, tempSelection, selectionType, speakers, translators, presentationFiles, onUpdate]);

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
        const filteredUsers = getFilteredUsers();
        if (tempSelection.length === filteredUsers.length) {
            setTempSelection([]);
        } else {
            setTempSelection(filteredUsers.map(user => user.id));
        }
    };

    // Get filtered users based on search
    const getFilteredUsers = () => {
        if (!searchTerm.trim()) return allUsers;
        return allUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Add Guest speaker
    const handleAddGuestSpeaker = useCallback(() => {
        if (!newSpeakerName.trim()) {
            setError('Please enter speaker name');
            return;
        }

        const speaker = {
            id: Date.now().toString(),
            type: 'guest',
            name: newSpeakerName,
            userId: null,
            addedAt: new Date().toISOString()
        };

        const updatedSpeakers = [...speakers, speaker];
        prevSpeakerDataRef.current.speakers = updatedSpeakers;

        onUpdate({
            speakers: updatedSpeakers,
            translators,
            presentationFiles
        });

        setNewSpeakerName("");
        setSuccess('Speaker added successfully');
    }, [newSpeakerName, speakers, translators, presentationFiles, onUpdate]);

    // Add Guest translator
    const handleAddGuestTranslator = useCallback(() => {
        if (!newTranslatorName.trim()) {
            setError('Please enter translator name');
            return;
        }

        const translator = {
            id: Date.now().toString(),
            type: 'guest',
            name: newTranslatorName,
            userId: null,
            addedAt: new Date().toISOString()
        };

        const updatedTranslators = [...translators, translator];
        prevSpeakerDataRef.current.translators = updatedTranslators;

        onUpdate({
            speakers,
            translators: updatedTranslators,
            presentationFiles
        });

        setNewTranslatorName("");
        setSuccess('Translator added successfully');
    }, [newTranslatorName, speakers, translators, presentationFiles, onUpdate]);

    // Remove speaker
    const handleRemoveSpeaker = useCallback((speakerId) => {
        const updatedSpeakers = speakers.filter(s => s.id !== speakerId);
        prevSpeakerDataRef.current.speakers = updatedSpeakers;

        onUpdate({
            speakers: updatedSpeakers,
            translators,
            presentationFiles
        });

        setSuccess('Speaker removed');
    }, [speakers, translators, presentationFiles, onUpdate]);

    // Remove translator
    const handleRemoveTranslator = useCallback((translatorId) => {
        const updatedTranslators = translators.filter(t => t.id !== translatorId);
        prevSpeakerDataRef.current.translators = updatedTranslators;

        onUpdate({
            speakers,
            translators: updatedTranslators,
            presentationFiles
        });

        setSuccess('Translator removed');
    }, [speakers, translators, presentationFiles, onUpdate]);

    // Handle file upload
    const handleFileUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['.ppt', '.pptx', '.pdf', '.key'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
            setError('Please upload a presentation file (PPT, PPTX, PDF, KEY)');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setUploadingFile(true);
        try {
            // Simulate file upload
            setTimeout(() => {
                const newFile = {
                    id: Date.now().toString(),
                    name: file.name,
                    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                    type: fileExtension,
                    url: 'https://example.com/presentation.pdf',
                    uploadedAt: new Date().toISOString()
                };

                const updatedFiles = [...presentationFiles, newFile];
                prevSpeakerDataRef.current.presentationFiles = updatedFiles;

                onUpdate({
                    speakers,
                    translators,
                    presentationFiles: updatedFiles
                });

                setUploadingFile(false);
                setSuccess('Presentation file uploaded successfully');
            }, 1000);

        } catch (err) {
            setError('Failed to upload file');
            setUploadingFile(false);
        }
    }, [presentationFiles, speakers, translators, onUpdate]);

    // Remove presentation file
    const handleRemoveFile = useCallback((fileId) => {
        const updatedFiles = presentationFiles.filter(f => f.id !== fileId);
        prevSpeakerDataRef.current.presentationFiles = updatedFiles;

        onUpdate({
            speakers,
            translators,
            presentationFiles: updatedFiles
        });

        setSuccess('File removed');
    }, [presentationFiles, speakers, translators, onUpdate]);

    // Clear messages
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ px: 3, width: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="600">
                    Speakers & Presentation
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

            {/* Success/Error Messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* View mode info */}
            {isViewMode && speakers.length === 0 && translators.length === 0 && presentationFiles.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No speakers, translators, or presentations added for this event.
                </Alert>
            )}

            <Grid container spacing={3} sx={{ gap: 3, width: '100%', minHeight: '400px' }}>
                {/* Speakers Section */}
                <Grid item size={{ lg: 6, md: 6, xs: 12 }}>
                    {/* <Grid item size={{ lg: 4, md: 6, xs: 12 }}> */}
                    <Card sx={{
                        height: '100%',
                        backgroundColor: 'background.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        opacity: isViewMode ? 0.9 : 1
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Person color="primary" />
                                <Typography variant="h6">
                                    Speakers ({speakers.length})
                                </Typography>
                            </Box>

                            {/* User Selection Button - Only in edit mode */}
                            {isEditMode && (
                                <>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Person />}
                                        onClick={() => openUserSelectionDrawer('speaker')}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                    >
                                        Select Users as Speakers
                                    </Button>

                                    {/* Guest Speaker Input */}
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <TextField
                                            label="Add Guest Speaker"
                                            value={newSpeakerName}
                                            onChange={(e) => setNewSpeakerName(e.target.value)}
                                            fullWidth
                                            placeholder="Enter speaker name"
                                            size="small"
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleAddGuestSpeaker}
                                            disabled={!newSpeakerName.trim()}
                                            sx={{ minWidth: 'auto' }}
                                        >
                                            <Add />
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {/* Speakers List */}
                            {speakers.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography color="text.secondary">
                                        {isViewMode ? 'No speakers assigned' : 'No speakers added yet'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                    {speakers.map((speaker) => (
                                        <Paper key={speaker.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {speaker.name}
                                                    </Typography>
                                                    <Chip
                                                        label={speaker.type === 'user' ? 'User' : 'Guest'}
                                                        size="small"
                                                        color={speaker.type === 'user' ? 'primary' : 'secondary'}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                                {isEditMode && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveSpeaker(speaker.id)}
                                                        color="error"
                                                    >
                                                        <Clear fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Translators Section */}
                <Grid item size={{ lg: 6, md: 6, xs: 12 }}>
                    {/* <Grid item size={{ lg: 4, md: 6, xs: 12 }}> */}
                    <Card sx={{
                        height: '100%',
                        backgroundColor: 'background.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        opacity: isViewMode ? 0.9 : 1
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Translate color="primary" />
                                <Typography variant="h6">
                                    Translators ({translators.length})
                                </Typography>
                            </Box>

                            {/* User Selection Button - Only in edit mode */}
                            {isEditMode && (
                                <>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Translate />}
                                        onClick={() => openUserSelectionDrawer('translator')}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                    >
                                        Select Users as Translators
                                    </Button>

                                    {/* Guest Translator Input */}
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <TextField
                                            label="Add Guest Translator"
                                            value={newTranslatorName}
                                            onChange={(e) => setNewTranslatorName(e.target.value)}
                                            fullWidth
                                            placeholder="Enter translator name"
                                            size="small"
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleAddGuestTranslator}
                                            disabled={!newTranslatorName.trim()}
                                            sx={{ minWidth: 'auto' }}
                                        >
                                            <Add />
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {/* Translators List */}
                            {translators.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Translate sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography color="text.secondary">
                                        {isViewMode ? 'No translators assigned' : 'No translators added yet'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                    {translators.map((translator) => (
                                        <Paper key={translator.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {translator.name}
                                                    </Typography>
                                                    <Chip
                                                        label={translator.type === 'user' ? 'User' : 'Guest'}
                                                        size="small"
                                                        color={translator.type === 'user' ? 'primary' : 'secondary'}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                                {isEditMode && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveTranslator(translator.id)}
                                                        color="error"
                                                    >
                                                        <Clear fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Presentation Files Section */}
                {/* <Grid item size={{ lg: 4, md: 12, xs: 12 }}>
                    <Card sx={{
                        height: '100%',
                        backgroundColor: 'background.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        opacity: isViewMode ? 0.9 : 1
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Slideshow color="primary" />
                                <Typography variant="h6">
                                    Presentation Files ({presentationFiles.length})
                                </Typography>
                            </Box>

                            {isEditMode && (
                                <Box sx={{ mb: 3 }}>
                                    <input
                                        type="file"
                                        id="presentation-upload"
                                        accept=".ppt,.pptx,.pdf,.key"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={uploadingFile ? <CircularProgress size={20} /> : <Upload />}
                                        onClick={() => document.getElementById('presentation-upload').click()}
                                        disabled={uploadingFile}
                                        fullWidth
                                    >
                                        {uploadingFile ? 'Uploading...' : 'Upload Presentation File'}
                                    </Button>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Supported formats: PPT, PPTX, PDF, KEY (Max 50MB)
                                    </Typography>
                                </Box>
                            )}

                            {presentationFiles.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3, mt: isEditMode ? 6 : 3 }}>
                                    <Slideshow sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography color="text.secondary">
                                        {isViewMode ? 'No presentation files' : 'No presentation files uploaded yet'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {presentationFiles.map((file) => (
                                        <Grid item xs={12} sm={6} md={4} key={file.id}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box>
                                                            <Typography variant="subtitle2" noWrap>
                                                                {file.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {file.size} • {file.type.toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                        {isEditMode && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRemoveFile(file.id)}
                                                                color="error"
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Slideshow />}
                                                        sx={{ mt: 1 }}
                                                        href={file.url}
                                                        target="_blank"
                                                    >
                                                        View File
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid> */}
            </Grid>

            {/* User Selection Drawer - Only in edit mode */}
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
                            <Typography variant="h6">
                                Select {selectionType === 'speaker' ? 'Speakers' : 'Translators'}
                            </Typography>
                            <IconButton onClick={closeDrawer}>
                                <Close />
                            </IconButton>
                        </Box>

                        {/* Search */}
                        <TextField
                            fullWidth
                            placeholder="Search users by name or email..."
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
                            disabled={usersLoading}
                        >
                            {tempSelection.length === getFilteredUsers().length ? 'Deselect All' : 'Select All'}
                        </Button>

                        {/* Users List */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {usersLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <List>
                                    {getFilteredUsers().map((user) => {
                                        const isSelected = tempSelection.includes(user.id);
                                        return (
                                            <ListItem
                                                key={user.id}
                                                dense
                                                button
                                                onClick={() => handleTempSelectionToggle(user.id)}
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
                                                    primary={user.name}
                                                    secondary={user.email}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                    {getFilteredUsers().length === 0 && (
                                        <ListItem>
                                            <ListItemText
                                                primary="No users found"
                                                secondary="Try adjusting your search terms"
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            )}
                        </Box>

                        {/* Footer Actions */}
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button
                                variant="contained"
                                onClick={saveUserSelection}
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

export default SpeakerTab;