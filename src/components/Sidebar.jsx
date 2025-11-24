import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    useTheme,
    Divider,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    Home,
    People,
    Close,
    Call,
    Groups,
    Church,
    Notifications,
    Dashboard,
    Settings,
    CalendarViewDay as Event,
    Logout,
    Brightness4,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

// Menu config
const menuConfig = {
    dashboard: {
        label: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
    },
    worship: {
        label: 'Service',
        icon: <Church />,
        children: {
            schedule: {
                label: 'Schedule',
                path: "/worship/schedule",
            },
            video: {
                label: 'Video Collections',
                path: "/worship/video/collections",
            },
            giving: {
                label: 'Giving',
                path: "/worship/giving",
            }
        }
    },
    calendar: {
        label: 'Calendar',
        icon: <Event />,
        path: 'calendar',
    },
    teams: {
        label: 'Teams',
        icon: <People />,
        roles: ['admin', 'master', 'servant'],
        children: {
            worship_team: {
                label: 'Worship Team',
                path: "/teams/worship",
            },
            other_team: {
                label: 'Other Team',
                path: "/teams/other",
            }
        }
    },
    users: {
        label: 'Users',
        icon: <People />,
        path: '/users/management',
        roles: ['admin', 'master', 'servant'],
    },
    comsell: {
        label: 'Cell Community',
        icon: <Groups />,
        children: {
            my_comsell: {
                label: 'My Comcell',
                path: "/comcell/mycomcell"
            },
            all_comsell: {
                label: 'All Comcell',
                path: "/comcell/all"
            }
        }
    },

}

const footerConfig = {
    notification: {
        label: 'Notifications',
        icon: <Notifications />,
        path: '/notifications',
    },
    support: {
        label: 'Support',
        icon: <Call />,
        path: '/support',
    },
    settings: {
        label: 'Settings',
        icon: <Settings />,
        path: '/settings',
    },
}

const Sidebar = ({ isOpen, toggle, role }) => {
    const [openMenus, setOpenMenus] = useState({});
    const location = useLocation();
    const [lastOpenMenu, setLastOpenMenu] = useState(null);
    const theme = useTheme();
    useEffect(() => {
        if (!isOpen) {
            // Save last open
            const openKey = Object.keys(openMenus).find((key) => openMenus[key]);
            if (openKey) {
                setLastOpenMenu(openKey);
            }

            // Close all menus
            setOpenMenus({});
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && lastOpenMenu) {
            setOpenMenus({ [lastOpenMenu]: true });
        }
    }, [isOpen]);

    const handleToggleMenu = (menu) => {
        if (!isOpen) {
            toggle(); // expand sidebar first
            // Slight delay before opening the menu so the sidebar can animate
            setTimeout(() => {
                setOpenMenus({ [menu]: true });
                setLastOpenMenu(menu);
            }, 200);
            return;
        }

        const isNowOpen = !openMenus[menu];
        setOpenMenus((prev) => {
            const newMenus = {};
            Object.keys(prev).forEach((key) => {
                newMenus[key] = false;
            });
            newMenus[menu] = isNowOpen;
            return newMenus;
        });

        setLastOpenMenu(isNowOpen ? menu : null);
    };

    const isActive = (path) => location.pathname.includes(path);

    const renderMenuItem = (item, key, hasChildren = false) => {
        const active = isActive(item.path);

        const button = (
            <ListItemButton
                onClick={() => {
                    if (hasChildren) {
                        handleToggleMenu(key);
                    }
                }}
                sx={{
                    color: active ? 'primary.main' : 'text.secondary',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    px: 2,
                    height: 45,
                    mb: 0.3,
                    backgroundColor: hasChildren
                        ? 'transparent'
                        : active
                            ? 'rgba(255, 185, 185, 0.12)'
                            : 'transparent',
                    '&:hover': {
                        backgroundColor: 'rgba(112, 112, 112, 0.08)',
                    },
                }}
            >
                <ListItemIcon
                    sx={{
                        color: active ? 'primary.main' : 'text.secondary',
                        minWidth: 0,
                        mr: isOpen ? 2 : 0,
                        justifyContent: 'center',
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {
                    isOpen && (
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ noWrap: true }}
                        />
                    )
                }
                {isOpen && hasChildren && (openMenus[key] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton >
        );

        return item.path ? (
            <Link to={item.path} style={{ textDecoration: 'none' }}>
                {button}
            </Link>
        ) : (
            button
        );
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: 'background.default',
                color: 'text.primary',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                pb: 0,
                width: isOpen ? 240 : 72,
                borderRight: '1px solid',
                borderColor: 'divider',
                transition: 'width 0.2s',
            }}
        >
            {/* === BRANDING SECTION === */}
            <Box
                px={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                height={64}
            >
                {/* only render on open */}
                <IconButton onClick={toggle} sx={{ color: 'text.primary', justifyContent: isOpen ? 'flex-start' : 'center' }}>
                    {isOpen ? <Close /> : <MenuIcon />}
                </IconButton>

                {isOpen && (
                    <Typography variant="h6" fontWeight="bold" noWrap color="primary.main" sx={{ pr: 5 }}>
                        Abbalove
                    </Typography>
                )}

            </Box>

            <Divider sx={{ borderColor: 'divider', mb: 3 }} />

            {/* === MAIN MENUS SECTION === */}
            <Box flexGrow={1} overflow="hidden" mt={0}>
                <List>
                    {Object.entries(menuConfig).map(([key, item]) => {
                        const hasChildren = !!item.children;

                        if (item.roles && !item.roles.includes(role)) {
                            return null;
                        }

                        return (
                            <Box key={key}>
                                {isOpen ? (
                                    renderMenuItem(item, key, hasChildren)
                                ) : (
                                    <Tooltip title={item.label} placement="right">
                                        <Box>{renderMenuItem(item, key, hasChildren)}</Box>
                                    </Tooltip>
                                )}
                                {hasChildren && (
                                    <Collapse in={openMenus[key]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {Object.entries(item.children).map(([childKey, child]) => {
                                                if (child.roles && !child.roles.includes(role)) return null;

                                                const childActive = isActive(child.path);
                                                return (
                                                    <Tooltip key={childKey} title={isOpen ? '' : child.label} placement="right">
                                                        <Link to={child.path} style={{ textDecoration: 'none' }}>
                                                            <ListItemButton
                                                                sx={{
                                                                    pl: isOpen ? 6 : 2,
                                                                    justifyContent: isOpen ? 'flex-start' : 'center',
                                                                    backgroundColor: childActive ? 'rgba(255, 146, 146, 0.12)' : 'transparent',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(75, 75, 75, 0.075)',
                                                                    },
                                                                }}
                                                            >
                                                                <ListItemText
                                                                    primary={child.label}
                                                                    primaryTypographyProps={{
                                                                        noWrap: true,
                                                                        sx: {
                                                                            color: childActive ? 'primary.main' : 'text.secondary',
                                                                            display: isOpen ? 'block' : 'none',
                                                                        },
                                                                    }}
                                                                />
                                                            </ListItemButton>
                                                        </Link>
                                                    </Tooltip>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                )}
                            </Box>
                        );
                    })}
                </List>
            </Box>

            {/* === FOOTER MENUS SECTION === */}
            <Box>
                <Divider sx={{ borderColor: 'divider', my: 1 }} />
                <List>
                    {Object.entries(footerConfig).map(([key, item]) => (
                        <Box key={key}>
                            {isOpen ? (
                                renderMenuItem(item, key)
                            ) : (
                                <Tooltip title={item.label} placement="right">
                                    <Box>{renderMenuItem(item, key)}</Box>
                                </Tooltip>
                            )}
                        </Box>
                    ))}
                </List>
            </Box>
        </Box >
    );
};

export default Sidebar;