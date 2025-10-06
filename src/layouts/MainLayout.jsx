import { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    // Get role from store
    const { roleName } = useUserStore((state) => state.user);
    const role = roleName?.toLowerCase();

    return (
        <Box
            sx={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                bgcolor: "background.default",
                overflow: "hidden", // Prevent the entire layout from scrolling
            }}
        >
            <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} role={role} />

            {/* Main Content Area - FIXED WIDTH CONSTRAINTS */}
            <Box
                sx={{
                    // Calculate available width after sidebar
                    width: `calc(100vw - ${sidebarOpen ? 240 : 72}px)`,
                    minWidth: 0, // Allow shrinking below content size
                    maxWidth: `calc(100vw - ${sidebarOpen ? 240 : 72}px)`, // Prevent expansion
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    px: 5,
                    py: 2,
                    overflow: "hidden", // Prevent this container from scrolling
                }}
            >
                {/* Topbar */}
                <Box
                    sx={{
                        borderRadius: 2,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        bgcolor: "background.paper",
                        p: 1.5,
                        flexShrink: 0, // Don't shrink the topbar
                    }}
                >
                    <Topbar />
                </Box>

                {/* Main content - CONSTRAINED CONTAINER */}
                <Box
                    sx={{
                        borderRadius: 2,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        bgcolor: "background.paper",
                        p: 3,
                        flexGrow: 1,
                        // CRITICAL: Constrain the content area
                        width: "100%",
                        minWidth: 0, // Allow content to shrink
                        maxWidth: "100%", // Prevent content from expanding
                        overflow: "hidden", // Let individual components handle their own scrolling
                        // Create a new stacking context
                        position: "relative",
                    }}
                >
                    {/* Outlet wrapper to ensure proper constraints */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            minWidth: 0,
                            maxWidth: "100%",
                            overflow: "auto", // Allow scrolling within the content area
                        }}
                    >
                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;