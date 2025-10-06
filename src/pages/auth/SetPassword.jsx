import { useState, useEffect } from 'react';
import {
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

const SetPassword = () => {
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);



    const { token: tokenFromParams } = useParams();
    const [searchParams] = useSearchParams();
    const token = tokenFromParams || searchParams.get('token');


    useEffect(() => {
        if (!token) {
            console.log("token", token);
            setError("Invalid or missing token.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // if (newPassword.length < 6) {
        //     return setError("Password must be at least 6 characters.");
        // }

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/resetPassword', {
                token,
                newPassword
            });

            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 3000);
            } else {
                setError(res.data.message || "Reset failed.");
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Server error.");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 5 }} fontWeight="550">
                    Set New Password
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {success && (
                    <Alert severity="success">
                        Password updated! Redirecting to login...
                    </Alert>
                )}

                {!success && (
                    <>
                        <TextField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            fullWidth
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !token}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Set Password'}
                        </Button>
                    </>
                )}
            </Stack>
        </form>
    );
};

export default SetPassword;
