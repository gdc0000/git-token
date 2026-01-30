import React from 'react';
import { FolderTree, FileText, RefreshCw, Copy } from 'lucide-react';
import { FileNode } from '../types';
import { FileTree } from './FileTree';

interface DirectoryPanelProps {
    isTreeView: boolean;
    setIsTreeView: (val: boolean) => void;
    handleReset: () => void;
    isLoading: boolean;
    handleCopyTreeDigest: () => void;
    treeDigest: string;
    fileTree: FileNode[];
    handleToggleFile: (path: string, checked: boolean) => void;
    handleFileClick: (node: FileNode) => void;
    directoryPanelHeight: number | undefined;
}

export const DirectoryPanel: React.FC<DirectoryPanelProps> = ({
    isTreeView,
    setIsTreeView,
    handleReset,
    isLoading,
    handleCopyTreeDigest,
    treeDigest,
    fileTree,
    handleToggleFile,
    handleFileClick,
    directoryPanelHeight,
}) => {
    return (
        <div className="lg:col-span-8 flex flex-col space-y-4" id="directory-panel">
            <div
                className="rounded-lg border border-border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden transition-all duration-300"
                style={{ height: directoryPanelHeight ? `${directoryPanelHeight}px` : '600px' }}
            >
                <div className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-md border border-input p-0.5">
                            <button
                                onClick={() => setIsTreeView(true)}
                                className={`p-1.5 rounded-sm transition-all ${isTreeView ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <FolderTree className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setIsTreeView(false)}
                                className={`p-1.5 rounded-sm transition-all ${!isTreeView ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <FileText className="h-4 w-4" />
                            </button>
                        </div>
                        <span className="text-sm font-medium">Directory</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-2"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Reset
                        </button>
                        <button
                            onClick={handleCopyTreeDigest}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-2"
                        >
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-zinc-950/30">
                    {isTreeView ? (
                        <div className="p-4">
                            <FileTree nodes={fileTree} onToggle={handleToggleFile} onFileClick={handleFileClick} />
                        </div>
                    ) : (
                        <textarea
                            value={treeDigest}
                            readOnly
                            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-transparent text-muted-foreground"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
