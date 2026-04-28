export type DashboardLayout = 'list' | 'list2' | 'grid';

export interface ServerDisk {
    label: string;
    mountPoint: string;
    usage: number;
    used: number;
    total: number;
    isRoot: boolean;
}

export interface Server {
    id: number;
    name: string;
    os: string | null;
    location: string | null;
    locationName: string | null;
    status: 'online' | 'warning' | 'offline';
    lastSeen: string | null;
    cpu: number;
    memory: number;
    memory_used: number;
    memory_total: number;
    swap: number;
    swap_used: number;
    swap_total: number;
    disk: number;
    disk_used: number;
    disk_total: number;
    disks: ServerDisk[];
    uptime: string;
    networkUp: number;
    networkDown: number;
    networkUpTotal: number;
    networkDownTotal: number;
    diskReadKibS: number;
    diskWriteKibS: number;
    diskReadIOPS: number;
    diskWriteIOPS: number;
    tcpTotal: number;
    udpTotal: number;
    provider?: string | null;
    cycle?: number | null;
    start_time?: string | null;
    end_time?: string | null;
    amount?: string | null;
    bandwidth?: string | null;
    traffic?: string | null;
    note_public?: string | null;
    core_c?: number | null;
    core_t?: number | null;
}
