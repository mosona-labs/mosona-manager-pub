import type { DashboardLayout, Server } from './type';

import ServerStatusCard from './server-status-card';
import './category.css';

import { cn } from '@/lib/utils';

export default function CategorySection({
    title,
    layout,
    servers,
    showDetails,
    mounted,
}: {
    title: string;
    layout: DashboardLayout;
    servers: Server[];
    showDetails: boolean;
    mounted: boolean;
}) {
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
                {servers.map((server, idx) => (
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
                ))}
            </div>
        </div>
    );
}
