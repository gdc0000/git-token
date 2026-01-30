import React, { useState, useEffect } from 'react';
import { Terminal, Bot, Settings, Sparkles, Github, Star } from 'lucide-react';

interface HeaderProps {
    handleReset: () => void;
    showChat: boolean;
    setShowChat: (val: boolean) => void;
    setShowSettings: (val: boolean) => void;
    repoDetails: any; // Using any for simplicity here or import RepoDetails
    startTutorial: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    handleReset,
    showChat,
    setShowChat,
    setShowSettings,
    repoDetails,
    startTutorial,
}) => {
    const [stars, setStars] = useState<number | null>(null);

    useEffect(() => {
        const fetchStars = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/gdc0000/git-token');
                const data = await response.json();
                if (data.stargazers_count !== undefined) {
                    setStars(data.stargazers_count);
                }
            } catch (error) {
                console.error('Error fetching stars:', error);
            }
        };
        fetchStars();
    }, []);

    return (
        <header className="border-b border-border bg-background/95 backdrop-blur z-50 flex-none h-14 w-full">
            <div className="container mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
                <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleReset} id="header-logo">
                    <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors">
                        <Terminal className="h-5 w-5 text-background" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                        GitToken
                    </h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <a
                        href="https://github.com/gdc0000/git-token"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-2.5 py-1.5 sm:px-3 rounded-full bg-secondary/30 hover:bg-secondary/50 transition-all border border-border hover:border-primary/50 text-sm font-medium group/github"
                    >
                        <Github className="h-4 w-4 group-hover/github:scale-110 transition-transform" />
                        <div className="flex items-center gap-1.5 border-l border-border pl-2 ml-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 group-hover/github:animate-pulse" />
                            <span className="text-xs font-bold tabular-nums">
                                {stars !== null ? stars.toLocaleString() : '...'}
                            </span>
                        </div>
                    </a>

                    <div className="flex items-center space-x-1 sm:space-x-2 border-l border-border pl-2 sm:pl-4">
                        <button
                            onClick={startTutorial}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-2 sm:px-3"
                            title="Help Tutorial"
                        >
                            <Sparkles className="h-4 w-4 sm:mr-2 text-primary" />
                            <span className="hidden md:inline">Guide</span>
                        </button>
                        {repoDetails && (
                            <button
                                id="chat-button"
                                onClick={() => setShowChat(!showChat)}
                                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-2 sm:px-3 ${showChat ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                            >
                                <Bot className="h-4 w-4 sm:mr-2" />
                                <span className="hidden md:inline">{showChat ? 'Close Chat' : 'Chat'}</span>
                            </button>
                        )}
                        <button
                            id="settings-button"
                            onClick={() => setShowSettings(true)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
