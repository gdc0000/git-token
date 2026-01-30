import React from 'react';
import { Terminal, Bot, Settings, Sparkles } from 'lucide-react';

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
    return (
        <header className="border-b border-border bg-background/95 backdrop-blur z-50 flex-none h-14">
            <div className="container mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
                <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleReset} id="header-logo">
                    <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors">
                        <Terminal className="h-5 w-5 text-background" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                        GitToken
                    </h1>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={startTutorial}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-2 sm:px-3 mr-1 sm:mr-2"
                        title="Help Tutorial"
                    >
                        <Sparkles className="h-4 w-4 sm:mr-2 text-primary" />
                        <span className="hidden sm:inline">Guide</span>
                    </button>
                    {repoDetails && (
                        <button
                            id="chat-button"
                            onClick={() => setShowChat(!showChat)}
                            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-2 sm:px-3 ${showChat ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <Bot className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{showChat ? 'Close Chat' : 'Chat'}</span>
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
        </header>
    );
};
