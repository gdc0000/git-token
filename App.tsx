import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RepoInput } from './components/RepoInput';
import { FileTree } from './components/FileTree';
import { SettingsModal } from './components/SettingsModal';
import { GitHubService } from './services/github';
import { GeminiService } from './services/gemini';
import { FileNode, RepoDetails, ProcessingStats, ChatMessage, RelevantFile, ViewMode } from './types';
import { Copy, Download, Settings, Bot, Terminal, FileText, Sparkles, FileCode, Search, RefreshCw, FolderTree, AlertCircle, X, Loader2, Send, PanelRightClose, PanelRightOpen, PanelRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GEMINI_MODEL } from './constants';

// --- Interactive Source Panel Component (Styled as Hover Card) ---
const SourceVisualization: React.FC<{ files?: RelevantFile[] }> = ({ files }) => {
    if (!files || files.length === 0) return null;
  
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center select-none">
          <Sparkles className="h-3 w-3 mr-1.5" /> 
          Context Sources
        </p>
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="group relative">
              <div className="px-2.5 py-1 bg-muted/50 border border-border hover:border-primary/50 rounded-md text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-help flex items-center">
                 <FileCode className="h-3 w-3 mr-1.5 opacity-70" />
                 <span className="max-w-[120px] truncate">{file.path.split('/').pop()}</span>
              </div>
              
              {/* Tooltip Card */}
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                  <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-xs truncate flex items-center">
                          <FileCode className="h-3 w-3 mr-2" />
                          {file.path.split('/').pop()}
                      </span>
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                  </div>
                  <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-mono break-all bg-muted p-1 rounded">
                          {file.path}
                      </div>
                      <div>
                          <div className="flex justify-between items-end mb-1">
                             <p className="text-[10px] uppercase font-bold text-muted-foreground">Relevance</p>
                             <span className="text-[10px] font-mono">{file.score}</span>
                          </div>
                          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${Math.min((file.score / 30) * 100, 100)}%` }} 
                              />
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

const App: React.FC = () => {
  // Helpers
  const getEnvGithubToken = () => {
    try {
      return process.env.GITHUB_TOKEN;
    } catch (e) {
      return undefined;
    }
  };

  // State
  const [repoDetails, setRepoDetails] = useState<RepoDetails | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [flattenedFiles, setFlattenedFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [progress, setProgress] = useState(0); // 0-100
  const [error, setError] = useState<string | null>(null);
  
  // Content State
  const [treeDigest, setTreeDigest] = useState<string>('');
  const [filesDigest, setFilesDigest] = useState<string>('');
  const [fullDigest, setFullDigest] = useState<string>('');
  
  const [showSettings, setShowSettings] = useState(false);
  
  // UI State
  const [isTreeView, setIsTreeView] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Layout Refs for Syncing Height
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [directoryPanelHeight, setDirectoryPanelHeight] = useState<number | undefined>(undefined);
  
  // Services
  const [ghService, setGhService] = useState<GitHubService>(() => 
    new GitHubService(getEnvGithubToken() || localStorage.getItem('github_key') || undefined)
  );
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  useEffect(() => {
    const key = localStorage.getItem('gemini_key');
    if (key) {
        setGeminiService(new GeminiService(key, GEMINI_MODEL));
    }
  }, []);

  const refreshServices = useCallback(() => {
    const ghKey = getEnvGithubToken() || localStorage.getItem('github_key') || undefined;
    setGhService(new GitHubService(ghKey));

    const geminiKey = localStorage.getItem('gemini_key');
    if (geminiKey) {
        setGeminiService(new GeminiService(geminiKey, GEMINI_MODEL));
    } else {
        setGeminiService(null);
    }
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading, showChat]);

  // Height Sync Effect
  useEffect(() => {
    const updateHeight = () => {
         if (leftPanelRef.current && window.innerWidth >= 1024) { // lg breakpoint
             setDirectoryPanelHeight(leftPanelRef.current.offsetHeight);
         } else {
             setDirectoryPanelHeight(undefined); // Use default CSS height on mobile
         }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (leftPanelRef.current) {
        observer.observe(leftPanelRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateHeight);
    };
  }, [repoDetails, flattenedFiles]); // Re-run if content changes

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
      
      const ext = f.extension;
      if (!extMap[ext]) {
        extMap[ext] = { count: 0, selected: 0 };
      }
      extMap[ext].count++;
      if (f.isChecked) {
        extMap[ext].selected++;
      }
    });
    
    return Object.entries(extMap)
      .map(([ext, data]) => ({ ext, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [flattenedFiles]);

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
      topLevel.forEach((node, i) => {
          renderNode(node, '', i === topLevel.length - 1);
      });

      return output;
  }, [hasSelectedChildren]);

  const generateMarkdownTreeString = useCallback((nodes: FileNode[], level: number): string => {
    let output = '';
    nodes.forEach(node => {
        if (node.type === 'blob' && !node.isChecked) return;
        if (node.type === 'tree' && !hasSelectedChildren(node)) return;

        output += `${'#'.repeat(level)} ${node.name}\n`;
        
        if (node.children) {
            output += generateMarkdownTreeString(node.children, level + 1);
        }
    });
    return output;
  }, [hasSelectedChildren]);

  const handleIngest = async (owner: string, repo: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Fetching repository details...');
    setProgress(5);
    setRepoDetails(null);
    setFileTree([]);
    setFlattenedFiles([]);
    setTreeDigest('');
    setFilesDigest('');
    setFullDigest('');
    setChatHistory([]);
    setShowChat(false);

    try {
        const details = await ghService.getRepoDetails(owner, repo);
        setRepoDetails(details);
        setProgress(20);

        setLoadingStatus('Fetching file tree...');
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
        
        setLoadingStatus('');
    } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
    }
  };

  const handleToggleFile = useCallback((path: string, checked: boolean) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            if (node.path === path) {
                const updateChildren = (n: FileNode, val: boolean): FileNode => {
                    return {
                        ...n,
                        isChecked: val,
                        children: n.children ? n.children.map(c => updateChildren(c, val)) : undefined
                    };
                };
                return updateChildren(node, checked);
            }
            if (node.children) {
                return { ...node, children: updateNodes(node.children) };
            }
            return node;
        });
    };
    setFileTree(prev => updateNodes(prev));

    setFlattenedFiles(prev => prev.map(f => {
        if (f.path === path || f.path.startsWith(path + '/')) {
            return { ...f, isChecked: checked };
        }
        return f;
    }));
  }, []);

  const handleToggleExtension = useCallback((ext: string) => {
    const stats = extensionStats.find(s => s.ext === ext);
    if (!stats) return;
    
    const targetState = stats.selected !== stats.count;

    setFlattenedFiles(prev => prev.map(f => 
        f.extension === ext ? { ...f, isChecked: targetState } : f
    ));

    const updateNodesRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            if (node.type === 'blob' && node.extension === ext) {
                return { ...node, isChecked: targetState };
            }
            if (node.children) {
                return { ...node, children: updateNodesRecursive(node.children) };
            }
            return node;
        });
    };
    setFileTree(prev => updateNodesRecursive(prev));
  }, [extensionStats]);

  const handleFileClick = useCallback((node: FileNode) => {
    if (!repoDetails || node.type !== 'blob') return;
    const url = `https://github.com/${repoDetails.owner}/${repoDetails.name}/blob/${repoDetails.defaultBranch}/${node.path}`;
    window.open(url, '_blank');
  }, [repoDetails]);

  useEffect(() => {
      if (repoDetails && fileTree.length > 0) {
          const treeStr = generateTreeString(fileTree, repoDetails.name);
          setTreeDigest(treeStr);
      }
  }, [fileTree, repoDetails, generateTreeString]);

  const generateDigest = async () => {
      if (!repoDetails) return;
      await generateDigestInternal(repoDetails, flattenedFiles, fileTree, 0);
  };

  const generateDigestInternal = async (details: RepoDetails, files: FileNode[], tree: FileNode[], initialProgress: number) => {
      const selected = files.filter(f => f.isChecked);
      
      setIsLoading(true);
      setError(null);
      setProgress(initialProgress || 10);
      
      const treeStr = generateTreeString(tree, details.name);
      setTreeDigest(treeStr);

      let contentStr = '';
      
      if (selected.length > 0) {
          const filesToFetch = selected.filter(f => typeof f.content !== 'string');
          const alreadyFetched = selected.filter(f => typeof f.content === 'string');
          
          let fetchedResults: { path: string, content: string }[] = [];

          if (filesToFetch.length > 0) {
             let fetchedCount = 0;
             const total = filesToFetch.length;
             setLoadingStatus(`Fetching content... (0/${total})`);
             
             const BATCH_SIZE = 5;
             for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
                  const batch = filesToFetch.slice(i, i + BATCH_SIZE);
                  const results = await Promise.all(batch.map(async (file) => {
                      try {
                          const content = await ghService.getFileContent(details.owner, details.name, file.sha);
                          return { path: file.path, content };
                      } catch (e) {
                          return { path: file.path, content: "// Error fetching content" };
                      }
                  }));
                  fetchedResults = [...fetchedResults, ...results];
                  fetchedCount += results.length;
                  
                  // Progress logic
                  const startP = initialProgress || 10;
                  const endP = 95;
                  const currentP = startP + ((fetchedCount / total) * (endP - startP));
                  setProgress(Math.round(currentP));
                  setLoadingStatus(`Fetching content... (${fetchedCount}/${total})`);
             }
          }

          const allContent = new Map<string, string>();
          alreadyFetched.forEach(f => allContent.set(f.path, f.content!));
          fetchedResults.forEach(r => allContent.set(r.path, r.content));

          if (fetchedResults.length > 0) {
              setFlattenedFiles(prev => prev.map(f => {
                  const newContent = allContent.get(f.path);
                  return newContent !== undefined ? { ...f, content: newContent } : f;
              }));
          }

          selected.forEach(file => {
              const content = allContent.get(file.path) || "// Content not found";
              contentStr += `\n` + "=".repeat(48) + `\n`;
              contentStr += `File: /${file.path}\n`;
              contentStr += "=".repeat(48) + `\n`;
              contentStr += content + `\n`;
          });

      } else {
          contentStr = "// No files selected.";
      }

      setFilesDigest(contentStr);

      let full = `Repository: ${details.owner}/${details.name}\n`;
      full += `Files analyzed: ${selected.length}\n`;
      full += `Estimated tokens: ${Math.ceil(contentStr.length / 4)}\n\n`;
      full += `Directory structure:\n${treeStr}\n\n`;
      full += `Files Content:\n${contentStr}`;
      
      setFullDigest(full);
      setProgress(100);
      setIsLoading(false);
      setLoadingStatus('');
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
      const blob = new Blob([fullDigest], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repoDetails?.name}_digest.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleCopyTreeMarkdown = () => {
    if (!repoDetails) return;
    const treeMd = `# ${repoDetails.name}\n` + generateMarkdownTreeString(fileTree, 2);
    navigator.clipboard.writeText(treeMd);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !geminiService) return;
      
      if (flattenedFiles.length === 0) {
          setError("Please ingest a repository first.");
          return;
      }
      
      const pendingContent = flattenedFiles.some(f => f.isChecked && typeof f.content !== 'string');
      if (pendingContent) {
           await generateDigest();
      }

      const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatLoading(true);

      try {
          const result = await geminiService.analyzeCodebase(flattenedFiles, treeDigest, userMsg.text, chatHistory);
          setChatHistory(prev => [...prev, {
              role: 'model',
              text: result.text,
              timestamp: Date.now(),
              relevantFiles: result.relevantFiles
          }]);
      } catch (err: any) {
          setChatHistory(prev => [...prev, {
              role: 'model',
              text: "Error analyzing: " + err.message,
              timestamp: Date.now(),
              isError: true
          }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  return (
    <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur z-50 flex-none h-14">
            <div className="container mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
                        <Terminal className="h-5 w-5 text-background" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight">
                        GitToken
                    </h1>
                </div>
                <div className="flex items-center space-x-2">
                    {repoDetails && (
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${showChat ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <Bot className="h-4 w-4 mr-2" />
                            {showChat ? 'Close Chat' : 'Chat'}
                        </button>
                    )}
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>

        {/* Main Layout - Flex Row */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left/Main Content Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth">
                <div className="container mx-auto max-w-7xl px-4 py-8">
                    
                    {/* Input Phase (Hero) */}
                    {!repoDetails && (
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <h2 className="text-4xl font-bold tracking-tight mb-4">
                                Codebase to Context
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-md">
                                Transform GitHub repositories into token-optimized prompts for Large Language Models.
                            </p>
                            <RepoInput onIngest={handleIngest} isLoading={isLoading} />
                            
                            {error && (
                                <div className="mt-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-start text-sm text-left max-w-md w-full">
                                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Unable to fetch repository</p>
                                        <p className="opacity-90">{error}</p>
                                    </div>
                                </div>
                            )}

                            {loadingStatus && (
                                <div className="mt-8 flex items-center text-muted-foreground">
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    <span className="text-sm">{loadingStatus}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ingest View (Dashboard) */}
                    {repoDetails && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            
                            {error && (
                                <div className="w-full bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                                        <span className="text-sm font-medium">{error}</span>
                                    </div>
                                    <button onClick={() => setError(null)} className="hover:opacity-75"><X className="h-5 w-5" /></button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Summary Panel */}
                                <div ref={leftPanelRef} className="lg:col-span-4 flex flex-col space-y-4 h-fit">
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
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={handleDownload}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 flex-1"
                                                    >
                                                        <Download className="h-4 w-4 mr-2" /> Download
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopy(fullDigest)}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 flex-1"
                                                    >
                                                        <Copy className="h-4 w-4 mr-2" /> Copy All
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Extension Filter Card */}
                                    {extensionStats.length > 0 && (
                                        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                                            <div className="p-6">
                                                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Filter by Type</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {extensionStats.map((stat) => (
                                                        <button
                                                            key={stat.ext}
                                                            onClick={() => handleToggleExtension(stat.ext)}
                                                            className={`
                                                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border
                                                                ${stat.selected === stat.count 
                                                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                                                                    : stat.selected > 0 
                                                                        ? 'bg-secondary text-secondary-foreground border-secondary'
                                                                        : 'bg-transparent text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                                                                }
                                                            `}
                                                        >
                                                            {stat.ext}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Directory Panel */}
                                <div className="lg:col-span-8 flex flex-col space-y-4">
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
                                                    onClick={generateDigest}
                                                    disabled={isLoading}
                                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-2"
                                                >
                                                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                                                    Refresh
                                                </button>
                                                <button 
                                                    onClick={() => handleCopy(treeDigest)}
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
                            </div>

                            {/* Progress Panel (Visible only when loading) */}
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
                                            <div 
                                                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            
            {/* Chat Sidebar */}
            {repoDetails && showChat && (
                <aside className="w-[400px] border-l border-border bg-card flex flex-col shadow-2xl transition-all duration-300 ease-in-out z-20">
                     <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur">
                        <div className="flex items-center gap-2">
                             <Bot className="h-4 w-4" />
                             <h3 className="font-semibold text-sm">Chat Assistant</h3>
                        </div>
                        <button onClick={() => setShowChat(false)} className="text-muted-foreground hover:text-foreground">
                            <PanelRightClose className="h-4 w-4" />
                        </button>
                     </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={chatScrollRef}>
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                                <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mb-3">
                                    <Bot className="h-6 w-6 opacity-50" />
                                </div>
                                <p className="text-sm">
                                    Ask questions about <strong>{repoDetails.name}</strong>.
                                </p>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div 
                                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground' 
                                        : msg.isError 
                                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                            : 'bg-muted/50 text-foreground border border-border'
                                    }`}
                                >
                                    {msg.role === 'model' ? (
                                        <div className="prose prose-invert prose-xs max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                </div>
                                {msg.role === 'model' && !msg.isError && (
                                   <SourceVisualization files={msg.relevantFiles} />
                                )}
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 flex items-center">
                                    <Loader2 className="animate-spin h-3 w-3 mr-2 text-primary" />
                                    <span className="text-muted-foreground text-xs">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-border bg-background/50 backdrop-blur">
                        <form onSubmit={handleChatSubmit} className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isChatLoading}
                            />
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || isChatLoading}
                                className="absolute right-1 top-1 bottom-1 aspect-square p-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-sm transition-colors flex items-center justify-center"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </form>
                    </div>
                </aside>
            )}
        </div>

        <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            onSettingsChanged={refreshServices}
        />
    </div>
  );
};

export default App;