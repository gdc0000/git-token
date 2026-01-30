import React from 'react';
import { Sparkles, FileCode } from 'lucide-react';
import { RelevantFile, RepoDetails } from '../types';

interface SourceVisualizationProps {
    files?: RelevantFile[];
    repoDetails: RepoDetails | null;
}

export const SourceVisualization: React.FC<SourceVisualizationProps> = ({ files, repoDetails }) => {
    if (!files || files.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center select-none">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Context Sources
            </p>
            <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => {
                    const githubUrl = repoDetails ? `https://github.com/${repoDetails.owner}/${repoDetails.name}/blob/${repoDetails.defaultBranch}/${file.path}` : '#';

                    return (
                        <div key={idx} className="group relative">
                            <a
                                href={githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-muted/50 border border-border hover:border-primary/50 rounded-md text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center"
                            >
                                <FileCode className="h-3 w-3 mr-1.5 opacity-70" />
                                <span className="max-w-[120px] truncate">{file.path.split('/').pop()}</span>
                            </a>

                            {/* Tooltip Card */}
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900/98 backdrop-blur-2xl text-foreground border border-white/20 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-[100]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-semibold text-xs truncate flex items-center">
                                        <FileCode className="h-3.5 w-3.5 mr-2 text-primary/80" />
                                        {file.path.split('/').pop()}
                                    </span>
                                    <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded border border-white/5">
                                        #{idx + 1}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-[11px] text-muted-foreground font-mono break-all bg-black/40 p-2 rounded-md border border-white/5 shadow-inner">
                                        {file.path}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Relevance</p>
                                            <span className="text-[10px] font-mono text-primary">{file.score}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-500"
                                                style={{ width: `${Math.min((file.score / 30) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
