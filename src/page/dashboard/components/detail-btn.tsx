import { PanelTopOpen, PanelBottomOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function DetailBtn({
    showDetails,
    onChange,
}: {
    showDetails: boolean;
    onChange: (showDetails: boolean) => void;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    onClick={() => {
                        onChange(!showDetails);
                    }}
                >
                    {showDetails ? <PanelBottomOpen /> : <PanelTopOpen />}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="me-2">
                {showDetails ? <p>Hide Details</p> : <p>Show Details</p>}
            </TooltipContent>
        </Tooltip>
    );
}
