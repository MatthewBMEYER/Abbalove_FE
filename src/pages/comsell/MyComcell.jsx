import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    LinearProgress,
    IconButton,
    Stack,
    Alert
} from '@mui/material';
import {
    Groups as GroupsIcon,
    Event as EventIcon,
    LocationOn as LocationIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Settings as SettingsIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon
} from '@mui/icons-material';
import { useUserStore } from '../../store/userStore';
import ComcellGroupDetails from './ComcellGroupDetail';
import api from '../../api';

const MyComcell = () => {
    const [userGroup, setUserGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [allMembersStats, setAllMembersStats] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [error, setError] = useState(null);

    // Get user from store
    const { user } = useUserStore((state) => state);

    useEffect(() => {
        if (user?.id) {
            fetchUserComcellData();
        }
    }, [user]);

    const fetchUserComcellData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch user's comcell group
            const userComcellRes = await api.get(`/comcell/getComcellFromUserId/${user.id}`);

            if (userComcellRes.data.success && userComcellRes.data.data) {
                const groupData = userComcellRes.data.data;
                setUserGroup(groupData);

                // Fetch additional data in parallel
                await Promise.all([
                    fetchAttendanceStats(groupData.id),
                    fetchUpcomingEvents(groupData.id)
                ]);
            } else {
                // User is not in any comcell group
                setUserGroup(null);
            }
        } catch (err) {
            console.error('Failed to fetch user comcell data:', err);
            setError(userComcellRes.data.massage || 'Failed to load your comcell information');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceStats = async (groupId) => {
        try {
            const res = await api.get(`/events/getAttendanceStats/${groupId}`);
            if (res.data.success) {
                // Store all members stats
                setAllMembersStats(res.data.data || []);

                // Find current user's stats from the array
                const userStats = res.data.data.find(stat => stat.userId === user.id);
                setAttendanceStats(userStats || null);
            }
        } catch (err) {
            console.error('Failed to fetch attendance stats:', err);
        }
    };

    const fetchUpcomingEvents = async (groupId) => {
        try {
            const res = await api.get(`/events/getAllEventByGroupId/${groupId}`);
            if (res.data.success && res.data.data) {
                // Filter for upcoming events (today and future)
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const upcomingEvents = res.data.data
                    .filter(event => {
                        const eventDate = new Date(event.start_time);
                        return eventDate >= today;
                    })
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                    .slice(0, 3); // Limit to 3 events

                setUpcomingEvents(upcomingEvents);
            }
        } catch (err) {
            console.error('Failed to fetch upcoming events:', err);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleGroupDataChange = (newGroupData) => {
        // Update local group data when ComcellGroupDetails changes
        setUserGroup(prev => ({ ...prev, ...newGroupData }));
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 2
                }}
            >
                <LinearProgress sx={{ width: 200 }} />
                <Typography color="text.secondary">Loading your comcell...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    gap: 2
                }}
            >
                <Alert severity="error" sx={{ maxWidth: 400 }}>
                    {error}
                </Alert>
                <Button
                    variant="outlined"
                    onClick={fetchUserComcellData}
                    startIcon={<TrendingUpIcon />}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    if (!userGroup) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    gap: 3
                }}
            >
                <GroupsIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                    No Comcell Group
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    You're not currently assigned to any comcell group.
                </Typography>
            </Box>
        );
    }

    const isLeaderOrCoLeader = userGroup.user_role === 'leader' || userGroup.user_role === 'co-leader';
    const isAdminOrMaster = user?.mainRole === 'admin' || user?.mainRole === 'master';
    const canViewAllStats = isAdminOrMaster || isLeaderOrCoLeader;

    return (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2
                }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" fontWeight="600" gutterBottom>
                            {userGroup.name}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                label={userGroup.category}
                                size="small"
                                sx={{
                                    bgcolor: 'primary.main',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    fontWeight: '400',
                                    color: 'white'
                                }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <GroupsIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {userGroup.member_count} members
                                </Typography>
                            </Box>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: { xs: '100%', md: '70%' } }}>
                            {userGroup.description}
                        </Typography>
                    </Box>
                    {isLeaderOrCoLeader && (
                        <IconButton sx={{ color: 'text.secondary' }}>
                            <SettingsIcon />
                        </IconButton>
                    )}
                </Box>
                <Divider />
            </Box >

            {/* Attendance Stats and Upcoming Events Section */}
            < Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Attendance Stats Card */}
                <Card sx={{ minWidth: 300, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TrendingUpIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="h6" fontWeight="600">
                                My Attendance
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', mb: 3, flex: 1 }}>
                            <Typography variant="h2" fontWeight="400" color="primary.main">
                                {attendanceStats?.percentage || 0}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {attendanceStats?.attended || 0} of {attendanceStats?.total_events || 0} events
                            </Typography>
                        </Box>

                        <LinearProgress
                            variant="determinate"
                            value={attendanceStats?.percentage || 0}
                            sx={{
                                mb: 2,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'divider',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: 'primary.main'
                                }
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {attendanceStats?.last_event_status === 'present' ? (
                                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                ) : (
                                    <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    Last: {attendanceStats?.last_event_status === 'present' ? 'Present' : 'Absent'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <StarIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {attendanceStats?.streak || 0} streak
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
                {/* Upcoming Events Card */}
                <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="h6" fontWeight="600">
                                    Upcoming Events
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <List sx={{ py: 0 }}>
                                {upcomingEvents?.slice(0, 3).map((event, index) => (
                                    <React.Fragment key={event.id}>
                                        <ListItem sx={{ px: 0, py: 1.5 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{
                                                    bgcolor: 'background.paper',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    color: 'text.primary'
                                                }}>
                                                    <EventIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Typography fontWeight="400">{event.name}</Typography>
                                                        {event.type && (
                                                            <Chip
                                                                label={event.type}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: 'background.paper',
                                                                    border: '1px solid',
                                                                    borderColor: 'divider',
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(event.start_time)} • {formatTime(event.start_time)}
                                                        </Typography>
                                                        {event.location && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                                <LocationIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {event.location}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {index < upcomingEvents.slice(0, 3).length - 1 && (
                                            <Divider sx={{ bgcolor: 'divider' }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>

                            {(!upcomingEvents || upcomingEvents.length === 0) && (
                                <Alert severity="info" sx={{ mt: 2, bgcolor: 'background.paper' }}>
                                    No upcoming events scheduled.
                                </Alert>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Box >

            {/* All Members Attendance Stats*/}
            <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 4, px: 1 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <GroupsIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="h6" fontWeight="600">
                            Member Attendance Overview
                        </Typography>
                    </Box>

                    <List sx={{ py: 0 }}>
                        {allMembersStats.map((memberStat, index) => (
                            <React.Fragment key={memberStat.userId}>
                                <ListItem sx={{ px: 0, py: 2 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white'
                                        }}>
                                            {memberStat.userName?.charAt(0) || '?'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography fontWeight="500">
                                                    {memberStat.userName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" fontWeight="500">
                                                    {memberStat.attended}/{memberStat.total_events}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={memberStat.percentage || 0}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: 'divider',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: memberStat.percentage >= 75 ? 'success.main' :
                                                                memberStat.percentage >= 50 ? 'warning.main' : 'error.main'
                                                        }
                                                    }}
                                                />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {memberStat.percentage}%
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {memberStat.streak > 0 && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                                <StarIcon sx={{ color: 'primary.main', fontSize: 14 }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {memberStat.streak}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {memberStat.last_event_status === 'present' ? (
                                                            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 14 }} />
                                                        ) : (
                                                            <CancelIcon sx={{ color: 'error.main', fontSize: 14 }} />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < allMembersStats.length - 1 && (
                                    <Divider sx={{ bgcolor: 'divider' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </List>

                    {(!allMembersStats || allMembersStats.length === 0) && (
                        <Alert severity="info" sx={{ bgcolor: 'background.paper' }}>
                            No attendance data available yet.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Embedded ComcellGroupDetails */}
            <ComcellGroupDetails
                hideHeader={true}
                groupId={userGroup.id}
                groupData={userGroup}
                onGroupDataChange={handleGroupDataChange}
            />
        </Box >
    );
};

export default MyComcell;