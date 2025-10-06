import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Divider,
    Button,
    Snackbar,
    Alert,
} from "@mui/material";
import QR from "../../assets/qr.png";

export default function Giving() {
    const [open, setOpen] = useState(false);

    const bankDetails = {
        bank: "BCA",
        accountName: "Abbalove Church",
        accountNumber: "1234567890",
    };

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    //bgcolor: "background.default",
                    height: "100%",
                    p: 2,
                    borderRadius: 1,
                }}
            >
                <Card sx={{ maxWidth: 700, width: "100%", boxShadow: 'theme.shadows[1]', borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <CardContent sx={{ textAlign: "center", p: 4 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Giving
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Support the ministry by giving through QRIS or Bank Transfer
                        </Typography>

                        {/* QRIS Section */}
                        <Box
                            sx={{
                                mt: 3,
                                mb: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <Box
                                component="img"
                                src={QR}
                                alt="QRIS Code"
                                sx={{ width: 300, height: "auto", borderRadius: 2, boxShadow: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Scan QRIS to give via any e-wallet or bank app
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Bank Transfer Section */}
                        <Box sx={{ textAlign: "left" }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Bank Transfer
                            </Typography>
                            <Typography variant="body2">
                                <strong>Bank:</strong> {bankDetails.bank}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Account Name:</strong> {bankDetails.accountName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Account Number:</strong> {bankDetails.accountNumber}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 3, borderRadius: 2 }}
                            onClick={handleClick}
                        >
                            I Have Given
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {/* Snackbar Popup */}
            <Snackbar
                open={open}
                autoHideDuration={3000} // auto close after 3 sec
                onClose={handleClose}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={handleClose}
                    severity="success"
                    //variant="filled"
                    sx={{ width: "100%" }}
                >
                    Thank you for your generosity! God bless you!
                </Alert>
            </Snackbar>
        </>
    );
}
