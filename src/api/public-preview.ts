export type PublicPageSummary = {
    title: string;
    name?: string | null;
    domain?: string | null;
    description?: string | null;
};

export type PublicMonitor = {
    id: number;
    name: string;
    category: number;
    weight: number;
    os?: string | null;
    county?: string | null;
    area?: string | null;
    open_time?: string | null;
    provider?: string | null;
    cycle?: number | null;
    start_time?: string | null;
    end_time?: string | null;
    amount?: string | null;
    bandwidth?: string | null;
    traffic?: string | null;
    traffic_type?: number | null;
    note_public?: string | null;
};

export type Category = {
    id: number;
    name: string;
    sort?: number;
};

export type ServerStatus = {
    cpu: number;
    mem_total_mb: number;
    mem_used_mb: number;
    swap_total_mb: number;
    swap_used_mb: number;
    disk_total_gb: number;
    disk_used_gb: number;
    disk_read_kib_s: number;
    disk_write_kib_s: number;
    disk_read_iops: number;
    disk_write_iops: number;
    rx_kib_s: number;
    tx_kib_s: number;
    rx_total_mb: number;
    tx_total_mb: number;
    tcp_total: number;
    udp_total: number;
    time: string;
};

export type StatusMap = Record<string, ServerStatus>;

export type PublicBootstrapResponse = {
    code: string;
    msg: string;
    data?: {
        // Optional categories array (newer API versions include full category metadata)
        categories?: Category[];
        page: PublicPageSummary;
        servers: PublicMonitor[];
        status: StatusMap;
        now: number;
    };
};

export type PublicSSEPayload = {
    servers: PublicMonitor[];
    status: StatusMap;
    now: number;
};

export type PublicPreviewData = NonNullable<PublicBootstrapResponse['data']>;

export type PublicPreviewEndpoints = {
    bootstrap: string;
    sse: string;
};

export class PublicPreviewError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'PublicPreviewError';
        this.status = status;
        this.code = code;
    }
}

export function createPublicPreviewEndpoints(name?: string | null): PublicPreviewEndpoints {
    if (name) {
        const encodedName = encodeURIComponent(name);

        return {
            bootstrap: `/api/public/preview/${encodedName}/bootstrap`,
            sse: `/api/public/preview/${encodedName}/sse`,
        };
    }

    return {
        bootstrap: '/api/public/preview/bootstrap',
        sse: '/api/public/preview/sse',
    };
}

export async function fetchPublicBootstrap(
    name?: string | null,
    signal?: AbortSignal
): Promise<PublicPreviewData> {
    const { bootstrap } = createPublicPreviewEndpoints(name);
    const response = await fetch(bootstrap, {
        headers: {
            Accept: 'application/json',
        },
        signal,
    });

    let payload: PublicBootstrapResponse | null = null;

    try {
        payload = (await response.json()) as PublicBootstrapResponse;
    } catch {
        payload = null;
    }

    if (!response.ok || payload?.code !== 'ok' || !payload.data) {
        throw new PublicPreviewError(
            payload?.msg ?? 'Failed to load public preview data',
            response.status || 500,
            payload?.code
        );
    }

    return payload.data;
}

export function isPublicPreviewNotFoundError(error: unknown): error is PublicPreviewError {
    return (
        error instanceof PublicPreviewError && (error.status === 404 || error.code === 'not_found')
    );
}
