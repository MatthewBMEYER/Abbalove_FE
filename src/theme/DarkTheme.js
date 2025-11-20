import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#EE5A57',
        },
        background: {
            paper: '#121212',
            default: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
        },
    },
    shadows: [
        'none',
        '0px 4px 20px rgba(0, 0, 0, 0.4)',
    ],
    typography: {
        fontFamily: 'Poppins, sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {

                }
            },
            defaultProps: {
                size: 'small',
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#EE5A57",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderWidth: "1.5px",
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.4)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    boxShadow: '0 4px 50px rgba(0, 0, 0, 0.2)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    whiteSpace: 'nowrap',
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                '*': {
                    // apply to all scrollable elements
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#EE5A57 transparent',
                },
                '*::-webkit-scrollbar': {
                    width: '2px',
                    height: '4px',
                },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: '#EE5A57',
                    borderRadius: '10px',
                },
                '*::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
            },
        },
    },
});

export default darkTheme;