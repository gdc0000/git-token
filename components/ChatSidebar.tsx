import React from 'react';
import { Bot, PanelRightClose, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, RepoDetails } from '../types';
import { SourceVisualization } from './SourceVisualization';

interface ChatSidebarProps {
    repoDetails: RepoDetails | null;
    showChat: boolean;
    setShowChat: (val: boolean) => void;
    chatHistory: ChatMessage[];
    chatInput: string;
    setChatInput: (val: string) => void;
    isChatLoading: boolean;
    handleChatSubmit: (e: React.FormEvent) => void;
    chatScrollRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    repoDetails,
    showChat,
    setShowChat,
    chatHistory,
    chatInput,
    setChatInput,
    isChatLoading,
    handleChatSubmit,
    chatScrollRef,
}) => {
    if (!repoDetails || !showChat) return null;

    return (
        <>
            {/* Mobile Backdrop */}
            {showChat && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 lg:hidden"
                    onClick={() => setShowChat(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 right-0 z-20 w-full sm:w-[400px] bg-card flex flex-col shadow-2xl 
                transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0 lg:border-l lg:border-border lg:shadow-none
                ${showChat ? 'translate-x-0' : 'translate-x-full lg:hidden'}
            `}>
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
                                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm shadow-sm ${msg.role === 'user'
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
                                <SourceVisualization files={msg.relevantFiles} repoDetails={repoDetails} />
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
        </>
    );
};
