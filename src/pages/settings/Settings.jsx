import { Box, Typography, IconButton, Snackbar, Alert } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { useContext, useState } from 'react';
import { ColorModeContext } from '../../theme/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';

export default function Settings() {
    const { mode, toggleColorMode } = useContext(ColorModeContext);
    const navigate = useNavigate();

    const [snackbars, setSnackbars] = useState([]);

    const handleShowSnackbar = (message) => {
        const id = new Date().getTime(); // unique key
        setSnackbars(prev => [...prev, { id, message }]);
    };

    const handleSnackbarClose = (id) => (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbars(prev => prev.filter(snack => snack.id !== id));
    };

    const handleThemeToggle = () => {
        toggleColorMode();
        const next = mode === 'light' ? 'dark' : 'light';
        handleShowSnackbar(`Theme changed to ${next} mode`);
    };

    const handleResetPassword = () => navigate('/reset-password');
    const handleProfile = () => navigate('user/profile');
    const handleNotifications = () => alert('Go to notification settings');

    const clearUser = useUserStore((state) => state.clearUser);
    const handleLogout = () => {
        localStorage.removeItem('token');
        clearUser();

        navigate('/');
    };

    const Row = ({ label, action, onClick, disableHover = false, color = 'inherit' }) => (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '60px',
                cursor: onClick ? 'pointer' : 'default',
                color,
                ...(disableHover
                    ? {}
                    : {
                        '&:hover': {
                            backgroundColor: onClick ? 'action.hover' : 'inherit',
                        },
                    }),
            }}
        >
            <Typography variant="body1" color={color}>{label}</Typography>
            {action}
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                px: 2,
                minHeight: '100%',
                justifyContent: 'space-between',
            }}
        >
            <Box>
                <Row
                    label="Profile"
                    action={<IconButton><ChevronRightIcon /></IconButton>}
                    onClick={handleProfile}
                    disableHover
                />
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
                <Row
                    label="Theme"
                    onClick={handleThemeToggle}
                    action={
                        <Typography variant="body2" color="text.secondary" pr={1}>
                            {mode === 'dark' ? 'Dark' : 'Light'}
                        </Typography>
                    }
                    disableHover
                />
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
                <Row
                    label="Reset Password"
                    action={<IconButton><ChevronRightIcon /></IconButton>}
                    onClick={handleResetPassword}
                    disableHover
                />
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
                <Row
                    label="Notification"
                    action={<IconButton><ChevronRightIcon /></IconButton>}
                    onClick={handleNotifications}
                    disableHover
                />
            </Box>

            <Box sx={{ mt: 4 }}>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }} />
                <Row
                    label="Logout"
                    action={<LogoutIcon color="error" />}
                    onClick={handleLogout}
                    color="error.main"
                    disableHover
                />
            </Box>

            {/* Multiple snackbars, each one with its own key & life */}
            {snackbars.map(snack => (
                <Snackbar
                    key={snack.id}
                    open
                    autoHideDuration={2500}
                    onClose={handleSnackbarClose(snack.id)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={handleSnackbarClose(snack.id)} severity="info" sx={{ width: '100%' }}>
                        {snack.message}
                    </Alert>
                </Snackbar>
            ))}
        </Box>
    );
}
