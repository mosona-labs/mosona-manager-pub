import type {
    Category,
    PublicMonitor,
    PublicPageSummary,
    ServerStatus,
} from '@/api/public-preview';
import type { DashboardLayout, Server } from './components/type';

import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CloudLightning,
    Cpu,
    Database,
    HardDrive,
    MemoryStick,
    Moon,
    RotateCw,
    Server as ServerIcon,
    StretchHorizontal,
    Sun,
    WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import CategorySection from './components/category';
import SkeletonCard from './components/skeleton-card';
import DetailBtn from './components/detail-btn';
import LayoutBtn from './components/layout-btn';
import usePublicPreview from './hook/use-public-preview';
import { getPrimaryServerDisk, normalizeServerDisks } from './utils/disk';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { formatUptime } from '@/utils/time';
import { MemoryUnit } from '@/utils/unit';

const ONLINE_THRESHOLD_MS = 5_000;
const STORAGE_LAYOUT_KEY = 'mosona-public-dashboard-layout';
const STORAGE_DETAILS_KEY = 'mosona-public-dashboard-show-details';

function readLayoutPreference(): DashboardLayout {
    const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);

    if (saved === 'list' || saved === 'list2' || saved === 'grid') {
        return saved;
    }

    return 'grid';
}

function readDetailsPreference() {
    const val = localStorage.getItem(STORAGE_DETAILS_KEY);
    // If user has never set a preference, default to showing full details on first open
    if (val === null) return true;
    return val === 'true';
}

function toPercent(used: number, total: number) {
    if (!total || total <= 0) {
        return 0;
    }

    return Math.round((used / total) * 100 * 100) / 100;
}

function categoryLabel(category: number) {
    return category > 0 ? `Category ${category}` : 'Uncategorized';
}

function isDefaultCategory(category: { name: string }) {
    return category.name.trim().toLowerCase() === 'default';
}

function getSystemPrefersDark() {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
}

function getTeamInitial(page: PublicPageSummary | null) {
    const source = page?.team_name?.trim() || page?.title?.trim() || 'Dashboard';
    const match = source.match(/[A-Za-z0-9]/);

    return match ? match[0]!.toUpperCase() : 'D';
}

function normalizeHexColor(color?: string | null) {
    if (!color) {
        return null;
    }

    const value = color.trim();
    const shortHex = /^#([0-9a-fA-F]{3})$/;
    const longHex = /^#([0-9a-fA-F]{6})$/;

    if (shortHex.test(value)) {
        const [, hex] = value.match(shortHex)!;
        return `#${hex
            .split('')
            .map((char) => char + char)
            .join('')}`;
    }

    if (longHex.test(value)) {
        return value;
    }

    return null;
}

function getAvatarTextColor(backgroundColor?: string | null) {
    const normalized = normalizeHexColor(backgroundColor);

    if (!normalized) {
        return '#ffffff';
    }

    const red = parseInt(normalized.slice(1, 3), 16);
    const green = parseInt(normalized.slice(3, 5), 16);
    const blue = parseInt(normalized.slice(5, 7), 16);

    // Use the inverted color as the base, then bias it slightly for readability.
    const inverted = {
        red: 255 - red,
        green: 255 - green,
        blue: 255 - blue,
    };
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    const bias = luminance > 186 ? 32 : -32;
    const adjust = (channel: number) => Math.min(255, Math.max(0, channel + bias));

    return `rgb(${adjust(inverted.red)}, ${adjust(inverted.green)}, ${adjust(inverted.blue)})`;
}

function resolveAvatarUrl(rawUrl?: string | null) {
    const value = rawUrl?.trim();

    if (!value) {
        return null;
    }

    try {
        return new URL(value, window.location.origin).toString();
    } catch {
        return value;
    }
}

function TeamAvatar({ page }: { page: PublicPageSummary | null }) {
    const [imageError, setImageError] = useState(false);
    const avatarUrl = resolveAvatarUrl(page?.team_avatar);
    const fallbackLabel = getTeamInitial(page);
    const backgroundColor = normalizeHexColor(page?.team_color) || '#6b7280';
    const textColor = getAvatarTextColor(backgroundColor);

    useEffect(() => {
        setImageError(false);
    }, [avatarUrl]);

    if (avatarUrl && !imageError) {
        return (
            <img
                src={avatarUrl}
                alt={page?.team_name?.trim() || page?.title?.trim() || 'Team avatar'}
                className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5"
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor, color: textColor }}
            aria-label={page?.team_name?.trim() || page?.title?.trim() || 'Team avatar'}
        >
            {fallbackLabel}
        </div>
    );
}

function toServerCard(
    server: PublicMonitor,
    statuses: Record<string, ServerStatus>,
    now: number | null
): Server {
    const info = statuses[String(server.id)];
    const disks = normalizeServerDisks(info);
    const primaryDisk = getPrimaryServerDisk(disks);
    const isOnline =
        info && now ? now * 1000 - new Date(info.time).getTime() < ONLINE_THRESHOLD_MS : false;

    return {
        id: server.id,
        name: server.name,
        os: server.os ?? null,
        location: server.county ?? null,
        locationName: server.area ?? null,
        status: isOnline ? 'online' : 'offline',
        lastSeen: info?.time ?? null,
        cpu: info?.cpu ?? 0,
        memory: toPercent(info?.mem_used_mb ?? 0, info?.mem_total_mb ?? 0),
        memory_used: info?.mem_used_mb ?? 0,
        memory_total: info?.mem_total_mb ?? 0,
        swap: toPercent(info?.swap_used_mb ?? 0, info?.swap_total_mb ?? 0),
        swap_used: info?.swap_used_mb ?? 0,
        swap_total: info?.swap_total_mb ?? 0,
        disk: primaryDisk.usage,
        disk_used: primaryDisk.used,
        disk_total: primaryDisk.total,
        disks,
        uptime: formatUptime(server.open_time ?? ''),
        networkUp: info?.rx_kib_s ?? 0,
        networkDown: info?.tx_kib_s ?? 0,
        networkUpTotal: info?.rx_total_mb ?? 0,
        networkDownTotal: info?.tx_total_mb ?? 0,
        diskReadKibS: info?.disk_read_kib_s ?? 0,
        diskWriteKibS: info?.disk_write_kib_s ?? 0,
        diskReadIOPS: info?.disk_read_iops ?? 0,
        diskWriteIOPS: info?.disk_write_iops ?? 0,
        tcpTotal: info?.tcp_total ?? 0,
        udpTotal: info?.udp_total ?? 0,
        provider: server.provider ?? null,
        cycle: server.cycle ?? null,
        start_time: server.start_time ?? null,
        end_time: server.end_time ?? null,
        amount: server.amount ?? null,
        bandwidth: server.bandwidth ?? null,
        traffic: server.traffic ?? null,
        note_public: server.note_public ?? null,
        core_c: server.core_c ?? null,
        core_t: server.core_t ?? null,
    };
}

export default function Dashboard() {
    const { name } = useParams();
    const {
        bootstrapState,
        streamState,
        page,
        servers,
        status,
        categories: apiCategories,
        now,
        errorMessage,
        retry,
    } = usePublicPreview(name);

    const { theme, setTheme } = useTheme();
    const [layout, setLayout] = useState<DashboardLayout>(() => readLayoutPreference());
    const [showDetails, setShowDetails] = useState(() => readDetailsPreference());
    // Mounted controls fade-in animations for real content.
    const [mounted, setMounted] = useState(false);
    // Control skeleton visibility so it can fade out smoothly.
    const [showSkeleton, setShowSkeleton] = useState(bootstrapState === 'loading');
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [prefersDark, setPrefersDark] = useState(getSystemPrefersDark);
    const [showAllOverviewCards, setShowAllOverviewCards] = useState(false);
    const isDarkMode = theme === 'dark' || (theme === 'system' && prefersDark);

    useEffect(() => {
        localStorage.setItem(STORAGE_LAYOUT_KEY, layout);
    }, [layout]);

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') {
            return;
        }

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setPrefersDark(media.matches);

        handleChange();
        media.addEventListener('change', handleChange);

        return () => media.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_DETAILS_KEY, String(showDetails));
    }, [showDetails]);

    useEffect(() => {
        // When loading starts, show skeleton and hide content.
        if (bootstrapState === 'loading') {
            setShowSkeleton(true);
            setMounted(false);
        } else {
            // Start fading in content slightly after loading ends
            setTimeout(() => setMounted(true), 60);
            // Fade out skeleton, then remove after duration
            setTimeout(() => setShowSkeleton(false), 420);
        }
    }, [bootstrapState]);

    const categories = useMemo(() => {
        // Build a map of category id -> { id, name, sort }
        const map = new Map<number, { id: number; name: string; sort: number }>();

        // Add categories from API first (preserves names & sort)
        (apiCategories ?? []).forEach((c: Category) => {
            map.set(c.id, { id: c.id, name: c.name, sort: c.sort ?? 0 });
        });

        // Ensure any categories referenced by servers are present (fallback name)
        for (const server of servers) {
            const id = server.category ?? 0;
            if (!map.has(id)) {
                // Give unknown categories a large sort so API-defined categories remain ordered
                map.set(id, { id, name: categoryLabel(id), sort: 1_000_000 });
            }
        }

        // Convert and sort by sort then id
        return Array.from(map.values())
            .sort((a, b) => a.sort - b.sort || a.id - b.id)
            .map(({ id, name }) => ({ id, name }));
    }, [servers, apiCategories]);

    const categoryServerMap = useMemo(() => {
        const map: Record<number, Server[]> = {};

        for (const server of servers) {
            const key = server.category ?? 0;
            if (!map[key]) {
                map[key] = [];
            }

            map[key].push(toServerCard(server, status, now));
        }

        return map;
    }, [now, servers, status]);

    const visibleCategories = useMemo(() => {
        return categories.filter((category) => {
            const categoryServers = categoryServerMap[category.id] ?? [];

            return !isDefaultCategory(category) || categoryServers.length > 0;
        });
    }, [categories, categoryServerMap]);

    useEffect(() => {
        if (
            categoryFilter !== null &&
            !visibleCategories.some((category) => category.id === categoryFilter)
        ) {
            setCategoryFilter(null);
        }
    }, [visibleCategories, categoryFilter]);

    const visibleServers = useMemo(() => {
        return categoryFilter == null
            ? visibleCategories.flatMap((category) => categoryServerMap[category.id] ?? [])
            : (categoryServerMap[categoryFilter] ?? []);
    }, [visibleCategories, categoryFilter, categoryServerMap]);

    const overview = useMemo(() => {
        const total = visibleServers.length;
        const online = visibleServers.filter((server) => server.status === 'online');

        return {
            total,
            online: online.length,
            avgCpu:
                total > 0
                    ? online.reduce((sum, server) => sum + server.cpu, 0) / Math.max(total, 1)
                    : 0,
            avgMemory:
                total > 0
                    ? online.reduce((sum, server) => sum + server.memory, 0) / Math.max(total, 1)
                    : 0,
            sumRX: online.reduce((sum, server) => sum + server.networkUp, 0),
            sumTX: online.reduce((sum, server) => sum + server.networkDown, 0),
        };
    }, [visibleServers]);

    const extraOverviewStats = useMemo(() => {
        let totalCpuCores = 0;
        let hasCpuCores = false;
        let totalMemoryMb = 0;
        let totalStorageGb = 0;
        let totalBandwidthRxMb = 0;
        let totalBandwidthTxMb = 0;

        for (const server of visibleServers) {
            if (typeof server.core_c === 'number' || typeof server.core_t === 'number') {
                totalCpuCores += server.core_c ?? server.core_t ?? 0;
                hasCpuCores = true;
            }

            totalMemoryMb += server.memory_total || 0;
            totalStorageGb +=
                server.disks?.reduce((sum, disk) => sum + (disk.total || 0), 0) ||
                server.disk_total ||
                0;
            totalBandwidthRxMb += server.networkUpTotal || 0;
            totalBandwidthTxMb += server.networkDownTotal || 0;
        }

        return {
            totalCpuCores: hasCpuCores ? totalCpuCores.toString() : '--',
            totalMemory: MemoryUnit(totalMemoryMb, 'mb'),
            totalStorage: MemoryUnit(totalStorageGb, 'gb'),
            totalBandwidthRx: MemoryUnit(totalBandwidthRxMb, 'mb'),
            totalBandwidthTx: MemoryUnit(totalBandwidthTxMb, 'mb'),
        };
    }, [visibleServers]);

    const extraOverviewCards = [
        {
            label: 'Total Storage',
            value: extraOverviewStats.totalStorage,
            icon: <Database className="h-3 w-3 md:h-5 md:w-5 text-chart-4" />,
            iconClassName: 'bg-chart-4/10',
        },
        {
            label: 'Total CPU Cores',
            value: extraOverviewStats.totalCpuCores,
            icon: <Cpu className="h-3 w-3 md:h-5 md:w-5 text-chart-1" />,
            iconClassName: 'bg-chart-1/10',
        },
        {
            label: 'Total Memory',
            value: extraOverviewStats.totalMemory,
            icon: <MemoryStick className="h-3 w-3 md:h-5 md:w-5 text-chart-3" />,
            iconClassName: 'bg-chart-3/10',
        },
        {
            label: 'Bandwidth (Total)',
            value: '',
            icon: <ArrowUpDown className="h-3 w-3 md:h-5 md:w-5 text-chart-2" />,
            iconClassName: 'bg-chart-2/10',
            bandwidthTotal: true,
        },
    ];

    // We render the main content below and overlay a skeleton when `showSkeleton` is true.

    if (bootstrapState === 'not_found') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <Card className="max-w-lg p-6">
                    <div className="flex items-center gap-3">
                        <WifiOff className="text-muted-foreground" />
                        <div>
                            <h1 className="text-xl font-semibold">Public page not found</h1>
                            <p className="text-sm text-muted-foreground">
                                The requested preview name or custom domain is not enabled.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (bootstrapState === 'error') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <Card className="max-w-lg p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <WifiOff className="text-muted-foreground" />
                            <div>
                                <h1 className="text-xl font-semibold">
                                    Unable to load status page
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {errorMessage ?? 'Failed to load public preview data'}
                                </p>
                            </div>
                        </div>
                        <Button onClick={retry}>
                            <RotateCw />
                            Retry
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full p-5 h-full overflow-y-auto pb-24 min-h-screen relative flex justify-center">
            <div className="w-full max-w-[1800px] relative">
                {/* Skeleton overlay */}
                {showSkeleton ? (
                    <div
                        className="absolute inset-0 z-40 bg-transparent flex items-start justify-center pointer-events-none transition-opacity duration-400 overflow-hidden h-screen"
                        style={{ opacity: bootstrapState === 'loading' ? 1 : 0 }}
                    >
                        <div className="w-full">
                            <div className="mb-3 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-muted-foreground/10 animate-pulse" />
                                    <div>
                                        <div className="h-8 w-48 bg-muted-foreground/10 rounded animate-pulse" />
                                        <div className="h-4 w-64 bg-muted-foreground/8 rounded mt-2 animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <div className="h-6 w-28 bg-muted-foreground/8 rounded animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="border-border bg-card p-4 animate-pulse rounded-xl border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-muted-foreground/10 p-2 h-10 w-10" />
                                                <div>
                                                    <div className="h-3 w-28 bg-muted-foreground/10 rounded mb-2" />
                                                    <div className="h-6 w-24 bg-muted-foreground/8 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <SkeletonCard key={i} layout={'grid'} />
                                    ))}
                                </div>

                                <div className="mt-4 flex flex-col gap-2 lg:flex-row justify-between lg:items-center">
                                    <div className="flex flex-col sm:flex-row justify-between lg:justify-start gap-2">
                                        <div className="h-8 w-56 bg-muted-foreground/8 rounded animate-pulse" />
                                    </div>
                                    <div className="flex-row justify-end gap-2 hidden sm:flex">
                                        <div className="h-8 w-40 bg-muted-foreground/8 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Main content (will fade in) */}
                <div style={{ transition: 'opacity 400ms ease', opacity: mounted ? 1 : 0 }}>
                    <div
                        className="mb-3 flex flex-row items-center justify-between"
                        style={{
                            transition: 'opacity 400ms ease, transform 400ms ease',
                            transitionDelay: '0ms',
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'none' : 'translateY(6px)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <TeamAvatar page={page} />
                            <div>
                                <h1 className="text-2xl font-bold">{page?.title ?? 'Dashboard'}</h1>
                                <p className="opacity-65">
                                    {page?.description ||
                                        'Monitor your infrastructure in real-time'}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            {now ? (
                                <>
                                    <p className="text-sm text-muted-foreground hidden lg:flex">
                                        Updated {new Date(now * 1000).toLocaleString()}
                                    </p>
                                    <Badge>
                                        {streamState === 'live' ? <CloudLightning /> : <RotateCw />}
                                        {streamState === 'live' ? 'Live' : 'Snapshot'}
                                    </Badge>
                                </>
                            ) : null}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        className="shrink-0"
                                        aria-label={
                                            isDarkMode
                                                ? 'Switch to light mode'
                                                : 'Switch to dark mode'
                                        }
                                        onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                                    >
                                        {isDarkMode ? (
                                            <Sun className="h-4 w-4" />
                                        ) : (
                                            <Moon className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    {isDarkMode ? 'Light mode' : 'Dark mode'}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <div>
                        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                            <div
                                style={{
                                    transition: 'opacity 400ms ease, transform 400ms ease',
                                    transitionDelay: '0ms',
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'none' : 'translateY(6px)',
                                }}
                            >
                                <Card className="border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-primary/10 p-2">
                                            <ServerIcon className="h-3 w-3 md:h-5 md:w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                Total Servers
                                            </p>
                                            <p className="text-xl md:text-2xl font-semibold text-card-foreground h-[2rem]">
                                                {overview.online} / {overview.total}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div
                                style={{
                                    transition: 'opacity 400ms ease, transform 400ms ease',
                                    transitionDelay: '80ms',
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'none' : 'translateY(6px)',
                                }}
                            >
                                <Card className="border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-chart-1/10 p-2">
                                            <Cpu className="h-3 w-3 md:h-5 md:w-5 text-chart-1" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                Avg CPU
                                            </p>
                                            <p className="text-xl md:text-2xl font-semibold text-card-foreground h-[2rem]">
                                                {overview.avgCpu.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div
                                style={{
                                    transition: 'opacity 400ms ease, transform 400ms ease',
                                    transitionDelay: '160ms',
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'none' : 'translateY(6px)',
                                }}
                            >
                                <Card className="border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-chart-3/10 p-2">
                                            <HardDrive className="h-3 w-3 md:h-5 md:w-5 text-chart-3" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                Avg Memory
                                            </p>
                                            <p className="text-xl md:text-2xl font-semibold text-card-foreground h-[2rem]">
                                                {overview.avgMemory.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div
                                style={{
                                    transition: 'opacity 400ms ease, transform 400ms ease',
                                    transitionDelay: '240ms',
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'none' : 'translateY(6px)',
                                }}
                            >
                                <Card className="border-border bg-card p-4">
                                    <div className="flex items-center h-full gap-3">
                                        <div className="rounded-lg bg-chart-2/10 p-2">
                                            <ArrowUpDown className="h-3 w-3 md:h-5 md:w-5 text-chart-2" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                Network Traffic
                                            </p>
                                            <p className="text-xs 2xl:text-sm font-semibold text-card-foreground flex flex-col mt-1 -mb-1 2xl:my-0 2xl:flex-row 2xl:items-center 2xl:gap-1 h-[2rem]">
                                                <div className={'flex flex-row items-center gap-1'}>
                                                    <ArrowUp className="h-3 w-3 2xl:h-4 2xl:w-4" />
                                                    {MemoryUnit(overview.sumTX, 'kb') + '/s'}
                                                </div>
                                                <div className={'flex flex-row items-center gap-1'}>
                                                    <ArrowDown className="h-3 w-3 2xl:h-4 2xl:w-4" />
                                                    {MemoryUnit(overview.sumRX, 'kb') + '/s'}
                                                </div>
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div
                            className={cn(
                                'overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-200 ease-out',
                                showAllOverviewCards
                                    ? 'mt-4 max-h-80 opacity-100 translate-y-0'
                                    : 'mt-0 max-h-0 opacity-0 -translate-y-2'
                            )}
                        >
                            <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                                {extraOverviewCards.map((item, index) => (
                                    <Card
                                        key={item.label}
                                        className="border-border bg-card p-4"
                                        style={{
                                            transition: 'opacity 200ms ease, transform 200ms ease',
                                            transitionDelay: showAllOverviewCards
                                                ? `${index * 35}ms`
                                                : '0ms',
                                            opacity: mounted && showAllOverviewCards ? 1 : 0,
                                            transform:
                                                mounted && showAllOverviewCards
                                                    ? 'none'
                                                    : 'translateY(-6px)',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn('rounded-lg p-2', item.iconClassName)}
                                            >
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm text-muted-foreground">
                                                    {item.label}
                                                </p>
                                                {item.bandwidthTotal ? (
                                                    <div className="text-xs 2xl:text-sm font-semibold text-card-foreground flex flex-col mt-1 -mb-1 2xl:my-0 2xl:flex-row 2xl:items-center 2xl:gap-1 h-[2rem]">
                                                        <div className="flex flex-row items-center gap-1">
                                                            <ArrowUp className="h-3 w-3 2xl:h-4 2xl:w-4" />
                                                            {extraOverviewStats.totalBandwidthTx}
                                                        </div>
                                                        <div className="flex flex-row items-center gap-1">
                                                            <ArrowDown className="h-3 w-3 2xl:h-4 2xl:w-4" />
                                                            {extraOverviewStats.totalBandwidthRx}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="truncate text-xl md:text-2xl font-semibold text-card-foreground">
                                                        {item.value}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2 flex-row justify-between lg:items-center w-full">
                            <ButtonGroup className="border rounded-lg">
                                <Button
                                    variant="ghost"
                                    className={categoryFilter == null ? 'bg-accent' : ''}
                                    onClick={() => setCategoryFilter(null)}
                                >
                                    All
                                </Button>
                                {visibleCategories.slice(0, 3).map((category, index) => (
                                    <Button
                                        key={category.id}
                                        variant="ghost"
                                        className={cn(
                                            index < visibleCategories.length - 1
                                                ? 'border-e'
                                                : undefined,
                                            categoryFilter == category.id ? 'bg-accent' : ''
                                        )}
                                        onClick={() => setCategoryFilter(category.id)}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                                {visibleCategories.length > 3 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    categoryFilter &&
                                                        visibleCategories
                                                            .slice(3)
                                                            .some(
                                                                (item) => item.id === categoryFilter
                                                            )
                                                        ? 'bg-accent'
                                                        : ''
                                                )}
                                            >
                                                ...
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-40 mt-2 p-0 bg-background">
                                            <div className="space-y-2">
                                                {visibleCategories.slice(3).map((item) => (
                                                    <Button
                                                        key={item.id}
                                                        variant="ghost"
                                                        className={cn(
                                                            'w-full justify-start',
                                                            categoryFilter == item.id
                                                                ? 'bg-accent'
                                                                : ''
                                                        )}
                                                        onClick={() => setCategoryFilter(item.id)}
                                                    >
                                                        {item.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </ButtonGroup>
                            <div className="flex-row justify-end gap-2">
                                <ButtonGroup>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowAllOverviewCards((visible) => !visible)
                                                }
                                            >
                                                <StretchHorizontal />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="me-2">
                                            {showAllOverviewCards ? (
                                                <p>Hide Overview Cards</p>
                                            ) : (
                                                <p>Show All Overview Cards</p>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                    <LayoutBtn layout={layout} onChange={setLayout} />
                                    <DetailBtn
                                        showDetails={showDetails}
                                        onChange={setShowDetails}
                                    />
                                </ButtonGroup>
                            </div>
                        </div>

                        {categoryFilter == null
                            ? visibleCategories.map((category) =>
                                  categoryServerMap[category.id] ? (
                                      <CategorySection
                                          key={category.id}
                                          title={category.name}
                                          layout={layout}
                                          servers={categoryServerMap[category.id]}
                                          showDetails={showDetails}
                                          mounted={mounted}
                                      />
                                  ) : (
                                      <div key={category.id}>
                                          <div className="mt-4">
                                              <p className="mt-4 opacity-65">{category.name}</p>
                                          </div>
                                          <div className="mt-2">
                                              <p className="text-sm text-muted-foreground/50">
                                                  No servers in this category.
                                              </p>
                                          </div>
                                      </div>
                                  )
                              )
                            : visibleCategories
                                  .filter((category) => category.id === categoryFilter)
                                  .map((category) =>
                                      categoryServerMap[category.id] ? (
                                          <CategorySection
                                              key={category.id}
                                              title={category.name}
                                              layout={layout}
                                              servers={categoryServerMap[category.id]}
                                              showDetails={showDetails}
                                              mounted={mounted}
                                          />
                                      ) : (
                                          <div key={category.id}>
                                              <div className="mt-4">
                                                  <p className="mt-4 opacity-65">{category.name}</p>
                                              </div>
                                              <div className="mt-2">
                                                  <p className="text-sm text-muted-foreground/50">
                                                      No servers in this category.
                                                  </p>
                                              </div>
                                          </div>
                                      )
                                  )}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-center w-full max-w-[1800px] text-xs text-muted-foreground">
                Powered by{' '}
                <a
                    href="https://github.com/mosona-labs/mosona-manager"
                    target="_blank"
                    className="text-primary hover:underline"
                >
                    Mosona Manager
                </a>
            </div>
        </div>
    );
}
