import React from 'react';
import { Copy, Download } from 'lucide-react';
import { RepoDetails, ProcessingStats } from '../types';

interface SummaryCardProps {
    repoDetails: RepoDetails;
    stats: ProcessingStats;
    handleCopyTreeMarkdown: () => void;
    handleDownload: () => void;
    handleCopyFullDigest: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    repoDetails,
    stats,
    handleCopyTreeMarkdown,
    handleDownload,
    handleCopyFullDigest,
}) => {
    return (
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Summary</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Repo</p>
                        <p className="font-mono text-sm truncate" title={`${repoDetails.owner}/${repoDetails.name}`}>
                            {repoDetails.name}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Files</p>
                        <p className="font-mono text-sm">{stats.selectedFiles} <span className="text-muted-foreground">/ {stats.totalFiles}</span></p>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Estimated Tokens</p>
                    <p className="text-2xl font-bold tracking-tight">{stats.estimatedTokens.toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <button
                        onClick={handleCopyTreeMarkdown}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full"
                    >
                        <Copy className="h-4 w-4 mr-2" /> Copy Tree (Markdown)
                    </button>
                    <div className="flex gap-2" id="action-buttons">
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" /> Download
                        </button>
                        <button
                            onClick={handleCopyFullDigest}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 flex-1"
                        >
                            <Copy className="h-4 w-4 mr-2" /> Copy All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
