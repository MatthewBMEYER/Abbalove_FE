// components/ThemeToggle.jsx
import { IconButton, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useContext } from 'react';
import { ColorModeContext } from '../theme/ThemeProvider';

const ThemeToggle = () => {
    const theme = useTheme();
    const { toggleColorMode } = useContext(ColorModeContext);

    return (
        <IconButton
            sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 9999,
                color: 'text.primary',
            }}
            onClick={toggleColorMode}
            aria-label="toggle theme"
        >
            {theme.palette.mode === 'dark' ? (
                <Brightness7Icon sx={{ transition: 'transform 0.3s ease' }} />
            ) : (
                <Brightness4Icon sx={{ transition: 'transform 0.3s ease' }} />
            )}
        </IconButton>
    );
};

export default ThemeToggle;