import { Box, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import BrandIcon from '../components/BrandIcon';
import { useEffect, useState } from 'react';

const AuthLayout = ({ children }) => {
    const theme = useTheme();
    const [animationDone, setAnimationDone] = useState(false);
    const [startAnimation, setStartAnimation] = useState(false);

    useEffect(() => {
        const coldStartDelay = setTimeout(() => {
            setStartAnimation(true);
        }, 400); // Freeze moment before branding slides

        const endAnimation = setTimeout(() => {
            setAnimationDone(true);
        }, 400 + 800); // Wait for freeze + animation

        return () => {
            clearTimeout(coldStartDelay);
            clearTimeout(endAnimation);
        };
    }, []);


    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 2,
            }}
        >
            <ThemeToggle />
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 1200,
                    minHeight: 600,
                    display: 'flex',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 50px rgba(0, 0, 0, 0.36)'
                        : '0 4px 20px rgba(0, 0, 0, 0.1)',
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: theme.shape.borderRadius,
                    overflow: 'hidden',
                }}
            >
                {/* Brand side animates width */}
                <Box
                    component={motion.div}
                    initial={{ width: '100%' }}
                    animate={{ width: startAnimation ? '50%' : '100%' }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    sx={{
                        bgcolor: 'primary.main',
                        p: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <BrandIcon />
                </Box>


                {/* Form only renders after animation is done */}
                {animationDone && (
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        sx={{
                            width: '50%',
                            p: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        {children}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AuthLayout;
