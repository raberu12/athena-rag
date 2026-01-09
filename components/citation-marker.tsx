"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { CitationData } from "@/types/rag";

interface CitationMarkerProps {
    citation: CitationData;
    displayNumber: number;
    onClick: () => void;
}

/**
 * Inline citation marker with Wikipedia-style superscript [1]
 * Hover shows snippet tooltip, click opens full content modal
 */
export function CitationMarker({ citation, displayNumber, onClick }: CitationMarkerProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    className="inline text-[10px] font-medium text-white hover:text-white/80 hover:underline cursor-pointer align-super leading-none"
                    aria-label={`Citation ${displayNumber} from ${citation.metadata.source}`}
                >
                    [{displayNumber}]
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="max-w-xs text-xs leading-relaxed bg-gray-900 text-white border-gray-700 shadow-lg"
            >
                <div className="space-y-1.5 p-1">
                    <p className="font-semibold text-blue-300">{citation.metadata.source}</p>
                    <p className="text-gray-200">{citation.snippet}</p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}


