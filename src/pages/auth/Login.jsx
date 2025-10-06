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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api';
import { useUserStore } from '../../store/userStore';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleForgetPassword = () => {
        navigate('/reset-password');
    };

    const setUser = useUserStore.getState().setUser;

    const handleSubmit = async (e) => {
        console.log("1. Form submitted"); // Add this
        e.preventDefault();
        console.log("2. Default prevented"); // Add this

        setLoading(true);
        setError(null);
        console.log("3. State updated"); // Add this

        const { email, password } = formData;
        console.log("4. Form data:", { email, password }); // Add this

        if (!email || !password) {
            console.log("5. Validation failed"); // Add this
            setError("Please enter both email and password.");
            setLoading(false);
            return;
        }

        console.log("6. About to make API call");

        try {
            const res = await api.post("/auth/login", { email, password });

            if (res.data.success) {
                // Store token
                localStorage.setItem("token", res.data.data.token);
                //Store userData
                setUser({
                    id: res.data.data.user.id,
                    name: res.data.data.user.name,
                    email: res.data.data.user.email,
                    roleId: res.data.data.user.roleId,
                    roleName: res.data.data.user.roleName
                });

                // Navigate to Dashboard
                navigate("/dashboard");
            } else {
                setError(res.data.message || "Login failed.");
            }
        } catch (err) {
            console.error("Login error:", err);
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
                    Welcome Back
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        name="email"
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <TextField
                        name="password"
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <Typography variant="body2" textAlign="left" onClick={handleForgetPassword} sx={{ cursor: 'pointer', color: 'primary.main' }}>
                        Forget your password?
                    </Typography>
                </Stack>

                {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{ mt: 3, mb: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>

                <Typography variant="body2" textAlign="center">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" underline="hover">
                        Sign up
                    </Link>
                </Typography>
            </Box>
        </motion.div>
    );
};

export default Login;