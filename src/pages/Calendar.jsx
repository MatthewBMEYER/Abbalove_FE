import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    Grid,
    List,
    ListItem,
    ListItemText,
    ToggleButton,
    ToggleButtonGroup,
    Container,
    Paper,
    Divider
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    CalendarMonth,
    ViewList,
    Church,
    Event,
    Groups,
    Celebration
} from '@mui/icons-material';

// Same event data (kept unchanged)
const eventsData = [
    {
        id: 1,
        title: "Sunday Worship Service",
        date: "2024-11-17",
        time: "09:00 AM",
        type: "service",
        description: "Join us for our weekly Sunday worship service"
    },
    {
        id: 2,
        title: "Youth Cell Group",
        date: "2024-11-18",
        time: "07:00 PM",
        type: "cell",
        description: "Youth cell community meeting at the church hall"
    },
    {
        id: 3,
        title: "Prayer Meeting",
        date: "2024-11-20",
        time: "06:30 PM",
        type: "event",
        description: "Midweek prayer and worship gathering"
    },
    {
        id: 4,
        title: "Women's Cell Group",
        date: "2024-11-21",
        time: "10:00 AM",
        type: "cell",
        description: "Women's fellowship and Bible study"
    },
    {
        id: 5,
        title: "Sunday Worship Service",
        date: "2024-11-24",
        time: "09:00 AM",
        type: "service",
        description: "Join us for our weekly Sunday worship service"
    },
    {
        id: 6,
        title: "Thanksgiving Celebration",
        date: "2024-11-28",
        time: "06:00 PM",
        type: "special",
        description: "Special Thanksgiving service and potluck dinner"
    },
    {
        id: 7,
        title: "Men's Cell Group",
        date: "2024-11-22",
        time: "07:00 PM",
        type: "cell",
        description: "Men's fellowship and discipleship meeting"
    },
    {
        id: 8,
        title: "Choir Practice",
        date: "2024-11-23",
        time: "04:00 PM",
        type: "event",
        description: "Weekly choir rehearsal for worship team"
    },
    {
        id: 9,
        title: "Sunday Worship Service",
        date: "2024-12-01",
        time: "09:00 AM",
        type: "service",
        description: "Join us for our weekly Sunday worship service"
    },
    {
        id: 10,
        title: "Christmas Planning Meeting",
        date: "2024-12-05",
        time: "07:30 PM",
        type: "event",
        description: "Planning meeting for Christmas celebration events"
    }
];

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('calendar');

    const eventTypeConfig = {
        service: { color: 'primary', icon: <Church />, label: 'Sunday Service' },
        cell: { color: 'success', icon: <Groups />, label: 'Cell Group' },
        event: { color: 'warning', icon: <Event />, label: 'Event' },
        special: { color: 'secondary', icon: <Celebration />, label: 'Special Event' }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
            daysInMonth: lastDay.getDate(),
            startingDayOfWeek: firstDay.getDay(),
            year,
            month
        };
    };

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return eventsData.filter(event => event.date === dateStr);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleViewChange = (event, newView) => {
        if (newView !== null) setView(newView);
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    const renderCalendarView = () => {
        const rows = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
        const today = new Date();

        // Build cells for all days
        const cells = [];

        // Empty cells before 1st
        for (let i = 0; i < startingDayOfWeek; i++) {
            cells.push(<td key={`empty-${i}`} style={{ height: 100 }} />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const events = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();

            cells.push(
                <td
                    key={day}
                    style={{
                        height: 100,
                        border: isToday ? '2px solid' : '1px solid',
                        borderColor: isToday ? 'primary.main' : 'divider',
                        backgroundColor: isToday ? 'action.hover' : 'background.paper',
                        padding: 4,
                        verticalAlign: 'top',
                        borderRadius: 4
                    }}
                >
                    <Typography
                        variant="body2"
                        fontWeight={isToday ? 'bold' : 'regular'}
                        color={isToday ? 'primary.main' : 'text.secondary'}
                        sx={{ lineHeight: 1.2, mb: 0.5 }}
                    >
                        {day}
                    </Typography>
                    <Box sx={{ overflow: 'hidden' }}>
                        {events.slice(0, 2).map(event => (
                            <Chip
                                key={event.id}
                                label={event.title}
                                size="small"
                                color={eventTypeConfig[event.type]?.color || 'default'}
                                sx={{
                                    mb: 0.5,
                                    width: '100%',
                                    height: 'auto',
                                    fontSize: '0.65rem',
                                    '& .MuiChip-label': {
                                        px: 0.5,
                                        py: 0.25,
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word'
                                    }
                                }}
                            />
                        ))}
                        {events.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                                +{events.length - 2} more
                            </Typography>
                        )}
                    </Box>
                </td>
            );
        }

        // Fill remaining cells to complete last row (up to 42 cells = 6 weeks)
        while (cells.length % 7 !== 0) {
            cells.push(<td key={`trailing-${cells.length}`} style={{ height: 100 }} />);
        }

        // Group into rows of 7
        for (let i = 0; i < cells.length; i += 7) {
            rows.push(<tr key={i}>{cells.slice(i, i + 7)}</tr>);
        }

        return (
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            {days.map(day => (
                                <th
                                    key={day}
                                    style={{
                                        textAlign: 'center',
                                        padding: '8px 0',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </Box>
        );
    };

    const renderListView = () => {
        const sortedEvents = [...eventsData].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        return (
            <List disablePadding>
                {sortedEvents.map((event, index) => {
                    const eventDate = new Date(event.date);
                    const config = eventTypeConfig[event.type];

                    return (
                        <React.Fragment key={event.id}>
                            <ListItem
                                sx={{
                                    py: 2,
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Box sx={{ mr: 1.5, color: config?.color || 'text.primary' }}>
                                        {config?.icon}
                                    </Box>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1">{event.title}</Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary">
                                                    {eventDate.toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })} at {event.time}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" mt={0.5}>
                                                    {event.description}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    <Chip
                                        label={config?.label}
                                        size="small"
                                        color={config?.color || 'default'}
                                    />
                                </Box>
                            </ListItem>
                            {index < sortedEvents.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                    );
                })}
            </List>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Card elevation={2}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Church sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h5" fontWeight="medium">
                                Church Calendar
                            </Typography>
                        </Box>
                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={handleViewChange}
                            size="small"
                        >
                            <ToggleButton value="calendar" sx={{ px: 1.5 }}>
                                <CalendarMonth fontSize="small" sx={{ mr: 0.75 }} /> Calendar
                            </ToggleButton>
                            <ToggleButton value="list" sx={{ px: 1.5 }}>
                                <ViewList fontSize="small" sx={{ mr: 0.75 }} /> List
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {view === 'calendar' && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                                <IconButton onClick={handlePrevMonth} size="small">
                                    <ChevronLeft />
                                </IconButton>
                                <Typography variant="h6" fontWeight="medium" sx={{ mx: 1 }}>
                                    {monthName} {year}
                                </Typography>
                                <IconButton onClick={handleNextMonth} size="small">
                                    <ChevronRight />
                                </IconButton>
                            </Box>

                            {renderCalendarView()}
                        </>
                    )}

                    {view === 'list' && (
                        <Box>
                            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                                Upcoming Events
                            </Typography>
                            {renderListView()}
                        </Box>
                    )}

                    {/* Legend */}
                    <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                        {Object.values(eventTypeConfig).map((config, idx) => (
                            <Chip
                                key={idx}
                                icon={config.icon}
                                label={config.label}
                                size="small"
                                color={config.color}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
};

export default Calendar;