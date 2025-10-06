import {
    Box,
    Typography,
    Chip,
    Avatar,
    Stack,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Snackbar,
    Alert,
    OutlinedInput,
    Checkbox,
    ListItemText,
    TextField
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Email,
    Phone,
    LocationOn,
    Person,
    AccessTime,
    CalendarToday,
    CheckCircle,
    Cancel,
    Edit as EditIcon,
    Group,
    MusicNote,
    Badge,
    BusinessCenter,
    Notes,
    Circle,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../api';
import LastSeenLabel from '../../components/LastSeenLabel';
import { useUserStore } from '../../store/userStore';
import { useNavigate } from 'react-router-dom';


export default function MemberDetail() {
    const { id, teamId } = useParams();
    const [memberData, setMemberData] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [currentUserTeamRole, setCurrentUserTeamRole] = useState('');
    const [teamRoleDialogOpen, setTeamRoleDialogOpen] = useState(false);
    const [positionDialogOpen, setPositionDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [createPositionDialogOpen, setCreatePositionDialogOpen] = useState(false);
    const [deletePositionDialogOpen, setDeletePositionDialogOpen] = useState(false);
    const [selectedTeamRole, setSelectedTeamRole] = useState('');
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(true);
    const [noteText, setNoteText] = useState('');
    const [newPositionLabel, setNewPositionLabel] = useState('');
    const [positionToDelete, setPositionToDelete] = useState(null);
    const [availablePositions, setAvailablePositions] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        // Pull from Zustand store
        const { roleName, teamRole } = useUserStore.getState().user || {};

        setCurrentUserRole(roleName || '');
        setCurrentUserTeamRole(teamRole || '');

        fetchMemberData();
        fetchAvailablePositions();
    }, [id]);


    const canEdit = () => {
        return currentUserRole === 'admin' ||
            currentUserRole === 'master' ||
            currentUserTeamRole === 'leader' ||
            currentUserTeamRole === 'admin';
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchMemberData = async () => {
        try {
            setLoading(true);
            const response = await api.post(`/team/getMemberDetail`, {
                teamId: teamId,
                userId: id,
            });

            // Handle nested response structure
            const outerData = response.data.data;
            const userData = outerData.data;
            const teamContext = outerData.teamContext;

            // Combine user data with team context
            const combinedData = {
                // User data
                id: userData.id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                phone_number: userData.phone_number,
                address: userData.address,
                city: userData.city,
                province: userData.province,
                postal_code: userData.postal_code,
                last_login: userData.last_login,
                is_active: userData.is_active,
                create_at: userData.create_at,
                update_at: userData.update_at,
                role_name: userData.role_name,

                // Team context data
                team_role: teamContext.role,
                team_join_date: teamContext.joined_at,
                positions: teamContext.positions || [], // Array of position objects
                team_note: teamContext.note,

                // Additional fields that might be needed
                team_id: teamContext.team_id,
                team_member_id: teamContext.id,
                team_is_active: teamContext.is_active
            };

            setMemberData(combinedData);
            setSelectedTeamRole(teamContext.role || 'member');
            // Handle positions - extract IDs from position objects
            setSelectedPositions(teamContext.positions ? teamContext.positions.map(pos => pos.id) : []);
            setSelectedStatus(teamContext.is_active);
            setNoteText(teamContext.note || '');
        } catch (error) {
            console.error('Error fetching member details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailablePositions = async () => {
        try {
            const response = await api.post('/team/getAllPositions', {
                teamId: teamId
            });
            // Handle the nested response structure
            const positions = response.data.data || [];
            setAvailablePositions(positions);
        } catch (error) {
            console.error('Error fetching positions:', error);
            setAvailablePositions([]);
        }
    };

    const handleSetTeamRole = async () => {
        try {
            await api.post(`/team/setMemberDetail`, {
                teamId: teamId,
                id: id,
                role: selectedTeamRole
            });
            setTeamRoleDialogOpen(false);
            showSnackbar('Team role updated successfully');
            await fetchMemberData();
        } catch (error) {
            console.error('Error updating team role:', error);
            showSnackbar('Failed to update team role', 'error');
        }
    };

    const handleSetPositions = async () => {
        try {
            await api.post(`/team/setMemberDetail`, {
                teamId: teamId,
                id: id,
                position_ids: selectedPositions.length > 0 ? selectedPositions : []
            });
            setPositionDialogOpen(false);
            showSnackbar('Positions updated successfully');
            await fetchMemberData();
        } catch (error) {
            console.error('Error updating positions:', error);
            showSnackbar('Failed to update positions', 'error');
        }
    };

    const handleSetStatus = async () => {
        try {
            await api.post(`/team/setMemberDetail`, {
                teamId: teamId,
                id: id,
                is_active: selectedStatus
            });
            setStatusDialogOpen(false);
            showSnackbar('Member status updated successfully');
            await fetchMemberData();
        } catch (error) {
            console.error('Error updating member status:', error);
            showSnackbar('Failed to update member status', 'error');
        }
    };

    const handleSetNote = async () => {
        try {
            await api.post(`/team/setMemberDetail`, {
                teamId: teamId,
                id: id,
                note: noteText
            });
            setNoteDialogOpen(false);
            showSnackbar('Note updated successfully');
            await fetchMemberData();
        } catch (error) {
            console.error('Error updating note:', error);
            showSnackbar('Failed to update note', 'error');
        }
    };

    const navigate = useNavigate();

    const handleRemoveMember = async () => {
        try {
            await api.post(`/team/removeMemberFromTeam`, {
                teamId: teamId,
                userId: id
            });
            setRemoveDialogOpen(false);
            showSnackbar('Member removed successfully');
            navigate(`/teams/worship`);
        } catch (err) {
            console.error('Error removing member:', err);
            showSnackbar('Failed to remove member', 'error');
        }
    }

    const handleCreatePosition = async () => {
        if (!newPositionLabel.trim()) {
            showSnackbar('Position label cannot be empty', 'error');
            return;
        }

        try {
            await api.post('/team/createPosition', {
                teamId: teamId,
                label: newPositionLabel.trim()
            });
            setCreatePositionDialogOpen(false);
            setNewPositionLabel('');
            showSnackbar('Position created successfully');
            await fetchAvailablePositions();
        } catch (error) {
            console.error('Error creating position:', error);
            showSnackbar('Failed to create position', 'error');
        }
    };

    const handleDeletePosition = async () => {
        if (!positionToDelete) return;

        try {
            const res = await api.delete(`/team/deletePosition/${positionToDelete.id}`);
            setDeletePositionDialogOpen(false);
            setPositionToDelete(null);
            showSnackbar('Position deleted successfully');
            await fetchAvailablePositions();
            await fetchMemberData();
        } catch (err) {
            console.error("Failed to add members:", err);

            // Try to pull message from backend response first
            const backendMessage = err.response?.data?.message;

            showSnackbar(
                backendMessage || err.message || 'Something went wrong',
                'error'
            );
        }
    }

    const openDeletePositionDialog = (position) => {
        setPositionToDelete(position);
        setDeletePositionDialogOpen(true);
    };

    const DataRow = ({ icon, label, value, isDate = false, showRelativeTime = false, onEdit = null, showEdit = false, isPositionArray = false }) => (
        <Box sx={{
            display: 'flex',
            alignItems: 'canter',
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
        }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                width: 32,
                height: 32,
                mr: 3,
                color: 'grey.600'
            }}>
                {icon}
            </Box>

            <Box sx={{ minWidth: 140, mr: 30 }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        pt: 1,
                        fontSize: '0.75rem',
                        letterSpacing: 0.5
                    }}
                >
                    {label}
                </Typography>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, pt: 0.5 }}>
                    {isDate && showRelativeTime && value ? (
                        <LastSeenLabel date={value} />
                    ) : isPositionArray && Array.isArray(value) ? (
                        value.length > 0 ? (
                            <Box>
                                {value.map((position, index) => (
                                    <Box key={position.id || index} sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: index < value.length - 1 ? 1 : 0
                                    }}>
                                        <Circle sx={{
                                            fontSize: 6,
                                            color: 'grey.500',
                                            mr: 2
                                        }} />
                                        <Typography>
                                            {position.label || position.name || position}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: 500,
                                    color: 'text.disabled'
                                }}
                            >
                                No positions assigned
                            </Typography>
                        )
                    ) : (
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 500,
                                color: value ? 'text.primary' : 'text.disabled'
                            }}
                        >
                            {value || '—'}
                        </Typography>
                    )}
                </Box>

                {showEdit && canEdit() && (
                    <IconButton
                        size="small"
                        onClick={onEdit}
                        sx={{
                            ml: 2,
                            color: 'primary.main',
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    );

    const SectionHeader = ({ title }) => (
        <Typography
            variant="h6"
            sx={{
                fontWeight: 700,
                mb: 3,
                mt: 5,
                color: 'text.primary',
                '&:first-of-type': { mt: 0 }
            }}
        >
            {title}
        </Typography>
    );

    const TeamRoleLabel = ({ role }) => {
        const formattedRole = role
            ? role.charAt(0).toUpperCase() + role.slice(1)
            : 'Member';
        return formattedRole;
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Helper function to open position dialog with current selections
    const openPositionDialog = () => {
        setSelectedPositions(memberData.positions ? memberData.positions.map(pos => pos.id) : []);
        setPositionDialogOpen(true);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    Loading member details...
                </Typography>
            </Box>
        );
    }

    // No member found
    if (!memberData.id) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography variant="body1" color="text.secondary">
                    No member found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, px: 5 }}>
            {/* Member Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 5,
                pb: 4,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                        {memberData.first_name} {memberData.last_name}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Typography variant="h6" color="primary.main">
                                <TeamRoleLabel role={memberData.team_role} />
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Member ID: {memberData.id}
                            </Typography>
                        </Stack>
                        <Button
                            variant="contained"
                            onClick={() => setRemoveDialogOpen(true)}
                        >Remove</Button>
                    </Box>
                </Box>
            </Box>

            {/* Team Context */}
            <SectionHeader title="Team Context" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<Group fontSize="small" />}
                    label="Team"
                    value={memberData.team_id}
                />
                <DataRow
                    icon={<Badge fontSize="small" />}
                    label="Team Role"
                    value={<TeamRoleLabel role={memberData.team_role} />}
                    showEdit={true}
                    onEdit={() => setTeamRoleDialogOpen(true)}
                />
                <DataRow
                    icon={<MusicNote fontSize="small" />}
                    label="Positions"
                    value={memberData.positions}
                    isPositionArray={true}
                    showEdit={true}
                    onEdit={openPositionDialog}
                />
                <DataRow
                    icon={memberData.team_is_active ?
                        <CheckCircle fontSize="small" /> :
                        <Cancel fontSize="small" />
                    }
                    label="Team Status"
                    value={memberData.team_is_active ? 'Active' : 'Inactive'}
                    showEdit={true}
                    onEdit={() => setStatusDialogOpen(true)}
                />
                <DataRow
                    icon={<Notes fontSize="small" />}
                    label="Team Note"
                    value={memberData.team_note || 'No notes'}
                    showEdit={true}
                    onEdit={() => setNoteDialogOpen(true)}
                />
                <DataRow
                    icon={<CalendarToday fontSize="small" />}
                    label="Joined Team"
                    value={formatDate(memberData.team_join_date)}
                />
            </Box>

            {/* Contact Information */}
            <SectionHeader title="Contact Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<Email fontSize="small" />}
                    label="Email Address"
                    value={memberData.email}
                />
                <DataRow
                    icon={<Phone fontSize="small" />}
                    label="Phone Number"
                    value={memberData.phone_number}
                />
            </Box>

            {/* Address Information */}
            <SectionHeader title="Address Information" />
            <Box sx={{ mb: 1 }}>
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Address"
                    value={memberData.address}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="City"
                    value={memberData.city}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Province"
                    value={memberData.province}
                />
                <DataRow
                    icon={<LocationOn fontSize="small" />}
                    label="Postal Code"
                    value={memberData.postal_code}
                />
            </Box>

            {/* Account Information */}
            <SectionHeader title="Account Information" />
            <Box>
                <DataRow
                    icon={<Person fontSize="small" />}
                    label="System Role"
                    value={memberData.role_name?.charAt(0).toUpperCase() + memberData.role_name?.slice(1) || 'User'}
                />
                <DataRow
                    icon={memberData.is_active ?
                        <CheckCircle fontSize="small" /> :
                        <Cancel fontSize="small" />
                    }
                    label="Account Status"
                    value={memberData.is_active ? 'Active' : 'Inactive'}
                />
                <DataRow
                    icon={<AccessTime fontSize="small" />}
                    label="Last Login"
                    value={memberData.last_login}
                    isDate={true}
                    showRelativeTime={true}
                />
                <DataRow
                    icon={<CalendarToday fontSize="small" />}
                    label="Account Created"
                    value={formatDate(memberData.create_at)}
                />
                <DataRow
                    icon={<CalendarToday fontSize="small" />}
                    label="Last Updated"
                    value={formatDate(memberData.update_at)}
                />
            </Box>

            {/* Team Role Edit Dialog */}
            <Dialog open={teamRoleDialogOpen} onClose={() => setTeamRoleDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Team Role</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Team Role</InputLabel>
                        <Select
                            value={selectedTeamRole}
                            onChange={(e) => setSelectedTeamRole(e.target.value)}
                            label="Team Role"
                        >
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="leader">Leader</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTeamRoleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetTeamRole} variant="contained">Update Role</Button>
                </DialogActions>
            </Dialog>

            {/* Position Edit Dialog */}
            <Dialog open={positionDialogOpen} onClose={() => setPositionDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Positions</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Available Positions
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setCreatePositionDialogOpen(true)}
                            disabled={!canEdit()}
                        >
                            Create Position
                        </Button>
                    </Box>
                    <FormControl fullWidth>
                        <InputLabel>Positions</InputLabel>
                        <Select
                            multiple
                            value={selectedPositions}
                            onChange={(e) => setSelectedPositions(e.target.value)}
                            input={<OutlinedInput label="Positions" />}
                            renderValue={(selected) => {
                                if (selected.length === 0) return <em>No Positions</em>;
                                const labels = selected.map(id => {
                                    const pos = availablePositions.find(p => p.id === id);
                                    return pos ? pos.label : id;
                                });
                                return labels.join(', ');
                            }}
                        >
                            {availablePositions.map((position) => (
                                <MenuItem key={position.id} value={position.id}>
                                    <Checkbox checked={selectedPositions.indexOf(position.id) > -1} />
                                    <ListItemText
                                        primary={position.label}
                                    />
                                    {canEdit() && (
                                        <IconButton
                                            size="small"
                                            edge="end"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDeletePositionDialog(position);
                                            }}
                                            sx={{ ml: 1 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Select one or more positions that this member can fulfill in the team.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPositionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetPositions} variant="contained">Update Positions</Button>
                </DialogActions>
            </Dialog>

            {/* Status Edit Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Team Status</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        sx={{ mt: 2 }}
                        control={
                            <Switch
                                checked={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={selectedStatus ? 'Active in Team' : 'Inactive in Team'}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {selectedStatus
                            ? 'This member is currently active in the team and can participate in team activities.'
                            : 'This member will be inactive in the team and won\'t be able to participate in team activities.'
                        }
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetStatus} variant="contained">Update Status</Button>
                </DialogActions>
            </Dialog>

            {/* Note Edit Dialog */}
            <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Team Note</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Team Note"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Add any notes or comments about this member's role or responsibilities in the team.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSetNote} variant="contained">Update Note</Button>
                </DialogActions>
            </Dialog>

            {/* Remove Member Dialog */}
            <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle color="primary.main">Remove Member</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to remove {memberData.first_name} {memberData.last_name} from this team?</Typography>
                </DialogContent>
                <DialogActions sx={{ mt: 5 }}>
                    <Button onClick={() => setRemoveDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleRemoveMember} variant="contained">
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Position Dialog */}
            <Dialog open={createPositionDialogOpen} onClose={() => setCreatePositionDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Position</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Position Label"
                        fullWidth
                        variant="outlined"
                        value={newPositionLabel}
                        onChange={(e) => setNewPositionLabel(e.target.value)}
                        sx={{ mt: 2 }}
                        placeholder="e.g., Percussionist, Vocalist, Sound Engineer"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Enter a name for the new position. This will be available for all team members.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setCreatePositionDialogOpen(false);
                        setNewPositionLabel('');
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreatePosition} variant="contained">
                        Create Position
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Position Dialog */}
            <Dialog open={deletePositionDialogOpen} onClose={() => setDeletePositionDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle color="error.main">Delete Position</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the position "{positionToDelete?.label}"?
                        This will remove it from all members who have this position assigned.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ mt: 2 }}>
                    <Button onClick={() => {
                        setDeletePositionDialogOpen(false);
                        setPositionToDelete(null);
                    }} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleDeletePosition} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box >
    );
}