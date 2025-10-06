import { Box, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const BrandIcon = () => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'white'
        }}>
            <FavoriteIcon sx={{
                fontSize: 80,
                mb: 2,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' }
                }
            }} />
            <Typography variant="h3" component="h1" fontWeight="bold">
                Abbalove
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
                Pluit Jembatan 3
            </Typography>
        </Box>
    );
};

export default BrandIcon;