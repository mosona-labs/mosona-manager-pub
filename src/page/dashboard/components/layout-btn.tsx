import type { DashboardLayout } from './type';

import { LayoutList, LayoutGrid, Grid3x2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function nextLayout(layout: DashboardLayout): DashboardLayout {
    return layout === 'grid' ? 'list' : layout === 'list' ? 'list2' : 'grid';
}

export default function LayoutBtn({
    layout,
    onChange,
}: {
    layout: DashboardLayout;
    onChange: (layout: DashboardLayout) => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    onClick={() => {
                        onChange(nextLayout(layout));
                    }}
                >
                    {layout === 'grid' ? (
                        <LayoutList />
                    ) : layout === 'list' ? (
                        <LayoutGrid />
                    ) : (
                        <Grid3x2 />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="me-2">
                <p>
                    {layout === 'grid'
                        ? 'Switch to List'
                        : layout === 'list'
                          ? 'Switch to List x2'
                          : 'Switch to Grid'}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}
