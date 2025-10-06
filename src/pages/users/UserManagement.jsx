import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Paper,
    IconButton,
    Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEffect, useState } from 'react';
import api from '../../api';
import LastSeenLabel from '../../components/LastSeenLabel';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useNavigate } from 'react-router-dom';


export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Sorting
    const [sortBy, setSortBy] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortDirection('asc');
        }
    };

    useEffect(() => {
        api.get('/user/getAll')
            .then((res) => {
                const userList = res.data.data;
                setUsers(userList);
                setFiltered(userList);
            })
            .catch((err) => {
                console.error('Error fetching users:', err);
            });
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        let result = users.filter((user) =>
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(lower) ||
            user.email.toLowerCase().includes(lower)
        );

        // Sorting
        if (sortBy) {
            result = [...result].sort((a, b) => {
                const valA = a[sortBy] ?? '';
                const valB = b[sortBy] ?? '';

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFiltered(result);
    }, [search, users, sortBy, sortDirection]);


    const handleViewDetail = (user) => {
        // Navigate to user detail page
        navigate(`/user/detail/${user.id}`);
    };

    return (
        <Box p={2}>
            <TextField
                label="Search by name or email"
                variant="outlined"
                underline="none"
                size="small"
                fullWidth
                sx={{ mb: 4 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    boxShadow: 'none',
                }}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {[
                                { label: 'Name', field: 'name' },
                                { label: 'Email', field: 'email' },
                                { label: 'Role', field: 'role_name' },
                                { label: 'Last Login', field: 'last_login' }
                            ].map(({ label, field }) => (
                                <TableCell
                                    key={field}
                                    onClick={() => handleSort(field)}
                                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <Box display="flex" alignItems="center">
                                        {label}
                                        {sortBy === field && (
                                            sortDirection === 'asc' ? (
                                                <ArrowDropUpIcon fontSize="small" />
                                            ) : (
                                                <ArrowDropDownIcon fontSize="small" />
                                            )
                                        )}
                                    </Box>
                                </TableCell>
                            ))}
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    {user.name}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role_name}</TableCell>
                                <TableCell>
                                    <LastSeenLabel date={user.last_login} />
                                </TableCell>

                                <TableCell align="center">
                                    <IconButton sx={{ color: "primary.main" }} onClick={() => handleViewDetail(user)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" height="70px">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
