import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RepoInput } from './components/RepoInput';
import { SettingsModal } from './components/SettingsModal';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { ExtensionFilters } from './components/ExtensionFilters';
import { DirectoryPanel } from './components/DirectoryPanel';
import { ChatSidebar } from './components/ChatSidebar';
import { GitHubService } from './services/github';
import { GeminiService } from './services/gemini';
import { FileNode, RepoDetails, ProcessingStats, ChatMessage } from './types';
import { Sparkles, AlertCircle, X, Loader2 } from 'lucide-react';
import { GEMINI_MODEL } from './constants';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const App: React.FC = () => {
    // --- State: Data ---
    const [repoDetails, setRepoDetails] = useState<RepoDetails | null>(null);
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [flattenedFiles, setFlattenedFiles] = useState<FileNode[]>([]);

    // --- State: Status ---
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // --- State: Digests ---
    const [treeDigest, setTreeDigest] = useState<string>('');
    const [filesDigest, setFilesDigest] = useState<string>('');
    const [fullDigest, setFullDigest] = useState<string>('');

    // --- State: UI ---
    const [showSettings, setShowSettings] = useState(false);
    const [isTreeView, setIsTreeView] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [directoryPanelHeight, setDirectoryPanelHeight] = useState<number | undefined>(undefined);

    // --- State: Chat ---
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const chatScrollRef = useRef<HTMLDivElement>(null);
    const leftPanelRef = useRef<HTMLDivElement>(null);

    // --- Initializers & Services ---
    const getEnvKey = (key: string) => {
        try {
            return (import.meta.env as any)[`VITE_${key}`] || (process.env as any)[key];
        } catch (e) {
            return undefined;
        }
    };

    const [ghService, setGhService] = useState<GitHubService>(() =>
        new GitHubService(localStorage.getItem('github_key') || getEnvKey('GITHUB_TOKEN'))
    );
    const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

    const refreshServices = useCallback(() => {
        const ghKey = localStorage.getItem('github_key') || getEnvKey('GITHUB_TOKEN');
        setGhService(new GitHubService(ghKey));

        const geminiKey = localStorage.getItem('gemini_key') || getEnvKey('GEMINI_API_KEY');
        if (geminiKey) {
            setGeminiService(new GeminiService(geminiKey, GEMINI_MODEL));
        } else {
            setGeminiService(null);
        }
    }, []);

    useEffect(() => {
        refreshServices();
    }, [refreshServices]);

    // --- Tutorial Logic ---
    const startTutorial = useCallback(() => {
        const isMobile = window.innerWidth < 1024;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            overlayColor: 'rgba(0,0,0,0.5)',
            steps: [
                {
                    element: '#header-logo',
                    popover: {
                        title: 'Welcome to GitToken!',
                        description: 'Your premium tool to transform codebases into AI-ready context. Let\'s see how it works.',
                        side: "bottom",
                        align: isMobile ? 'center' : 'start'
                    }
                },
                {
                    element: '#settings-button',
                    popover: {
                        title: '1. API Settings',
                        description: 'First things first! Add your Gemini and GitHub API keys here to unlock the full potential of the app.',
                        side: "bottom",
                        align: isMobile ? 'center' : 'end'
                    }
                },
                {
                    element: '#repo-input-container',
                    popover: {
                        title: '2. Ingest Repository',
                        description: 'Now you\'re ready! Paste a GitHub URL here to fetch the codebase and start analyzing.',
                        side: "bottom",
                        align: 'center'
                    }
                }
            ]
        });

        if (repoDetails) {
            driverObj.setSteps([
                ...(driverObj.getConfig().steps || []),
                {
                    element: '#extension-filters',
                    popover: {
                        title: 'Smart Filtering',
                        description: 'Toggle file types to quickly include or exclude code from your digest.',
                        side: isMobile ? "bottom" : "right",
                        align: isMobile ? 'center' : 'start'
                    }
                },
                {
                    element: '#directory-panel',
                    popover: {
                        title: 'Interactive Directory',
                        description: 'Select individual files or folders. Only checked files will be included in the context.',
                        side: isMobile ? "top" : "left",
                        align: isMobile ? 'center' : 'start'
                    }
                },
                {
                    element: '#action-buttons',
                    popover: {
                        title: 'Export Context',
                        description: 'Copy the entire codebase digest or download it as a file.',
                        side: "top",
                        align: 'center'
                    }
                }
                ,
                {
                    element: '#chat-button',
                    popover: {
                        title: 'Ask the AI',
                        description: 'Launch the Chat Assistant to talk directly with your codebase.',
                        side: "bottom",
                        align: 'end'
                    }
                }
            ]);
        }

        driverObj.drive();
    }, [repoDetails]);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                startTutorial();
                localStorage.setItem('hasSeenTutorial', 'true');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [startTutorial]);

    // --- UI Effects ---
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatHistory, isChatLoading, showChat]);

    useEffect(() => {
        const updateHeight = () => {
            if (leftPanelRef.current && window.innerWidth >= 1024) {
                setDirectoryPanelHeight(leftPanelRef.current.offsetHeight);
            } else {
                setDirectoryPanelHeight(undefined);
            }
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        if (leftPanelRef.current) observer.observe(leftPanelRef.current);
        window.addEventListener('resize', updateHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, [repoDetails, flattenedFiles]);

    // --- Computed Data ---
    const stats: ProcessingStats = useMemo(() => {
        const selected = flattenedFiles.filter(f => f.isChecked);
        const totalSize = selected.reduce((acc, f) => acc + (f.size || 0), 0);
        return {
            totalFiles: flattenedFiles.length,
            selectedFiles: selected.length,
            totalSize,
            estimatedTokens: Math.ceil(totalSize / 4)
        };
    }, [flattenedFiles]);

    const extensionStats = useMemo(() => {
        const extMap: Record<string, { count: number; selected: number }> = {};
        flattenedFiles.forEach(f => {
            if (!f.extension || f.extension === '.') return;
            if (!extMap[f.extension]) extMap[f.extension] = { count: 0, selected: 0 };
            extMap[f.extension].count++;
            if (f.isChecked) extMap[f.extension].selected++;
        });
        return Object.entries(extMap)
            .map(([ext, data]) => ({ ext, ...data }))
            .sort((a, b) => b.count - a.count);
    }, [flattenedFiles]);

    // --- Business Logic: Helpers ---
    const hasSelectedChildren = useCallback((node: FileNode): boolean => {
        if (node.type === 'blob') return node.isChecked;
        if (node.children) return node.children.some(hasSelectedChildren);
        return false;
    }, []);

    const generateTreeString = useCallback((nodes: FileNode[], rootName: string): string => {
        let output = `└── ${rootName}\n`;
        const renderNode = (node: FileNode, prefix: string, isLast: boolean) => {
            if (node.type === 'blob' && !node.isChecked) return;
            if (node.type === 'tree' && !hasSelectedChildren(node)) return;

            output += `${prefix}${isLast ? '    └── ' : '    ├── '}${node.name}\n`;
            if (node.children) {
                const children = node.children.filter(c => c.type === 'blob' ? c.isChecked : hasSelectedChildren(c));
                children.forEach((child, i) => {
                    renderNode(child, prefix + (isLast ? '        ' : '    │   '), i === children.length - 1);
                });
            }
        };
        const topLevel = nodes.filter(n => n.type === 'blob' ? n.isChecked : hasSelectedChildren(n));
        topLevel.forEach((node, i) => renderNode(node, '', i === topLevel.length - 1));
        return output;
    }, [hasSelectedChildren]);

    const generateMarkdownTreeString = useCallback((nodes: FileNode[], level: number): string => {
        let output = '';
        nodes.forEach(node => {
            if (node.type === 'blob' && !node.isChecked) return;
            if (node.type === 'tree' && !hasSelectedChildren(node)) return;
            output += `${'#'.repeat(level)} ${node.name}\n`;
            if (node.children) output += generateMarkdownTreeString(node.children, level + 1);
        });
        return output;
    }, [hasSelectedChildren]);

    // --- Business Logic: Handlers ---
    const handleReset = useCallback(() => {
        setRepoDetails(null);
        setFileTree([]);
        setFlattenedFiles([]);
        setTreeDigest('');
        setFilesDigest('');
        setFullDigest('');
        setChatHistory([]);
        setShowChat(false);
        setError(null);
        setLoadingStatus('');
        setProgress(0);
        setIsLoading(false);
    }, []);

    const handleIngest = async (owner: string, repo: string) => {
        setIsLoading(true);
        setError(null);
        handleReset();
        setIsLoading(true); // Need to set it again after reset
        setLoadingStatus('Connecting to GitHub...');
        setProgress(5);

        try {
            const details = await ghService.getRepoDetails(owner, repo);
            setRepoDetails(details);
            setProgress(20);

            setLoadingStatus('Fetching project structure...');
            const tree = await ghService.getRepoTree(owner, repo, details.defaultBranch);
            setFileTree(tree);
            setProgress(40);

            const flat: FileNode[] = [];
            const flatten = (nodes: FileNode[]) => {
                nodes.forEach(n => {
                    if (n.type === 'blob') flat.push(n);
                    if (n.children) flatten(n.children);
                });
            };
            flatten(tree);
            setFlattenedFiles(flat);

            await generateDigestInternal(details, flat, tree, 40);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    };

    const handleToggleFile = useCallback((path: string, checked: boolean) => {
        const updateNodes = (nodes: FileNode[]): FileNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    const updateChildren = (n: FileNode, val: boolean): FileNode => ({
                        ...n,
                        isChecked: val,
                        children: n.children ? n.children.map(c => updateChildren(c, val)) : undefined
                    });
                    return updateChildren(node, checked);
                }
                if (node.children) return { ...node, children: updateNodes(node.children) };
                return node;
            });
        };
        setFileTree(prev => updateNodes(prev));
        setFlattenedFiles(prev => prev.map(f => (f.path === path || f.path.startsWith(path + '/')) ? { ...f, isChecked: checked } : f));
    }, []);

    const handleToggleExtension = useCallback((ext: string) => {
        const stats = extensionStats.find(s => s.ext === ext);
        if (!stats) return;
        const targetState = stats.selected !== stats.count;

        setFlattenedFiles(prev => prev.map(f => f.extension === ext ? { ...f, isChecked: targetState } : f));
        const updateNodesRecursive = (nodes: FileNode[]): FileNode[] => nodes.map(node => {
            if (node.type === 'blob' && node.extension === ext) return { ...node, isChecked: targetState };
            if (node.children) return { ...node, children: updateNodesRecursive(node.children) };
            return node;
        });
        setFileTree(prev => updateNodesRecursive(prev));
    }, [extensionStats]);

    const handleFileClick = useCallback((node: FileNode) => {
        if (!repoDetails || node.type !== 'blob') return;
        window.open(`https://github.com/${repoDetails.owner}/${repoDetails.name}/blob/${repoDetails.defaultBranch}/${node.path}`, '_blank');
    }, [repoDetails]);

    const generateDigestInternal = async (details: RepoDetails, files: FileNode[], tree: FileNode[], initialProgress: number) => {
        const selected = files.filter(f => f.isChecked);
        setIsLoading(true);
        setProgress(initialProgress || 10);

        const treeStr = generateTreeString(tree, details.name);
        setTreeDigest(treeStr);

        let contentStr = '';
        if (selected.length > 0) {
            const filesToFetch = selected.filter(f => typeof f.content !== 'string');
            const alreadyFetched = selected.filter(f => typeof f.content === 'string');
            let fetchedResults: { path: string, content: string }[] = [];

            if (filesToFetch.length > 0) {
                const total = filesToFetch.length;
                const BATCH_SIZE = 5;
                for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
                    const batch = filesToFetch.slice(i, i + BATCH_SIZE);
                    const results = await Promise.all(batch.map(async (file) => {
                        try {
                            const content = await ghService.getFileContent(details.owner, details.name, file.sha);

                            // Parse Jupyter Notebooks if applicable
                            if (file.name.endsWith('.ipynb')) {
                                try {
                                    const json = JSON.parse(content);
                                    const { parseNotebook } = await import('./utils/notebook');
                                    return { path: file.path, content: parseNotebook(json) };
                                } catch (e) {
                                    console.error(`Error parsing notebook ${file.path}:`, e);
                                    return { path: file.path, content }; // Fallback to raw content
                                }
                            }

                            return { path: file.path, content };
                        } catch (e) {
                            return { path: file.path, content: "// Error fetching content" };
                        }
                    }));
                    fetchedResults = [...fetchedResults, ...results];
                    setProgress(Math.round((initialProgress || 10) + ((fetchedResults.length / total) * (95 - (initialProgress || 10)))));
                    setLoadingStatus(`Syncing files... (${fetchedResults.length}/${total})`);
                }
            }

            const allContentMap = new Map<string, string>();
            alreadyFetched.forEach(f => allContentMap.set(f.path, f.content!));
            fetchedResults.forEach(r => allContentMap.set(r.path, r.content));

            if (fetchedResults.length > 0) {
                setFlattenedFiles(prev => prev.map(f => allContentMap.has(f.path) ? { ...f, content: allContentMap.get(f.path) } : f));
            }

            selected.forEach(file => {
                const content = allContentMap.get(file.path) || "// Content not found";
                contentStr += `\n${"=".repeat(48)}\nFile: /${file.path}\n${"=".repeat(48)}\n${content}\n`;
            });
        } else {
            contentStr = "// No files selected.";
        }

        setFilesDigest(contentStr);
        const full = `Repository: ${details.owner}/${details.name}\nFiles analyzed: ${selected.length}\nEstimated tokens: ${Math.ceil(contentStr.length / 4)}\n\nDirectory structure:\n${treeStr}\n\nFiles Content:\n${contentStr}`;
        setFullDigest(full);
        setProgress(100);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !geminiService || !repoDetails) return;

        const pendingContent = flattenedFiles.some(f => f.isChecked && typeof f.content !== 'string');
        if (pendingContent) await generateDigestInternal(repoDetails, flattenedFiles, fileTree, 0);

        const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const result = await geminiService.analyzeCodebase(flattenedFiles, treeDigest, userMsg.text, chatHistory);
            setChatHistory(prev => [...prev, { role: 'model', text: result.text, timestamp: Date.now(), relevantFiles: result.relevantFiles }]);
        } catch (err: any) {
            setChatHistory(prev => [...prev, { role: 'model', text: "Error: " + err.message, timestamp: Date.now(), isError: true }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
            <Header
                repoDetails={repoDetails}
                handleReset={handleReset}
                showChat={showChat}
                setShowChat={setShowChat}
                setShowSettings={setShowSettings}
                startTutorial={startTutorial}
            />

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto scroll-smooth">
                    <div className="container mx-auto max-w-7xl px-4 py-8">
                        {!repoDetails ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                                <h2 className="text-4xl font-bold tracking-tight mb-4">Codebase to Context</h2>
                                <p className="text-muted-foreground mb-8 max-w-md">Transform GitHub repositories into token-optimized prompts for LLMs, and chat with them using Gemini.</p>
                                <div id="repo-input-container" className="w-full max-w-lg">
                                    <RepoInput onIngest={handleIngest} isLoading={isLoading} />
                                </div>
                                {error && (
                                    <div className="mt-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-start text-sm text-left max-w-md w-full">
                                        <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                        <div><p className="font-semibold">Error</p><p className="opacity-90">{error}</p></div>
                                    </div>
                                )}
                                {loadingStatus && (
                                    <div className="mt-8 flex items-center text-muted-foreground">
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        <span className="text-sm">{loadingStatus}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {error && (
                                    <div className="w-full bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
                                        <div className="flex items-center"><AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" /><span className="text-sm font-medium">{error}</span></div>
                                        <button onClick={() => setError(null)} className="hover:opacity-75"><X className="h-5 w-5" /></button>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    <div ref={leftPanelRef} className="lg:col-span-4 flex flex-col space-y-4 h-fit">
                                        <SummaryCard
                                            repoDetails={repoDetails}
                                            stats={stats}
                                            handleCopyTreeMarkdown={() => navigator.clipboard.writeText(`# ${repoDetails.name}\n` + generateMarkdownTreeString(fileTree, 2))}
                                            handleDownload={() => {
                                                const blob = new Blob([fullDigest], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${repoDetails.name}_digest.txt`;
                                                a.click();
                                            }}
                                            handleCopyFullDigest={() => navigator.clipboard.writeText(fullDigest)}
                                        />
                                        <ExtensionFilters extensionStats={extensionStats} handleToggleExtension={handleToggleExtension} />
                                    </div>
                                    <DirectoryPanel
                                        isTreeView={isTreeView}
                                        setIsTreeView={setIsTreeView}
                                        handleReset={handleReset}
                                        isLoading={isLoading}
                                        handleCopyTreeDigest={() => navigator.clipboard.writeText(treeDigest)}
                                        treeDigest={treeDigest}
                                        fileTree={fileTree}
                                        handleToggleFile={handleToggleFile}
                                        handleFileClick={handleFileClick}
                                        directoryPanelHeight={directoryPanelHeight}
                                    />
                                </div>
                                {isLoading && (
                                    <div className="mt-8 rounded-lg border border-border bg-card text-card-foreground shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="max-w-xl mx-auto space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="font-medium">{loadingStatus || 'Processing...'}</span>
                                                </div>
                                                <span className="text-muted-foreground">{progress}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-300 ease-out rounded-full" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                <ChatSidebar
                    repoDetails={repoDetails}
                    showChat={showChat}
                    setShowChat={setShowChat}
                    chatHistory={chatHistory}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    isChatLoading={isChatLoading}
                    handleChatSubmit={handleChatSubmit}
                    chatScrollRef={chatScrollRef}
                />
            </div>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSettingsChanged={refreshServices} />
        </div>
    );
};

export default App;