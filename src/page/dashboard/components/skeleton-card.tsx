import type { DashboardLayout } from './type';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SkeletonCard({ layout }: { layout: DashboardLayout }) {
    return (
        <Card
            className={cn(
                'border-border bg-card p-5 h-full',
                'animate-pulse',
                layout !== 'grid' && 'py-3.5 gap-3.5'
            )}
        >
            <div className="flex flex-col gap-3 h-full">
                <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-muted-foreground/10" />
                        <div className="flex flex-col gap-1">
                            <div className="h-4 w-36 bg-muted-foreground/10 rounded" />
                            <div className="h-3 w-24 bg-muted-foreground/8 rounded mt-1" />
                        </div>
                    </div>
                    <div className="h-6 w-12 bg-muted-foreground/10 rounded" />
                </div>

                <div className="space-y-2 mt-2">
                    <div className="h-3 bg-muted-foreground/8 rounded w-full" />
                    <div className="h-3 bg-muted-foreground/8 rounded w-5/6" />
                    <div className="h-3 bg-muted-foreground/8 rounded w-3/4" />
                </div>

                <div className="mt-auto border-t border-border pt-3">
                    <div className="h-3 bg-muted-foreground/6 rounded w-1/3" />
                </div>
            </div>
        </Card>
    );
}

