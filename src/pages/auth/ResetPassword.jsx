import { useState } from 'react';
import {
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
    Link,
    Box
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!email) {
            setError("Please enter your email address.");
            setLoading(false);
            return;
        }

        console.log("email", email);

        try {
            const res = await api.post("/auth/requestResetPasswordLink", { email });

            if (res.data.success) {
                setSuccess("Password reset instructions sent to your email.");
            } else {
                setError(res.data.message || "Failed to send reset instructions.");
            }
        } catch (err) {
            console.error("Reset error:", err);
            if (err.response && err.response.data) {
                setError(err.response.data.message || "Server error.");
            } else {
                setError("Unable to connect to server.");
            }
        }

        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 5 }} fontWeight="550">
                    Reset Your Password
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        name="email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Stack>

                {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 3, mb: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                </Button>

                <Typography variant="body2" textAlign="center">
                    Remember your password?{' '}
                    <Link component={RouterLink} to="/" underline="hover">
                        Sign in
                    </Link>
                </Typography>
            </Box>
        </motion.div>
    );
};

export default ResetPassword;
