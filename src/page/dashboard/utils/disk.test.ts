import type { ServerStatus } from '@/api/public-preview';

import { describe, expect, it } from 'vitest';

import { getPrimaryServerDisk, normalizeServerDisks } from './disk';

describe('normalizeServerDisks', () => {
    it('maps the multi-disk payload and preserves root ordering for summary selection', () => {
        const status = {
            cpu: 0,
            mem_total_mb: 0,
            mem_used_mb: 0,
            swap_total_mb: 0,
            swap_used_mb: 0,
            disks: [
                { mp: '/data', total_gb: 200, used_gb: 80 },
                { mp: '/', total_gb: 50, used_gb: 25 },
            ],
            disk_read_kib_s: 0,
            disk_write_kib_s: 0,
            disk_read_iops: 0,
            disk_write_iops: 0,
            rx_kib_s: 0,
            tx_kib_s: 0,
            rx_total_mb: 0,
            tx_total_mb: 0,
            tcp_total: 0,
            udp_total: 0,
            time: '2026-04-19T10:00:00Z',
        } satisfies ServerStatus;

        const disks = normalizeServerDisks(status);

        expect(disks).toEqual([
            {
                label: 'Disk 1',
                mountPoint: '/',
                total: 50,
                used: 25,
                usage: 50,
                isRoot: true,
            },
            {
                label: 'Disk 2',
                mountPoint: '/data',
                total: 200,
                used: 80,
                usage: 40,
                isRoot: false,
            },
        ]);
        expect(getPrimaryServerDisk(disks)).toEqual(disks[0]);
    });

    it('falls back to the legacy single-disk fields when disks is absent', () => {
        const status = {
            cpu: 0,
            mem_total_mb: 0,
            mem_used_mb: 0,
            swap_total_mb: 0,
            swap_used_mb: 0,
            disk_total_gb: 120,
            disk_used_gb: 30,
            disk_read_kib_s: 0,
            disk_write_kib_s: 0,
            disk_read_iops: 0,
            disk_write_iops: 0,
            rx_kib_s: 0,
            tx_kib_s: 0,
            rx_total_mb: 0,
            tx_total_mb: 0,
            tcp_total: 0,
            udp_total: 0,
            time: '2026-04-19T10:00:00Z',
        } satisfies ServerStatus;

        expect(normalizeServerDisks(status)).toEqual([
            {
                label: 'Disk 1',
                mountPoint: '/',
                total: 120,
                used: 30,
                usage: 25,
                isRoot: true,
            },
        ]);
    });
});
