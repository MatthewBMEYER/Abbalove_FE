import { useState, useEffect } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from "@mui/material";
import {
    Add,
    Clear,
    DragHandle,
    MusicNote
} from "@mui/icons-material";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTableRow = ({ song, onRemove, disabled }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: song.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            sx={{
                '&:hover': {
                    backgroundColor: 'action.hover'
                }
            }}
        >
            <TableCell>
                {!disabled && (
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.secondary',
                            '&:hover': {
                                color: 'text.primary'
                            }
                        }}
                    >
                        <DragHandle />
                    </Box>
                )}
                {disabled && (
                    <Typography variant="body1" fontWeight="medium">
                        {song.order}
                    </Typography>
                )}
            </TableCell>
            {/* Song Title */}
            <TableCell>
                <Typography variant="body1">
                    {song.title}
                </Typography>
            </TableCell>

            {/* Actions */}
            <TableCell>
                {!disabled && (
                    <IconButton
                        size="small"
                        onClick={() => onRemove(song.id)}
                        color="error"
                    >
                        <Clear fontSize="small" />
                    </IconButton>
                )}
            </TableCell>
        </TableRow>
    );
};

const SongTab = ({ songs = [], onUpdate, isViewMode, isEditMode }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");
    const [newSongTitle, setNewSongTitle] = useState("");
    const handleAddSong = () => {
        if (!newSongTitle.trim()) {
            setError('Please enter song title');
            return;
        }

        const newSong = {
            id: Date.now().toString(),
            title: newSongTitle.trim(),
            order: songs.length + 1
        };

        const updatedSongs = [...songs, newSong];
        onUpdate(updatedSongs);
        setNewSongTitle("");
        setSuccess('Song added successfully');
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleRemoveSong = (songId) => {
        const updatedSongs = songs
            .filter(song => song.id !== songId)
            .map((song, index) => ({ ...song, order: index + 1 }));

        onUpdate(updatedSongs);
        setSuccess('Song removed');
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = songs.findIndex((song) => song.id === active.id);
            const newIndex = songs.findIndex((song) => song.id === over.id);

            const reorderedSongs = arrayMove(songs, oldIndex, newIndex);

            const updatedSongs = reorderedSongs.map((song, index) => ({
                ...song,
                order: index + 1
            }));

            onUpdate(updatedSongs);
            setSuccess('Songs reordered successfully');
        }
    };

    return (
        <Box sx={{ px: 3, width: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="600">
                    Worship Songs
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

            {isViewMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Viewing song list. Switch to edit mode to make changes.
                </Alert>
            )}

            {isEditMode && (
                <Alert severity="info" sx={{ mb: 2, width: '100%', color: 'text.secondary', textAlign: 'center', alignItems: 'center' }}>
                    Drag the <DragHandle sx={{ fontSize: 16, verticalAlign: 'middle', mx: 1 }} /> icon to reorder the songs.
                </Alert>
            )}

            {isEditMode && (
                <Card sx={{ backgroundColor: 'background.main', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <TextField
                                label="Song Title"
                                value={newSongTitle}
                                onChange={(e) => setNewSongTitle(e.target.value)}
                                fullWidth
                                placeholder="Enter song title (e.g., Amazing Grace)"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddSong();
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleAddSong}
                                disabled={!newSongTitle.trim()}
                                sx={{ minWidth: '120px' }}
                            >
                                Add Song
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Card sx={{ backgroundColor: 'background.main', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                    {songs.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <MusicNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {isEditMode ? 'No Songs Added' : 'No Songs'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isEditMode
                                    ? 'Add worship songs to create your service order'
                                    : 'No songs have been added for this event'
                                }
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            {isEditMode ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <Table sx={{ minWidth: 650 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ width: 80, fontWeight: 'bold' }}>Order</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Song Title</TableCell>
                                                <TableCell sx={{ width: 100, fontWeight: 'bold' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <SortableContext items={songs.map(song => song.id)} strategy={verticalListSortingStrategy}>
                                                {songs.map((song) => (
                                                    <SortableTableRow
                                                        key={song.id}
                                                        song={song}
                                                        onRemove={handleRemoveSong}
                                                        disabled={!isEditMode}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </DndContext>
                            ) : (
                                // View mode table (non-draggable)
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 80, fontWeight: 'bold' }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Song Title</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {songs.map((song) => (
                                            <TableRow key={song.id}>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        {song.order}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1">
                                                        {song.title}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default SongTab