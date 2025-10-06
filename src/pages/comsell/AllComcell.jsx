import { useEffect, useState } from "react";
import {
    Tabs,
    Tab,
    Box,
    Typography,
    CircularProgress,
} from "@mui/material";
import Comsell from "./Comcell";
import api from "../../api"

const AllComsell = () => {
    const [tab, setTab] = useState(0);
    const [allGroups, setAllGroups] = useState([]);
    const [adultGroups, setAdultGroups] = useState([]);
    const [youthGroups, setYouthGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleChange = (event, newValue) => {
        setTab(newValue);
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const [allRes, adultRes, youthRes] = await Promise.all([
                api.get("/comcell/getAll"),          // all
                api.get("/comcell/getAllAdult"),    // adult
                api.get("/comcell/getAllYouth"),    // youth
            ]);

            setAllGroups(allRes.data.data || []);
            setAdultGroups(adultRes.data.data || []);
            setYouthGroups(youthRes.data.data || []);
        } catch (err) {
            console.error("Error fetching groups:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Tabs value={tab} onChange={handleChange} sx={{ mb: 3, textTransform: "none" }}>
                <Tab label="All" sx={{ textTransform: "none" }} />
                <Tab label="Adult" sx={{ textTransform: "none" }} />
                <Tab label="Youth" sx={{ textTransform: "none" }} />
            </Tabs>

            {tab === 0 && <Comsell groups={allGroups} refreshGroups={fetchGroups} />}
            {tab === 1 && <Comsell groups={adultGroups} refreshGroups={fetchGroups} />}
            {tab === 2 && <Comsell groups={youthGroups} refreshGroups={fetchGroups} />}
        </Box>
    );
};

export default AllComsell;
