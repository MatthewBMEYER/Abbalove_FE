import { Box, Typography, Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const pathTitleMap = [
    { match: "/settings/user/profile", title: "My Profile" },
    { match: "/user/detail", title: "User Detail" },
    { match: "/users/management", title: "User Management" },
    { match: "/dashboard", title: "Dashboard" },
    { match: "/settings", title: "Settings" },
    { match: "/support", title: "Support Service" },
    { match: "/teams/worship", title: "Worship Teams" },
    { match: "/teams/other", title: "Other Teams" },
    { match: "/comcell/all", title: "Comcell Groups" },
    { match: "/comcell/mycomcell", title: "My Comcell" },
    { match: "/worship/video/collections", title: "Video Collections" },
    { match: "/worship/video/new", title: "New Video" },
    { match: "/worship/giving", title: "Giving" },
    { match: "/worship/video/manage", title: "Video Management" },
    { match: "/calendar", title: "Calendar" },
    { match: "/notifications", title: "Notifications" },
    { match: "/comcell/:id/events/create", title: "Create Comcell Event" },
];

const generateTitle = (path) => {
    // Try exact matches first
    const exactMatch = pathTitleMap.find(({ match }) => path === match);
    if (exactMatch) return exactMatch.title;

    // Then try pattern matches for dynamic routes
    const patternMatch = pathTitleMap.find(({ match }) => {
        if (match.includes(':id')) {
            const patternSegments = match.split('/');
            const pathSegments = path.split('/');

            // Must have same number of segments
            if (patternSegments.length !== pathSegments.length) return false;

            // Check each segment matches
            for (let i = 0; i < patternSegments.length; i++) {
                const patternSeg = patternSegments[i];
                const pathSeg = pathSegments[i];

                if (patternSeg.startsWith(':')) {
                    // Dynamic segment - must not be empty
                    if (!pathSeg) return false;
                } else if (patternSeg !== pathSeg) {
                    // Static segment must match exactly
                    return false;
                }
            }
            return true;
        }
        return false;
    });

    return patternMatch ? patternMatch.title : "Welcome to Abbalove";
};

const Topbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;
    const title = generateTitle(path);

    // Pull from Zustand
    const { name, roleName } = useUserStore((state) => state.user);
    const displayRole =
        roleName?.charAt(0).toUpperCase() + roleName?.slice(1).toLowerCase();

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid",
                borderColor: "divider",
                height: 64,
                pr: 3,
                flexShrink: 0,
                py: 0,
                backgroundColor: "background.default",
            }}
        >
            <Typography
                variant="h7"
                fontWeight={400}
                color="text.primary"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2.5,
                    height: "100%",
                    borderRight: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                }}
            >
                {title}
            </Typography>

            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={() => navigate("/settings/user/profile")}
                sx={{ cursor: "pointer" }}
            >
                <Box textAlign="right" display="flex" flexDirection="column">
                    <Typography variant="h7" fontWeight={500}>
                        {name || "Unknown"}
                    </Typography>
                    <Typography variant="h8" color="primary.main">
                        {displayRole || ""}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
};

export default Topbar;