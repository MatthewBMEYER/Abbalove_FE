import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Typography } from '@mui/material';

export default function LastSeenLabel({ date }) {
    if (!date) {
        return <Typography variant="body2" color="text.secondary">—</Typography>;
    }

    let parsed;
    try {
        parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
    } catch {
        return <Typography variant="body2" color="text.secondary">Invalid date</Typography>;
    }

    const timeAgo = formatDistanceToNowStrict(parsed, { addSuffix: true });

    return (
        <Typography variant="body2" color="text.secondary">
            {timeAgo}
        </Typography>
    );
}
