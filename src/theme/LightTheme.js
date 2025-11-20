import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#CD4744',
        },
        background: {
            default: '#f9f9f9',
            paper: '#ffffff',
        },
        text: {
            primary: '#121212',
            secondary: '#757575',
        },
    },
    shadows: [
        'none',
        '0px 4px 20px rgba(0, 0, 0, 0.05)',
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
                        borderColor: "#CD4744",
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.04)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    boxShadow: '0px 7px 40px rgba(0, 0, 0, 0.06)',
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
                    scrollbarColor: '#EE5A5770 transparent',
                },
                '*::-webkit-scrollbar': {
                    width: '2px',
                    height: '4px',
                },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: '#EE5A5770',
                    borderRadius: '10px',
                },
                '*::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
            },
        },
    },
});

export default lightTheme;