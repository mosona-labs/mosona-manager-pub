const formatUptime = (openTime: string | Date): string => {
    if (!openTime) return '-';
    const start = new Date(openTime);
    if (isNaN(start.getTime())) return '-';
    let diffMs = Math.max(0, new Date().getTime() - start.getTime());
    const days = Math.floor(diffMs / (24 * 3600 * 1000));
    diffMs -= days * 24 * 3600 * 1000;
    const hours = Math.floor(diffMs / (3600 * 1000));
    diffMs -= hours * 3600 * 1000;
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
};

const formatUptimeDays = (openTime: string | Date): number => {
    if (!openTime) return 0;
    const start = new Date(openTime);
    if (isNaN(start.getTime())) return 0;
    let diffMs = Math.max(0, new Date().getTime() - start.getTime());
    return parseFloat((diffMs / (24 * 3600 * 1000)).toFixed(1));
};

const getRemainingTime = (endTime: string | Date): number => {
    if (!endTime) return 0;
    const end = new Date(endTime);
    if (isNaN(end.getTime())) return 0;
    let diffMs = end.getTime() - new Date().getTime();
    return Math.floor(diffMs / (24 * 3600 * 1000));
};

function formatTimeAgo(input?: string | null) {
    if (!input) return 'never';
    const date = new Date(input);
    if (isNaN(date.getTime())) return 'invalid date';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';

    const intervals = [
        { unit: 'year', secs: 31536000 },
        { unit: 'month', secs: 2592000 },
        { unit: 'day', secs: 86400 },
        { unit: 'hour', secs: 3600 },
        { unit: 'minute', secs: 60 },
        { unit: 'second', secs: 1 },
    ];

    for (const { unit, secs } of intervals) {
        const n = Math.floor(seconds / secs);
        if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
    }
    return 'just now';
}

export { formatUptime, formatUptimeDays, getRemainingTime, formatTimeAgo };
