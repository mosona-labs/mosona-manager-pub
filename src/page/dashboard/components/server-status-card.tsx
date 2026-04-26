import type { DashboardLayout, Server, ServerDisk } from './type';

import {
    Cpu,
    HardDrive,
    Database,
    Clock,
    ArrowUp,
    ArrowDown,
    ReceiptText,
    ChevronDown,
    HardDriveDownload,
    HardDriveUpload,
    MemoryStick,
    ArrowUpDown,
    ChevronUp,
    Unplug,
    ClockAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MemoryUnit, NetUnit } from '@/utils/unit';
import { osIcons } from '@/utils/icon';
import { formatUptime, getRemainingTime } from '@/utils/time';

const cycleMap: Record<number, string> = {
    1: 'Mo',
    2: 'Qu',
    3: 'Hy',
    4: 'Ye',
};

const STATUS_COLORS = {
    online: 'bg-green-500/30',
    warning: 'bg-orange-500/30',
    offline: 'bg-red-500/30',
} as const;

const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-red-400/50';
    if (value >= 60) return 'bg-orange-500/60';
    return 'bg-green-500/60';
};

const fallbackDisk: ServerDisk = {
    label: 'Disk 1',
    mountPoint: '/',
    usage: 0,
    used: 0,
    total: 0,
    isRoot: true,
};

const DiskSection = ({
    disks,
    showMore,
    isOffline,
    layout,
}: {
    disks: ServerDisk[];
    showMore: boolean;
    isOffline: boolean;
    layout: DashboardLayout;
}) => {
    const disksToRender = (showMore ? disks : disks.slice(0, 1)).length
        ? showMore
            ? disks
            : disks.slice(0, 1)
        : [fallbackDisk];
    const primaryDisk = disks[0] || fallbackDisk;

    if (layout !== 'grid') {
        return (
            <div className="space-y-1 min-w-0">
                <div className="flex flex-col gap-1">
                    <div className="text-sm flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <Database className="h-3.5 w-3.5 shrink-0" />
                        <span>Disk</span>
                        {disks.length > 1 && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
                                +{disks.length - 1}
                            </span>
                        )}
                    </div>
                    <span className="font-mono font-medium text-card-foreground">
                        {isOffline ? '--' : primaryDisk.usage}%
                        {showMore && (
                            <div
                                className={cn(
                                    'text-muted-foreground text-xs truncate',
                                    layout === 'list2' && 'xl:block hidden'
                                )}
                            >
                                {primaryDisk.mountPoint} ·{' '}
                                {MemoryUnit(isOffline ? 0 : primaryDisk.used, 'gb')}/
                                {MemoryUnit(primaryDisk.total, 'gb')}
                            </div>
                        )}
                    </span>
                </div>
                <Progress
                    value={isOffline ? 0 : primaryDisk.usage}
                    className="h-1"
                    color={getProgressColor(primaryDisk.usage)}
                />
            </div>
        );
    }

    return (
        <>
            {disksToRender.map((disk, index) => (
                <div
                    key={`${disk.label}-${disk.mountPoint}`}
                    className={cn('space-y-1.5', index > 0 && 'border-t border-border/60 pt-2')}
                >
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Database className="h-3.5 w-3.5" />
                            <span>{showMore ? disk.label : 'Disk'}</span>
                            {showMore && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                                    {disk.mountPoint}
                                </span>
                            )}
                        </div>
                        <span className="font-mono font-medium text-card-foreground">
                            {isOffline ? '--' : disk.usage}%
                            {showMore && (
                                <span className="text-muted-foreground">
                                    {' '}
                                    ({MemoryUnit(isOffline ? 0 : disk.used, 'gb')}/
                                    {MemoryUnit(disk.total, 'gb')})
                                </span>
                            )}
                        </span>
                    </div>
                    <Progress
                        value={isOffline ? 0 : disk.usage}
                        className={layout === 'grid' ? 'h-1.5' : 'h-1'}
                        color={getProgressColor(disk.usage)}
                    />
                </div>
            ))}
        </>
    );
};

export default function ServerStatusCard({
    server,
    layout,
    detailsExpanded,
}: {
    server: Server;
    layout: DashboardLayout;
    detailsExpanded: boolean;
}) {
    const rx = useMemo(() => NetUnit(server.networkDown, 'kb'), [server.networkDown]);
    const tx = useMemo(() => NetUnit(server.networkUp, 'kb'), [server.networkUp]);

    const rxTotal = useMemo(
        () => NetUnit(server.networkDownTotal, 'mb'),
        [server.networkDownTotal]
    );
    const txTotal = useMemo(() => NetUnit(server.networkUpTotal, 'mb'), [server.networkUpTotal]);

    const diskRead = useMemo(() => NetUnit(server.diskReadKibS, 'kb'), [server.diskReadKibS]);
    const diskWrite = useMemo(() => NetUnit(server.diskWriteKibS, 'kb'), [server.diskWriteKibS]);

    const remainingTime = useMemo(() => {
        if ((server.start_time || (server.cycle && server.cycle > 0)) && server.end_time) {
            const startTime = server.cycle
                ? new Date(server.end_time).getTime() -
                  (server.cycle === 1 ? 1 : (server.cycle - 1) * 3) * 30 * 24 * 60 * 60 * 1000
                : server.start_time
                  ? new Date(server.start_time).getTime()
                  : 0;
            const endTime = new Date(server.end_time).getTime();
            const currentTime = Date.now();

            const totalDuration = endTime - startTime;
            const remainingDuration = Math.max(endTime - currentTime, 0);
            const progress = Math.min(Math.max((remainingDuration / totalDuration) * 100, 0), 100);

            const days = Math.floor(remainingDuration / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (remainingDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const minutes = Math.floor((remainingDuration % (1000 * 60 * 60)) / (1000 * 60));

            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            if (hours > 0) timeString += `${hours}h `;
            if (minutes > 0) timeString += `${minutes}m`;

            return {
                time: timeString.trim(),
                progress,
            };
        }
        return {
            time: '',
            progress: 0,
        };
    }, [server.cycle, server.end_time, server.start_time]);

    const [showMoreBtn, setShowMoreBtn] = useState(false);
    const [showMore, setShowMore] = useState<boolean>(() => detailsExpanded);

    useEffect(() => {
        setShowMore(detailsExpanded);
    }, [detailsExpanded]);

    const handleToggleMore = useCallback((event?: MouseEvent) => {
        if (event) event.stopPropagation();
        setShowMore((value) => !value);
    }, []);

    return (
        <Card
            className={cn(
                'border-border bg-card p-5 transition-all hover:border-primary/50 h-full',
                layout !== 'grid' && 'py-3.5 gap-3.5'
            )}
            onMouseEnter={() => setShowMoreBtn(true)}
            onMouseLeave={() => setShowMoreBtn(false)}
            data-testid={`server-card-${server.id}`}
        >
            {layout === 'grid' ? (
                <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-2xl flex-shrink-0">
                                <img
                                    src={`/icons/${server.os && osIcons.includes(server.os.toLowerCase()) ? server.os.toLowerCase() : 'linux'}.svg`}
                                    alt="OS"
                                    className="h-6 w-6"
                                />
                            </div>
                            <div>
                                <h3 className="font-mono text-sm font-semibold text-card-foreground">
                                    {server.name}
                                </h3>
                                <Tags server={server} />
                            </div>
                        </div>
                        <Badge
                            className={cn(
                                'text-xs font-medium text-foreground',
                                STATUS_COLORS[server.status]
                            )}
                        >
                            {server.status}
                        </Badge>
                    </div>

                    <div className={cn('space-y-3', showMore ? '' : '-mb-3')}>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Cpu className="h-3.5 w-3.5" />
                                    <span>CPU</span>
                                </div>
                                <span className="font-mono font-medium text-card-foreground">
                                    {server.status === 'offline'
                                        ? '--'
                                        : parseFloat(server.cpu.toFixed(2))}
                                    %
                                </span>
                            </div>
                            <Progress
                                value={server.status === 'offline' ? 0 : server.cpu}
                                className="h-1.5"
                                color={getProgressColor(server.cpu)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MemoryStick className="h-3.5 w-3.5" />
                                    <span>Memory</span>
                                </div>
                                <span className="font-mono font-medium text-card-foreground">
                                    {server.status === 'offline' ? '--' : server.memory}%
                                    {showMore && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            (
                                            {MemoryUnit(
                                                server.status === 'offline'
                                                    ? 0
                                                    : server.memory_used,
                                                'mb'
                                            )}
                                            /{MemoryUnit(server.memory_total, 'mb')})
                                        </span>
                                    )}
                                </span>
                            </div>
                            <Progress
                                value={server.status === 'offline' ? 0 : server.memory}
                                className="h-1.5 text-red-500"
                                color={getProgressColor(server.memory)}
                            />
                        </div>

                        {showMore && server.swap_total > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <MemoryStick className="h-3.5 w-3.5" />
                                        <span>SWAP</span>
                                    </div>
                                    <span className="font-mono font-medium text-card-foreground">
                                        {server.status === 'offline' ? '--' : server.swap}%
                                        <span className="text-muted-foreground">
                                            {' '}
                                            (
                                            {MemoryUnit(
                                                server.status === 'offline' ? 0 : server.swap_used,
                                                'mb'
                                            )}
                                            /{MemoryUnit(server.swap_total, 'mb')})
                                        </span>
                                    </span>
                                </div>
                                <Progress
                                    value={server.status === 'offline' ? 0 : server.swap}
                                    className="h-1.5 text-red-500"
                                    color={getProgressColor(server.swap)}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <DiskSection
                                disks={server.disks}
                                showMore={showMore}
                                isOffline={server.status === 'offline'}
                                layout={layout}
                            />
                        </div>

                        {remainingTime.time !== '' && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <ReceiptText className="h-3.5 w-3.5" />
                                        <span>Remaining</span>
                                    </div>
                                    <span className="font-mono font-medium text-card-foreground">
                                        {remainingTime.time}
                                    </span>
                                </div>
                                <Progress
                                    value={remainingTime.progress}
                                    className="h-1.5"
                                    color={getProgressColor(100 - remainingTime.progress)}
                                />
                            </div>
                        )}

                        <Details
                            showMore={showMore}
                            server={server}
                            diskRead={diskRead}
                            diskWrite={diskWrite}
                            rxTotal={rxTotal}
                            txTotal={txTotal}
                        />
                    </div>
                    <button
                        type="button"
                        className="flex items-center justify-between border-t border-border pt-3 text-xs transition-all duration-300 mt-auto w-full text-left"
                        onClick={handleToggleMore}
                        aria-expanded={showMore}
                        aria-label={`${showMore ? 'Hide' : 'Show'} details for ${server.name}`}
                    >
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            {server.status === 'offline' ? (
                                <ClockAlert className="h-3.5 w-3.5" />
                            ) : (
                                <Clock className="h-3.5 w-3.5" />
                            )}
                            <span className="font-mono">
                                {server.status === 'offline'
                                    ? formatUptime(server.lastSeen || '')
                                    : server.uptime}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center gap-1">
                                <ArrowUp className="h-3 w-3" />
                                <span className="font-mono">{rx.value}</span>
                                <span className="text-muted-foreground">{rx.unit}/s</span>
                            </div>
                            <div className="flex items-center gap-1 ms-3">
                                <ArrowDown className="h-3 w-3" />
                                <span className="font-mono">{tx.value}</span>
                                <span className="text-muted-foreground">{tx.unit}/s</span>
                            </div>
                            <div
                                className={cn(
                                    'bg-accent-foreground rounded-full transition-all overflow-hidden',
                                    showMoreBtn ? 'w-3 ms-3' : 'w-0 p-0'
                                )}
                            >
                                {showMore ? (
                                    <ChevronUp strokeWidth={4} size={12} className="text-accent" />
                                ) : (
                                    <ChevronDown
                                        strokeWidth={4}
                                        size={12}
                                        className="text-accent"
                                    />
                                )}
                            </div>
                        </div>
                    </button>
                </div>
            ) : (
                <>
                    <div
                        className={cn(
                            'flex flex-col items-center gap-4',
                            layout === 'list' && 'lg:flex-row'
                        )}
                    >
                        <div className="flex items-center gap-3 w-full lg:flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-2xl flex-shrink-0">
                                <img
                                    src={`/icons/${server.os && osIcons.includes(server.os.toLowerCase()) ? server.os.toLowerCase() : 'linux'}.svg`}
                                    alt="OS"
                                    className="h-6 w-6"
                                />
                            </div>
                            <div>
                                <h3 className="flex flex-row items-center gap-2 font-mono text-sm font-semibold text-card-foreground">
                                    {server.name}
                                    <div className="relative flex items-center justify-center w-3 h-3 mb-0.5">
                                        <div
                                            className={cn(
                                                'absolute w-2 h-2 rounded-full animate-ping',
                                                server.status === 'online'
                                                    ? 'bg-green-500/50'
                                                    : server.status === 'warning'
                                                      ? 'bg-orange-500/50'
                                                      : 'bg-red-500/50'
                                            )}
                                        ></div>
                                        <div
                                            className={cn(
                                                'relative w-2 h-2 rounded-full',
                                                server.status === 'online'
                                                    ? 'bg-green-500'
                                                    : server.status === 'warning'
                                                      ? 'bg-orange-500'
                                                      : 'bg-red-500'
                                            )}
                                        ></div>
                                    </div>
                                </h3>
                                <Tags server={server} showUptime />
                            </div>
                        </div>
                        <div className="flex flex-row w-full items-center gap-4 flex-3">
                            <div className="space-y-1 flex-1">
                                <div className="flex flex-col gap-1">
                                    <div className="text-sm flex items-center gap-1.5 text-muted-foreground">
                                        <Cpu className="h-3.5 w-3.5" />
                                        <span>CPU</span>
                                    </div>
                                    <span className="font-mono font-medium text-card-foreground">
                                        {server.status === 'offline'
                                            ? '--'
                                            : parseFloat(server.cpu.toFixed(2))}
                                        %
                                        {showMore && (
                                            <div
                                                className={cn(
                                                    'text-muted-foreground text-xs',
                                                    layout === 'list2' && 'xl:block hidden'
                                                )}
                                            >
                                                ({server.os})
                                            </div>
                                        )}
                                    </span>
                                </div>
                                <Progress
                                    value={server.status === 'offline' ? 0 : server.cpu}
                                    className="h-1"
                                    color={getProgressColor(server.cpu)}
                                />
                            </div>
                            <div className="space-y-1 flex-1">
                                <div className="flex flex-col gap-1">
                                    <div className="text-sm flex items-center gap-1.5 text-muted-foreground">
                                        <MemoryStick className="h-3.5 w-3.5" />
                                        <span>Memory</span>
                                    </div>
                                    <span className="font-mono font-medium text-card-foreground">
                                        {server.status === 'offline' ? '--' : server.memory}%
                                        {showMore && (
                                            <div
                                                className={cn(
                                                    'text-muted-foreground text-xs',
                                                    layout === 'list2' && 'xl:block hidden'
                                                )}
                                            >
                                                {' '}
                                                ({MemoryUnit(server.memory_used, 'mb')}/
                                                {MemoryUnit(server.memory_total, 'mb')})
                                            </div>
                                        )}
                                    </span>
                                </div>
                                <Progress
                                    value={server.status === 'offline' ? 0 : server.memory}
                                    className="h-1 text-red-500"
                                    color={getProgressColor(server.memory)}
                                />
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                                <DiskSection
                                    disks={server.disks}
                                    showMore={showMore}
                                    isOffline={server.status === 'offline'}
                                    layout={layout}
                                />
                            </div>
                            <div className="flex text-sm items-end flex-col justify-end w-28">
                                <div className="flex items-center justify-center gap-1">
                                    <ArrowUp className="h-3 w-3" />
                                    <span className="font-mono">{rx.value}</span>
                                    <span className="text-muted-foreground">{rx.unit}/s</span>
                                </div>
                                <div className="flex items-center gap-1 ms-3">
                                    <ArrowDown className="h-3 w-3" />
                                    <span className="font-mono">{tx.value}</span>
                                    <span className="text-muted-foreground">{tx.unit}/s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {showMore && server.swap_total > 0 && (
                        <div className="space-y-1.5 border-t border-border pt-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MemoryStick className="h-3.5 w-3.5" />
                                    <span>SWAP</span>
                                </div>
                                <span className="font-mono font-medium text-card-foreground">
                                    {server.status === 'offline' ? '--' : server.swap}%
                                    <span className="text-muted-foreground">
                                        {' '}
                                        ({MemoryUnit(server.swap_used, 'mb')}/
                                        {MemoryUnit(server.swap_total, 'mb')})
                                    </span>
                                </span>
                            </div>
                            <Progress
                                value={server.status === 'offline' ? 0 : server.swap}
                                className="h-1"
                                color={getProgressColor(server.swap)}
                            />
                        </div>
                    )}
                    <Details
                        showMore={showMore}
                        server={server}
                        diskRead={diskRead}
                        diskWrite={diskWrite}
                        rxTotal={rxTotal}
                        txTotal={txTotal}
                    />
                </>
            )}
        </Card>
    );
}

function Tags({ server, showUptime }: { server: Server; showUptime?: boolean }) {
    return (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Badge className="bg-accent/70 text-accent-foreground gap-1.5">
                {server.location ? (
                    <img
                        src={`/flags/${server.location.toLowerCase()}.svg`}
                        width="16"
                        height="12"
                        alt={server.location}
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                ) : null}
                {server.locationName || 'Unknown'}
            </Badge>
            {showUptime && (
                <Badge variant="secondary" className="text-accent-foreground">
                    {server.status === 'offline' ? (
                        <>
                            <ClockAlert />
                            Offline
                        </>
                    ) : (
                        <>
                            <Clock className="h-3.5 w-3.5" />
                            {server.uptime.split(' ')[0]}
                        </>
                    )}
                </Badge>
            )}
            {server.provider && (
                <Badge className="bg-emerald-500/20 text-accent-foreground">
                    {server.provider}
                </Badge>
            )}
            {server.amount && (
                <Badge className="bg-indigo-500/20 text-accent-foreground">
                    {server.amount === '0'
                        ? 'Free'
                        : server.amount === '-1'
                          ? 'PAYG'
                          : server.amount +
                            (server.cycle
                                ? cycleMap[server.cycle]
                                    ? '/' + cycleMap[server.cycle]
                                    : ''
                                : '')}
                </Badge>
            )}
            {server.bandwidth && (
                <Badge className="bg-violet-500/20 text-accent-foreground">
                    {server.bandwidth}
                </Badge>
            )}
            {server.end_time &&
                (() => {
                    const remainingDays = getRemainingTime(server.end_time);
                    return (
                        <Badge
                            className={cn(
                                'text-accent-foreground',
                                remainingDays > 7
                                    ? 'bg-green-500/20'
                                    : remainingDays > 3
                                      ? 'bg-orange-500/20'
                                      : 'bg-red-500/20'
                            )}
                        >
                            {remainingDays < 0 ? 'Expired' : `Expired: ${remainingDays}d`}
                        </Badge>
                    );
                })()}
            {server.note_public && (
                <Badge className="bg-yellow-500/20 text-accent-foreground">
                    {server.note_public}
                </Badge>
            )}
        </div>
    );
}

function Details({
    showMore,
    server,
    diskRead,
    diskWrite,
    rxTotal,
    txTotal,
}: {
    showMore: boolean;
    server: Server;
    diskRead: { value: string; unit: string };
    diskWrite: { value: string; unit: string };
    rxTotal: { value: string; unit: string };
    txTotal: { value: string; unit: string };
}) {
    return (
        <div
            className={cn(
                'border-t border-border pt-2.5 -mb-1.5 flex flex-col gap-1.5 overflow-hidden transition-all duration-300',
                showMore ? 'h-24' : 'h-0 border-0 p-0'
            )}
        >
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>I/O</span>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center gap-1">
                        <HardDriveUpload className="h-3 w-3" />
                        <span className="font-mono">{diskRead.value}</span>
                        <span className="text-muted-foreground">{diskRead.unit}/s</span>
                    </div>
                    <div className="flex items-center gap-1 ms-3">
                        <HardDriveDownload className="h-3 w-3" />
                        <span className="font-mono">{diskWrite.value}</span>
                        <span className="text-muted-foreground">{diskWrite.unit}/s</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>IOPS</span>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center gap-1">
                        <HardDriveUpload className="h-3 w-3" />
                        <span className="font-mono">{server.diskReadIOPS.toFixed(2)}</span>
                        <span className="text-muted-foreground">ps</span>
                    </div>
                    <div className="flex items-center gap-1 ms-3">
                        <HardDriveDownload className="h-3 w-3" />
                        <span className="font-mono">{server.diskWriteIOPS.toFixed(2)}</span>
                        <span className="text-muted-foreground">ps</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Unplug className="h-3.5 w-3.5" />
                    <span>Connections</span>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-muted-foreground">TCP</span>
                        <span className="font-mono">{server.tcpTotal}</span>
                    </div>
                    <div className="flex items-center gap-1 ms-3">
                        <span className="font-mono text-muted-foreground">UDP</span>
                        <span className="font-mono">{server.udpTotal}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Bandwidth (Total)</span>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        <span className="font-mono">{rxTotal.value}</span>
                        <span className="text-muted-foreground">{rxTotal.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 ms-3">
                        <ArrowDown className="h-3 w-3" />
                        <span className="font-mono">{txTotal.value}</span>
                        <span className="text-muted-foreground">{txTotal.unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
