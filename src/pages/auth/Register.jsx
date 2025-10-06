import { useState } from 'react';
import {
    Typography,
    TextField,
    Button,
    Stack,
    Link,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api'; // adjust if your path is different
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { firstName, lastName, email, password, confirmPassword } = formData;

        if (!email || !password || !confirmPassword || !firstName) {
            setError("First name, email and password are required.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const response = await api.post("/auth/register", {
                firstName,
                lastName: lastName || '', // optional field
                email,
                password,
            });

            if (response.data.success) {
                // registration success
                // you can also show a toast/snackbar here
                navigate("/"); // redirect to login
            } else {
                setError(response.data.message || "Registration failed.");
            }
        } catch (err) {
            console.error("Registration error:", err);
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
                    Let's create your account!
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        name="firstName"
                        label="First Name"
                        fullWidth
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                    />

                    <TextField
                        name="lastName"
                        label="Last Name"
                        fullWidth
                        value={formData.lastName}
                        onChange={handleChange}
                    />

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

                    <TextField
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        fullWidth
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
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
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                </Button>

                <Typography variant="body2" textAlign="center">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/" underline="hover">
                        Sign in
                    </Link>
                </Typography>
            </Box>
        </motion.div>
    );
};

export default Register;