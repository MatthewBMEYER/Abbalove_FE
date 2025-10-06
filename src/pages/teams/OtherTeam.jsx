import { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import api from '../../api';
import TeamMembers from './TeamMembers';

export default function OtherTeam() {
    const [teams, setTeams] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        api.get('/team/getAllOther')
            .then((res) => setTeams(res.data.data))
            .catch((err) => console.error(err));
    }, []);

    return (
        <Box>
            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                {teams.map((team) => (
                    <Tab
                        key={team.id}
                        label={`${team.name} ${team.is_active ? '' : '(Inactive)'}`}
                        sx={{ textTransform: 'none' }}
                    />
                ))}
            </Tabs>

            {teams.length > 0 && (
                <TeamMembers teamId={teams[activeTab]?.id} />
            )}
            {teams.length === 0 && (
                <Typography p={2}>No other teams found.</Typography>
            )}
        </Box>
    );
}
