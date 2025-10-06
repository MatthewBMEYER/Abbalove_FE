import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Chip,
    Avatar,
    IconButton,
    Button,
    Breadcrumbs,
    Link,
    Divider,
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Settings as SettingsIcon,
    Schedule as ScheduleIcon,
    Info as InfoIcon,
    CheckBox,
    BackHand
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { useUserStore } from '../../store/userStore';
import TabComcellMembers from "./DetailTabs/TabComcellMembers";
import TabComcellSettings from "./DetailTabs/TabComcellSettings";
import TabComcellAttendance from "./DetailTabs/TabComcellAttendance";

const ComcellGroupDetails = ({
    hideHeader = false,
    groupId: propGroupId = null,
    groupData: propGroupData = null,
    onGroupDataChange = null
}) => {
    const { groupId: paramGroupId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [groupData, setGroupData] = useState(propGroupData);
    const [loading, setLoading] = useState(!propGroupData);
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [tabsLoaded, setTabsLoaded] = useState(new Set([0])); // Pre-load first tab (Members)

    // Use prop groupId if provided, otherwise use URL param
    const effectiveGroupId = propGroupId || paramGroupId;

    useEffect(() => {
        // Only fetch if we don't have prop data
        if (!propGroupData && effectiveGroupId) {
            fetchGroupDetails();
        }
    }, [effectiveGroupId, propGroupData]);

    const fetchGroupDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/comcell/getComcellGroupDetail/${effectiveGroupId}`);
            if (res.data.success) {
                const newGroupData = res.data.data;
                setGroupData(newGroupData);
                // Notify parent component if callback provided
                if (onGroupDataChange) {
                    onGroupDataChange(newGroupData);
                }
            }
        } catch (err) {
            console.error("Failed to fetch group details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);

        // Mark this tab as loaded
        setTabsLoaded(prev => new Set([...prev, newValue]));
    };

    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'master';

    const tabs = [
        { label: "Members", icon: <GroupIcon sx={{ fontSize: 20 }} />, component: TabComcellMembers },
        { label: "Settings", icon: <InfoIcon sx={{ fontSize: 20 }} />, component: TabComcellSettings },
        { label: "Attendance", icon: <CheckBox sx={{ fontSize: 20 }} />, component: TabComcellAttendance },
    ];

    const renderTabContent = () => {
        const CurrentTabComponent = tabs[activeTab]?.component;
        const isTabLoaded = tabsLoaded.has(activeTab);

        switch (activeTab) {
            case 0: // Members
                return CurrentTabComponent ? (
                    <CurrentTabComponent
                        groupId={effectiveGroupId}
                        groupData={groupData}
                        refreshGroupDetails={fetchGroupDetails}
                        isActive={isTabLoaded}
                    />
                ) : (
                    <Box p={3}>
                        <Typography color="text.secondary">Members tab content</Typography>
                    </Box>
                );
            case 1: // Details
                return CurrentTabComponent ? (
                    <CurrentTabComponent
                        groupId={effectiveGroupId}
                        isActive={isTabLoaded}
                        groupData={groupData}
                        refreshGroupDetails={fetchGroupDetails}
                    />
                ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Typography color="text.secondary">Loading details...</Typography>
                    </Box>
                );
            case 2:
                return isTabLoaded ? (
                    <CurrentTabComponent
                        groupId={effectiveGroupId}
                        isActive={isTabLoaded}
                        groupData={groupData}
                        refreshGroupDetails={fetchGroupDetails}
                    />
                ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Typography color="text.secondary">Loading schedule...</Typography>
                    </Box>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="text.secondary">Loading group details...</Typography>
            </Box>
        );
    }

    if (!groupData) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Group not found
                </Typography>
                {!hideHeader && (
                    <Button variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>
                        Go Back
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ minWidth: '100%', minHeight: hideHeader ? 'auto' : '100vh', p: hideHeader ? 0 : 2 }}>
            {/* Header Section - Only show if hideHeader is false */}
            {!hideHeader && (
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: 'background.paper',
                        borderBottom: 1,
                        borderColor: 'divider',
                        top: 0,
                        zIndex: 10,
                        mb: 2
                    }}
                >
                    <Box>
                        {/* Group Header Info */}
                        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box>
                                    <Typography variant="h4" fontWeight={600} gutterBottom>
                                        {groupData.name}
                                    </Typography>

                                    {groupData.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            mb={2}
                                            sx={{ maxWidth: 600, lineHeight: 1.5 }}
                                        >
                                            {groupData.description}
                                        </Typography>
                                    )}

                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Chip
                                            label={groupData.category || "General"}
                                            size="small"
                                            variant="filled"
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                fontWeight: 500,
                                            }}
                                        />
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {groupData.member_count || 0} members
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: 48,
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            gap: 1,
                            px: 2,
                        },
                        '& .Mui-selected': {
                            color: 'primary.main'
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            icon={tab.icon}
                            iconPosition="start"
                            label={tab.label}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1 }} overflow="auto">
                {renderTabContent()}
            </Box>
        </Box>
    );
};

export default ComcellGroupDetails;