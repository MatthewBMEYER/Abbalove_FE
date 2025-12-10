import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
    useTheme,
    alpha,
    Button,
    IconButton,
    Popover,
    Stack,
    Grid,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Event as EventIcon,
    ChevronLeft,
    ChevronRight,
    Today,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import api from '../api'; // Adjust the import path as needed

const Calendar = () => {
    const theme = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [monthYearAnchor, setMonthYearAnchor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Fetch events from real API
    const fetchEvents = async (month, year) => {
        setLoading(true);
        setError(null);
        try {
            // Convert month to 1-based for API (JavaScript months are 0-based)
            const monthParam = month + 1;

            const response = await api.get('/events/getAll', {
                params: {
                    month: monthParam,
                    year: year
                }
            });

            if (response.data.success) {
                // Transform API response to match our expected format
                const transformedEvents = response.data.data.map(event => ({
                    id: event.id,
                    title: event.name,
                    date: new Date(event.start_time),
                    type: event.type || 'other',
                    time: new Date(event.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    priority: getEventPriority(event.type),
                    location: event.location,
                    description: event.description
                }));

                setEvents(transformedEvents);
            } else {
                setError('Failed to load events');
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    // Map event types to priority (you can adjust this based on your needs)
    const getEventPriority = (eventType) => {
        const priorityMap = {
            'service': 1,
            'comcell': 2,
            'prayer': 2,
            'training': 2,
            'outreach': 3,
            'social': 3,
            'fellowship': 3,
            'study': 2,
            'practice': 2,
            'other': 4
        };
        return priorityMap[eventType] || 4;
    };

    // Map event types to display labels
    const getEventTypeLabel = (type) => {
        const labels = {
            service: 'Service',
            comcell: 'Cell Meeting',
            prayer: 'Prayer',
            training: 'Training',
            outreach: 'Outreach',
            social: 'Social',
            fellowship: 'Fellowship',
            study: 'Bible Study',
            practice: 'Practice',
            other: 'Event'
        };
        return labels[type] || 'Event';
    };

    // Map event types to colors
    const getEventTypeColor = (type) => {
        const colors = {
            service: theme.palette.primary.main,
            comcell: theme.palette.info.main,
            prayer: theme.palette.secondary.main,
            training: theme.palette.warning.main,
            outreach: theme.palette.success.main,
            social: theme.palette.error.main,
            fellowship: theme.palette.purple?.[500] || '#9C27B0',
            study: theme.palette.blue?.[500] || '#2196F3',
            practice: theme.palette.orange?.[500] || '#FF9800',
            other: theme.palette.grey[600],

            //'service','comcell','prayer','training','outreach','social','fellowship','study','practice','other'
        };
        return colors[type] || theme.palette.grey[600];
    };

    useEffect(() => {
        fetchEvents(currentMonth, currentYear);
    }, [currentMonth, currentYear]);

    const getEventsOnDate = (date) => {
        if (!date) return [];
        return events.filter(event =>
            event.date.getDate() === date.getDate() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getFullYear() === date.getFullYear()
        );
    };

    const hasEventsOnDate = (date) => {
        return getEventsOnDate(date).length > 0;
    };

    const getTopEventOnDate = (date) => {
        const eventsOnDate = getEventsOnDate(date);
        return eventsOnDate.length
            ? eventsOnDate.reduce((prev, current) => (prev.priority < current.priority ? prev : current))
            : null;
    };

    // Custom day renderer
    const CustomDay = (props) => {
        const {
            day,
            selected = false,
            outsideCurrentMonth,
            ...pickersDayProps
        } = props;

        const hasEvents = hasEventsOnDate(day);
        const topEvent = getTopEventOnDate(day);

        return (
            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <PickersDay
                    {...pickersDayProps}
                    day={day}
                    selected={selected}
                    outsideCurrentMonth={outsideCurrentMonth}
                    sx={{
                        position: 'relative',
                        border: 'none',
                        opacity: outsideCurrentMonth ? 0.35 : 1,
                        color: outsideCurrentMonth
                            ? alpha(theme.palette.text.primary, 0.4)
                            : theme.palette.text.primary,
                        backgroundColor: selected
                            ? alpha(theme.palette.primary.main, 0.15)
                            : 'transparent',

                        '&:hover': {
                            backgroundColor: outsideCurrentMonth
                                ? 'transparent'
                                : alpha(theme.palette.primary.main, 0.07),
                        },
                        ...pickersDayProps.sx,
                    }}
                />

                {/* Event dot */}
                {hasEvents && topEvent && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 10,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: getEventTypeColor(topEvent.type),
                            boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                        }}
                    />
                )}
            </Box>
        );
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentYear, currentMonth + direction, 1);
        setCurrentMonth(newDate.getMonth());
        setCurrentYear(newDate.getFullYear());
        setSelectedDate(new Date(currentYear, currentMonth + direction, selectedDate.getDate()));
    };

    const goToToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    const handleMonthYearClick = (event) => {
        setMonthYearAnchor(event.currentTarget);
    };

    const handleMonthYearClose = () => {
        setMonthYearAnchor(null);
    };

    const selectMonth = (monthIndex) => {
        setCurrentMonth(monthIndex);
        setSelectedDate(new Date(currentYear, monthIndex, Math.min(selectedDate.getDate(), 28)));
        handleMonthYearClose();
    };

    const navigateYear = (direction) => {
        setCurrentYear(prev => prev + direction);
    };

    const open = Boolean(monthYearAnchor);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{
                p: { xs: 2, md: 3 },
                width: '100%',
                height: '100%'
            }}>
                <Grid container spacing={3} sx={{ height: '100%', maxWidth: 1600, margin: '0 auto' }}>
                    {/* Calendar Side - Left */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Box
                            sx={{
                                p: { xs: 2, md: 3, lg: 4 },
                                borderRadius: 3,
                                height: '100%',
                                minHeight: '700px',
                                backgroundColor: 'background.default',
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Custom Calendar Header */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                                flexWrap: 'wrap',
                                gap: 1
                            }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleMonthYearClick}
                                    sx={{
                                        minWidth: 180,
                                        justifyContent: 'space-between',
                                        fontWeight: '600',
                                        fontSize: { xs: '1rem', md: '1.1rem', lg: '1.2rem' },
                                        borderColor: 'divider',
                                        color: 'text.primary'
                                    }}
                                >
                                    {months[currentMonth]} {currentYear}
                                    {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                                </Button>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <IconButton
                                        onClick={() => navigateMonth(-1)}
                                        size="small"
                                        disabled={loading}
                                    >
                                        <ChevronLeft />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => navigateMonth(1)}
                                        size="small"
                                        disabled={loading}
                                    >
                                        <ChevronRight />
                                    </IconButton>
                                    <Button
                                        startIcon={<Today />}
                                        onClick={goToToday}
                                        variant="contained"
                                        size="medium"
                                        sx={{ ml: 1, fontWeight: '500' }}
                                        disabled={loading}
                                    >
                                        Today
                                    </Button>
                                </Box>
                            </Box>

                            {/* Error Alert */}
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            {/* Month/Year Popover */}
                            <Popover
                                open={open}
                                anchorEl={monthYearAnchor}
                                onClose={handleMonthYearClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                elevation={1}
                                sx={{ mt: 3 }}
                            >
                                <Box sx={{ p: 2, minWidth: 300, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                    {/* Year Navigation */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2
                                    }}>
                                        <IconButton
                                            onClick={() => navigateYear(-1)}
                                            size="small"
                                        >
                                            <ChevronLeft />
                                        </IconButton>
                                        <Typography variant="h6" fontWeight="600">
                                            {currentYear}
                                        </Typography>
                                        <IconButton
                                            onClick={() => navigateYear(1)}
                                            size="small"
                                        >
                                            <ChevronRight />
                                        </IconButton>
                                    </Box>

                                    {/* Month Grid */}
                                    <Grid container spacing={1}>
                                        {months.map((month, index) => (
                                            <Grid size={4} key={month}>
                                                <Button
                                                    fullWidth
                                                    variant={currentMonth === index ? "contained" : "outlined"}
                                                    onClick={() => selectMonth(index)}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: currentMonth === index ? '600' : '400'
                                                    }}
                                                >
                                                    {month.substring(0, 3)}
                                                </Button>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </Popover>

                            {/* Calendar - Takes remaining space */}
                            <Box sx={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 2,
                                width: '100%',
                            }}>
                                <DateCalendar
                                    value={selectedDate}
                                    onChange={(newDate) => {
                                        setSelectedDate(newDate);
                                        setCurrentMonth(newDate.getMonth());
                                        setCurrentYear(newDate.getFullYear());
                                    }}
                                    onMonthChange={(newDate) => {
                                        setCurrentMonth(newDate.getMonth());
                                        setCurrentYear(newDate.getFullYear());
                                    }}
                                    showDaysOutsideCurrentMonth
                                    slots={{
                                        day: CustomDay,
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        minHeight: 500,

                                        '& .MuiDateCalendar-root': {
                                            width: '100%',
                                            height: 'auto',
                                        },
                                        '& .MuiDayCalendar-slideTransition': {
                                            height: 'auto !important',
                                            minHeight: 'auto !important',
                                            overflow: 'visible !important',
                                        },
                                        '& .MuiDayCalendar-weekContainer': {
                                            height: 'auto',
                                            minHeight: 'auto',
                                            overflow: 'visible',
                                        },
                                        '& .MuiDayCalendar-monthContainer': {
                                            height: 'auto',
                                            minHeight: 'auto',
                                            overflow: 'visible',
                                        },

                                        '& .MuiPickersDay-dayOutsideMonth': {
                                            color: 'text.secondary !important',
                                        },

                                        '& .MuiPickersDay-root': {
                                            borderRadius: 20,
                                            margin: { xs: 0.3, md: 0.5, lg: 0.7 },
                                            fontSize: { xs: '0.75rem', lg: '1rem' },
                                            fontWeight: 400,
                                            width: { xs: 36, md: 44, lg: 52 },
                                            height: { xs: 36, md: 44, lg: 52 },
                                            color: 'text.primary',
                                            textAlign: 'center',
                                        },

                                        '& .MuiPickersDay-today': {
                                            border: 'none !important',
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                        },

                                        '& .Mui-selected': {
                                            backgroundColor: `${theme.palette.primary.main}90 !important`,
                                            color: 'white !important',
                                        },

                                        '& .MuiPickersCalendarHeader-root': {
                                            display: 'none',
                                        },

                                        '& .MuiDayCalendar-weekDayLabel': {
                                            color: 'primary.main',
                                            fontWeight: '600',
                                            margin: { xs: 0.3, md: 0.5, lg: 0.7 },
                                            fontSize: { xs: '0.75rem', lg: '1rem' },
                                            width: { xs: 36, md: 44, lg: 52 },
                                            height: { xs: 36, md: 44, lg: 52 },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Event Legend */}
                            <Box sx={{
                                mt: 0,
                                p: 1,
                            }}>
                                <Typography variant="subtitle2" fontWeight="600" gutterBottom color="text.primary">
                                    Event Types:
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                    {['service', 'comcell', 'prayer', 'training', 'outreach', 'social', 'fellowship', 'study', 'practice'].map(type => (
                                        <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: getEventTypeColor(type),
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {getEventTypeLabel(type)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Events Side - Right */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Box
                            sx={{
                                borderRadius: 3,
                                height: '100%',
                                position: { lg: 'sticky' },
                                top: { lg: 20 },
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                {selectedDate.toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    year: 'numeric',
                                    month: 'long',
                                })}
                                {loading && <CircularProgress size={16} />}
                            </Typography>

                            <Box sx={{ flex: 1, overflow: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : getEventsOnDate(selectedDate).length > 0 ? (
                                    <List dense sx={{ '& .MuiListItem-root': { px: 2 } }}>
                                        {getEventsOnDate(selectedDate).map(event => (
                                            <ListItem
                                                key={event.id}
                                                divider
                                                sx={{
                                                    borderRadius: 2,
                                                    mb: 2,
                                                    py: 2,
                                                    backgroundColor: alpha(getEventTypeColor(event.type), 0.08),
                                                    border: `1px solid ${alpha(getEventTypeColor(event.type), 0.2)}`,
                                                    '&:last-child': { mb: 0 }
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight="600">
                                                            {event.title}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {event.time}
                                                                </Typography>
                                                                {event.location && event.location !== "TBD" && (
                                                                    <>
                                                                        <Typography variant="body2" color="text.secondary">•</Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {event.location}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                            </Box>
                                                            <Chip
                                                                label={getEventTypeLabel(event.type)}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: getEventTypeColor(event.type),
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.75rem',
                                                                    height: 24,
                                                                    alignSelf: 'flex-start'
                                                                }}
                                                            />
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Box sx={{
                                        py: 8,
                                        textAlign: 'center',
                                        backgroundColor: 'background.paper',
                                        borderRadius: 2,
                                        border: `1px dashed`,
                                        borderColor: 'divider',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No events scheduled for this day.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default Calendar;