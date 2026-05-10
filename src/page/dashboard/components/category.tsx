import type { DashboardLayout, Server } from './type';

import { useEffect, useRef, useState, type RefObject } from 'react';

import ServerStatusCard from './server-status-card';

import { cn } from '@/lib/utils';

import './category.css';

function estimateCardMinHeight(layout: DashboardLayout, showDetails: boolean) {
    if (layout === 'grid') {
        return showDetails ? 420 : 360;
    }

    if (layout === 'list2') {
        return showDetails ? 300 : 250;
    }

    return showDetails ? 260 : 220;
}

function useCardVisibility(rootRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(!enabled);

    useEffect(() => {
        const node = nodeRef.current;
        const root = rootRef.current;

        if (!enabled) {
            setIsVisible(true);
            return;
        }

        if (!node || !root || typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);
            return;
        }

        setIsVisible(false);

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                root,
                rootMargin: '600px 0px',
                threshold: 0.01,
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [enabled, rootRef]);

    return { nodeRef, isVisible };
}

function VirtualizedServerCard({
    server,
    layout,
    showDetails,
    mounted,
    index,
    scrollRootRef,
    virtualized,
}: {
    server: Server;
    layout: DashboardLayout;
    showDetails: boolean;
    mounted: boolean;
    index: number;
    scrollRootRef: RefObject<HTMLDivElement | null>;
    virtualized: boolean;
}) {
    const { nodeRef, isVisible } = useCardVisibility(scrollRootRef, virtualized);
    const minHeight = estimateCardMinHeight(layout, showDetails);
    const shouldRenderCard = !virtualized || isVisible;

    return (
        <div
            ref={nodeRef}
            className="min-w-0"
            style={{
                minHeight,
                transition: 'opacity 400ms ease, transform 400ms ease',
                transitionDelay: mounted && shouldRenderCard ? `${index * 80}ms` : '0ms',
                opacity: mounted && shouldRenderCard ? 1 : 0,
                transform: mounted && shouldRenderCard ? 'none' : 'translateY(8px)',
                contentVisibility: virtualized ? 'auto' : 'visible',
                containIntrinsicSize: `${minHeight}px`,
            }}
        >
            {shouldRenderCard ? (
                <ServerStatusCard server={server} layout={layout} detailsExpanded={showDetails} />
            ) : null}
        </div>
    );
}

export default function CategorySection({
    title,
    layout,
    servers,
    showDetails,
    mounted,
    scrollRootRef,
}: {
    title: string;
    layout: DashboardLayout;
    servers: Server[];
    showDetails: boolean;
    mounted: boolean;
    scrollRootRef: RefObject<HTMLDivElement | null>;
}) {
    const shouldVirtualize = servers.length >= 18;

    return (
        <div className="mt-4">
            <div>
                <p className="mt-4 opacity-65">{title}</p>
            </div>
            <div
                className={cn(
                    layout === 'list'
                        ? 'mt-2 grid grid-cols-1 gap-4'
                        : layout === 'list2'
                          ? 'mt-2 grid grid-cols-1 gap-4 md:grid-cols-2'
                          : 'category-grid'
                )}
            >
                {servers.map((server, idx) =>
                    shouldVirtualize ? (
                        <VirtualizedServerCard
                            key={server.id}
                            server={server}
                            layout={layout}
                            showDetails={showDetails}
                            mounted={mounted}
                            index={idx}
                            scrollRootRef={scrollRootRef}
                            virtualized={shouldVirtualize}
                        />
                    ) : (
                        <div
                            key={server.id}
                            style={{
                                transition: 'opacity 400ms ease, transform 400ms ease',
                                transitionDelay: `${idx * 80}ms`,
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'none' : 'translateY(8px)',
                            }}
                        >
                            <ServerStatusCard
                                server={server}
                                layout={layout}
                                detailsExpanded={showDetails}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
