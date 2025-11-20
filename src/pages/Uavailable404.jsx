import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                p: 2,
                backgroundColor: "background.default",
            }}
        >
            <Card
                sx={{
                    maxWidth: 450,
                    width: "100%",
                    boxShadow: 'theme.shadows[1]',
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                    textAlign: "center"
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        variant="h1"
                        fontWeight="bold"
                        color="text.primary"
                    >
                        404
                    </Typography>

                    <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
                        Not Found
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 4, lineHeight: 1.6 }}
                    >
                        We couldn't find the page you were looking for.
                        It might have been moved or never existed.
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ borderRadius: 2, mb: 1 }}
                        onClick={() => navigate("/dashboard")}
                    >
                        Return to Homepage
                    </Button>

                    <Button
                        variant="text"
                        color="text.primary"
                        fullWidth
                        sx={{ borderRadius: 2 }}
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
}