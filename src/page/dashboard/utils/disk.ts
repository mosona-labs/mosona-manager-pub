import type { DiskStatus, ServerStatus } from '@/api/public-preview';
import type { ServerDisk } from '@/page/dashboard/components/type';

const ROOT_MOUNT_POINT = '/';

const EMPTY_ROOT_DISK: ServerDisk = {
    label: 'Disk 1',
    mountPoint: ROOT_MOUNT_POINT,
    usage: 0,
    used: 0,
    total: 0,
    isRoot: true,
};

function toPercent(used: number, total: number) {
    if (!total || total <= 0) {
        return 0;
    }

    return Math.round((used / total) * 100 * 100) / 100;
}

function toNonNegativeNumber(value: number | null | undefined) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function getDiskSource(status?: ServerStatus): DiskStatus[] {
    if (Array.isArray(status?.disks) && status.disks.length > 0) {
        return status.disks;
    }

    if (typeof status?.disk_total_gb === 'number' || typeof status?.disk_used_gb === 'number') {
        return [
            {
                mp: ROOT_MOUNT_POINT,
                total_gb: status?.disk_total_gb ?? 0,
                used_gb: status?.disk_used_gb ?? 0,
            },
        ];
    }

    return [];
}

function getDiskLabel(index: number) {
    return `Disk ${index + 1}`;
}

function sortDisks(disks: DiskStatus[]) {
    return [...disks].sort((a, b) => {
        if (a.mp === b.mp) return 0;
        if (a.mp === ROOT_MOUNT_POINT) return -1;
        if (b.mp === ROOT_MOUNT_POINT) return 1;
        return 0;
    });
}

export function normalizeServerDisks(status?: ServerStatus): ServerDisk[] {
    return sortDisks(getDiskSource(status)).map((disk, index) => {
        const mountPoint = disk.mp.trim() || ROOT_MOUNT_POINT;
        const used = toNonNegativeNumber(disk.used_gb);
        const total = toNonNegativeNumber(disk.total_gb);

        return {
            label: getDiskLabel(index),
            mountPoint,
            usage: toPercent(used, total),
            used,
            total,
            isRoot: mountPoint === ROOT_MOUNT_POINT,
        };
    });
}

export function getPrimaryServerDisk(disks: ServerDisk[]): ServerDisk {
    return disks.find((disk) => disk.isRoot) ?? disks[0] ?? EMPTY_ROOT_DISK;
}
