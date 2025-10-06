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
    Dashboard,
    Settings,
    Event,
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
        label: 'Worship',
        icon: <Church />,
        children: {
            schedule: {
                label: 'Schedule',
                path: "/worship/schedule",
            },
            video: {
                label: 'Collections',
                path: "/worship/collections",
            },
            giving: {
                label: 'Giving',
                path: "/worship/giving",
            }
        }
    },
    events: {
        label: 'Events',
        icon: <Event />,
        path: 'evetns',
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
        const active = isActive(item.path || '');

        const button = (
            <ListItemButton
                onClick={() => {
                    if (hasChildren) {
                        handleToggleMenu(key);
                    }
                }}
                sx={{
                    color: 'white',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    px: 2,
                    height: 45,
                    mb: 0.3,
                    backgroundColor: hasChildren
                        ? 'transparent'
                        : active
                            ? 'rgba(255,255,255,0.12)'
                            : 'transparent',
                    '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                }}
            >
                <ListItemIcon
                    sx={{
                        color: 'white',
                        minWidth: 0,
                        mr: isOpen ? 2 : 0,
                        justifyContent: 'center',
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {isOpen && (
                    <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ noWrap: true }}
                    />
                )}
                {isOpen && hasChildren && (openMenus[key] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
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
                bgcolor: 'primary.main',
                color: 'white',
                //boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 50px rgba(238, 90, 87, 0.48)'
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                py: 2,
                width: isOpen ? 240 : 72,
                transition: 'width 0.2s',
            }}
        >
            {/* === BRANDING SECTION === */}
            <Box
                px={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                height={40}
                mb={5}
            >
                {/* only render on open */}
                {isOpen && (
                    <Typography variant="h6" fontWeight="bold" noWrap>
                        Abbalove
                    </Typography>
                )}
                <IconButton onClick={toggle} sx={{ color: 'white', justifyContent: isOpen ? 'flex-start' : 'center' }}>
                    {isOpen ? <Close /> : <MenuIcon />}
                </IconButton>
            </Box>

            {/* === MAIN MENUS SECTION === */}
            <Box flexGrow={1} overflow="hidden" mt={1}>
                <List>
                    {Object.entries(menuConfig).map(([key, item]) => {
                        const hasChildren = !!item.children;

                        // 🔐 Role-based visibility
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
                                                                    backgroundColor: childActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                                                    },
                                                                }}
                                                            >
                                                                <ListItemText
                                                                    primary={child.label}
                                                                    primaryTypographyProps={{
                                                                        noWrap: true,
                                                                        sx: {
                                                                            color: 'white',
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
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
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
        </Box>
    );
};

export default Sidebar;