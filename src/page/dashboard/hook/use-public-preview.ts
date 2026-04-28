import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    createPublicPreviewEndpoints,
    fetchPublicBootstrap,
    isPublicPreviewNotFoundError,
    type PublicPageSummary,
    type PublicMonitor,
    type PublicSSEPayload,
    type StatusMap,
    type Category,
} from '@/api/public-preview';

type BootstrapState = 'loading' | 'ready' | 'not_found' | 'error';
type StreamState = 'connecting' | 'live' | 'reconnecting';

type PublicPreviewState = {
    bootstrapState: BootstrapState;
    streamState: StreamState;
    page: PublicPageSummary | null;
    servers: PublicMonitor[];
    status: StatusMap;
    // categories returned by bootstrap (optional in older API versions)
    categories: Category[];
    now: number | null;
    errorMessage: string | null;
    streamMessage: string | null;
    retry: () => void;
};

function parseSSEErrorMessage(event: Event): string | null {
    if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
        return null;
    }

    try {
        const payload = JSON.parse(event.data) as { msg?: string };
        return payload.msg ?? null;
    } catch {
        return null;
    }
}

export default function usePublicPreview(name?: string | null): PublicPreviewState {
    const [retryToken, setRetryToken] = useState(0);
    const [bootstrapState, setBootstrapState] = useState<BootstrapState>('loading');
    const [streamState, setStreamState] = useState<StreamState>('connecting');
    const [page, setPage] = useState<PublicPageSummary | null>(null);
    const [servers, setServers] = useState<PublicMonitor[]>([]);
    const [status, setStatus] = useState<StatusMap>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [now, setNow] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [streamMessage, setStreamMessage] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const { sse } = createPublicPreviewEndpoints(name);
        let eventSource: EventSource | null = null;
        let disposed = false;

        setBootstrapState('loading');
        setStreamState('connecting');
        setErrorMessage(null);
        setStreamMessage(null);

        fetchPublicBootstrap(name, controller.signal)
            .then((data) => {
                if (disposed) {
                    return;
                }

                setPage(data.page);
                // categories may not exist on older API responses; default to empty
                setCategories(data.categories ?? []);
                setServers(data.servers);
                setStatus(data.status);
                setNow(data.now);
                setBootstrapState('ready');

                eventSource = new EventSource(sse);

                eventSource.addEventListener('open', () => {
                    if (!disposed) {
                        setStreamState('live');
                        setStreamMessage(null);
                    }
                });

                eventSource.addEventListener('update', (event) => {
                    if (disposed || !(event instanceof MessageEvent)) {
                        return;
                    }

                    const payload = JSON.parse(event.data) as PublicSSEPayload;
                    setServers(payload.servers);
                    if (payload.categories) {
                        setCategories(payload.categories);
                    }
                    setStatus(payload.status);
                    setNow(payload.now);
                    setStreamState('live');
                    setStreamMessage(null);
                });

                const handleError = (event: Event) => {
                    if (disposed) {
                        return;
                    }

                    const message = parseSSEErrorMessage(event);
                    if (message) {
                        setStreamMessage(message);
                    }

                    setStreamState('reconnecting');
                };

                eventSource.addEventListener('error', handleError);
                eventSource.onerror = handleError;
            })
            .catch((error: unknown) => {
                if (disposed || controller.signal.aborted) {
                    return;
                }

                if (isPublicPreviewNotFoundError(error)) {
                    setBootstrapState('not_found');
                    setErrorMessage(error.message);
                    return;
                }

                setBootstrapState('error');
                setErrorMessage(
                    error instanceof Error ? error.message : 'Failed to load public preview data'
                );
            });

        return () => {
            disposed = true;
            controller.abort();
            eventSource?.close();
        };
    }, [name, retryToken]);

    const retry = useCallback(() => {
        setRetryToken((token) => token + 1);
    }, []);

    return useMemo(
        () => ({
            bootstrapState,
            streamState,
            page,
            servers,
            categories,
            status,
            now,
            errorMessage,
            streamMessage,
            retry,
        }),
        [
            bootstrapState,
            errorMessage,
            now,
            page,
            retry,
            servers,
            status,
            categories,
            streamMessage,
            streamState,
        ]
    );
}
