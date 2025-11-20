import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
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

const Calendar = () => {
    const theme = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [monthYearAnchor, setMonthYearAnchor] = useState(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Simulated API fetch
    const fetchChurchEvents = async (month, year) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const dummyEvents = [
                    { id: 1, title: 'Sunday Service', date: new Date(year, month, 5), type: 'service', time: '10:00 AM', priority: 1 },
                    { id: 2, title: 'Bible Study', date: new Date(year, month, 7), type: 'study', time: '7:00 PM', priority: 2 },
                    { id: 3, title: 'Youth Practice', date: new Date(year, month, 10), type: 'practice', time: '6:00 PM', priority: 2 },
                    { id: 4, title: 'Prayer Meeting', date: new Date(year, month, 12), type: 'prayer', time: '7:00 PM', priority: 3 },
                    { id: 5, title: 'Sunday Service', date: new Date(year, month, 12), type: 'service', time: '10:00 AM', priority: 1 },
                    { id: 6, title: 'Choir Rehearsal', date: new Date(year, month, 15), type: 'practice', time: '5:00 PM', priority: 2 },
                    { id: 7, title: "Men's Fellowship", date: new Date(year, month, 18), type: 'fellowship', time: '6:30 PM', priority: 3 },
                    { id: 8, title: 'Sunday Service', date: new Date(year, month, 19), type: 'service', time: '10:00 AM', priority: 1 },
                    { id: 9, title: "Women's Ministry", date: new Date(year, month, 22), type: 'fellowship', time: '10:00 AM', priority: 3 },
                    { id: 10, title: 'Sunday Service', date: new Date(year, month, 26), type: 'service', time: '10:00 AM', priority: 1 }
                ];
                resolve(dummyEvents);
            }, 300);
        });
    };

    useEffect(() => {
        const loadEvents = async () => {
            const eventsData = await fetchChurchEvents(currentMonth, currentYear);
            setEvents(eventsData);
        };
        loadEvents();
    }, [currentMonth, currentYear]);

    const getEventTypeColor = (type) => {
        const colors = {
            service: theme.palette.primary.main,
            practice: theme.palette.warning.main,
            study: theme.palette.success.main,
            prayer: theme.palette.secondary.main,
            fellowship: theme.palette.error.main,
        };
        return colors[type] || theme.palette.grey[600];
    };

    const getEventTypeLabel = (type) => {
        const labels = {
            service: 'Service',
            practice: 'Practice',
            study: 'Bible Study',
            prayer: 'Prayer',
            fellowship: 'Fellowship',
        };
        return labels[type] || 'Event';
    };

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
        const { day, selected = false, ...pickersDayProps } = props;
        const hasEvents = hasEventsOnDate(day);
        const topEvent = getTopEventOnDate(day);

        return (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PickersDay
                    {...pickersDayProps}
                    day={day}
                    selected={selected}
                    sx={{
                        position: 'relative',
                        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                        ...pickersDayProps.sx,
                    }}
                />
                {hasEvents && topEvent && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 4,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: getEventTypeColor(topEvent.type),
                            boxShadow: '0 0 2px rgba(0,0,0,0.3)'
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
                minHeight: '100vh',
            }}>
                <Grid container spacing={3} sx={{ maxWidth: 1600, margin: '0 auto' }}>
                    {/* Calendar Side - Left */}
                    <Grid item xs={12} lg={7}>
                        <Box
                            sx={{
                                p: { xs: 2, md: 3, lg: 4 },
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: 'background.default',
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: 1,
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
                                </Button>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <IconButton
                                        onClick={() => navigateMonth(-1)}
                                        size="small"
                                    >
                                        <ChevronLeft />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => navigateMonth(1)}
                                        size="small"
                                    >
                                        <ChevronRight />
                                    </IconButton>
                                    <Button
                                        startIcon={<Today />}
                                        onClick={goToToday}
                                        variant="outlined"
                                        size="small"
                                        sx={{ ml: 1 }}
                                    >
                                        Today
                                    </Button>
                                </Box>
                            </Box>

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
                            >
                                <Box sx={{ p: 2, minWidth: 300, backgroundColor: 'background.paper' }}>
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
                                            <Grid item xs={4} key={month}>
                                                <Button
                                                    fullWidth
                                                    variant={currentMonth === index ? "contained" : "outlined"}
                                                    onClick={() => selectMonth(index)}
                                                    size="small"
                                                    sx={{
                                                        py: 1.5,
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

                            {/* Calendar */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mt: 2
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
                                        maxWidth: { xs: 400, md: 500, lg: 600, xl: 700 },
                                        '& .MuiPickersDay-root': {
                                            borderRadius: 2,
                                            margin: { xs: 0.3, md: 0.5, lg: 0.7 },
                                            fontSize: { xs: '0.875rem', lg: '1rem' },
                                            fontWeight: 400,
                                            width: { xs: 36, md: 40, lg: 48, xl: 56 },
                                            height: { xs: 36, md: 40, lg: 48, xl: 56 },
                                            color: 'text.primary',
                                        },
                                        '& .MuiPickersDay-today': {
                                            border: `1px solid ${theme.palette.primary.main}`,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: `${theme.palette.primary.main} !important`,
                                            color: 'white !important',
                                        },
                                        '& .MuiPickersCalendarHeader-root': {
                                            display: 'none',
                                        },
                                        '& .MuiDayCalendar-weekDayLabel': {
                                            color: 'text.secondary',
                                            fontSize: { xs: '0.75rem', lg: '0.875rem' },
                                            width: { xs: 36, md: 40, lg: 48, xl: 56 },
                                            height: { xs: 36, md: 40, lg: 48, xl: 56 },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Event Legend */}
                            <Box sx={{
                                mt: 3,
                                p: 2,
                                backgroundColor: 'background.paper',
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                            }}>
                                <Typography variant="subtitle2" fontWeight="600" gutterBottom color="text.primary">
                                    Event Types:
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                    {['service', 'study', 'practice', 'prayer', 'fellowship'].map(type => (
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
                    <Grid item xs={12} lg={5}>
                        <Box
                            sx={{
                                p: { xs: 2, md: 3 },
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: 'background.default',
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: 1,
                                position: { lg: 'sticky' },
                                top: { lg: 20 }
                            }}
                        >
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <EventIcon color="primary" />
                                Events on {selectedDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Typography>

                            {getEventsOnDate(selectedDate).length > 0 ? (
                                <List dense sx={{ '& .MuiListItem-root': { px: 0 } }}>
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
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {event.time}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">•</Typography>
                                                        <Chip
                                                            label={getEventTypeLabel(event.type)}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: getEventTypeColor(event.type),
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.75rem',
                                                                height: 24
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
                                    borderColor: 'divider'
                                }}>
                                    <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No events scheduled for this day.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid >
            </Box >
        </LocalizationProvider >
    );
};

export default Calendar;