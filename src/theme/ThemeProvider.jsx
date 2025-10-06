import { useEffect, useMemo, useState, createContext } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import lightTheme from './LightTheme';
import darkTheme from './DarkTheme';

export const ColorModeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        // Load from localStorage or default to 'light'
        return localStorage.getItem('theme') || 'light';
    });

    const toggleColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        // Save to localStorage on every mode change
        localStorage.setItem('theme', mode);
    }, [mode]);

    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

    return (
        <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ColorModeContext.Provider>
    );
};
