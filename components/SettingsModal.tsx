import React, { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsChanged }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [githubKey, setGithubKey] = useState('');

  const getEnvGithubToken = () => {
    try {
      return process.env.GITHUB_TOKEN;
    } catch (e) {
      return undefined;
    }
  };

  const envGithubToken = getEnvGithubToken();

  useEffect(() => {
    if (isOpen) {
        setGeminiKey(localStorage.getItem('gemini_key') || '');
        setGithubKey(localStorage.getItem('github_key') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (geminiKey) localStorage.setItem('gemini_key', geminiKey);
    else localStorage.removeItem('gemini_key');

    if (githubKey) localStorage.setItem('github_key', githubKey);
    else localStorage.removeItem('github_key');
    
    onSettingsChanged();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-semibold leading-none tracking-tight">API Settings</h2>
             <button onClick={onClose} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
             </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your API keys for analysis and higher rate limits.
          </p>
        </div>
        
        <div className="grid gap-4 py-4">
            <div className="rounded-md bg-muted p-3 flex items-start text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 mr-2 mt-0.5 text-orange-500" />
                Keys are stored locally in your browser. They are not sent to any middleware server.
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Gemini API Key</label>
                <input 
                    type="password" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">GitHub Token <span className="text-muted-foreground font-normal">(Optional)</span></label>
                <input 
                    type="password" 
                    value={envGithubToken ? '••••••••' : githubKey}
                    onChange={(e) => setGithubKey(e.target.value)}
                    placeholder={envGithubToken ? "Set via Environment Variable" : "github_pat_..."}
                    disabled={!!envGithubToken}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:opacity-50"
                />
            </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <button 
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-2 sm:mt-0"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
                Save changes
            </button>
        </div>
      </div>
    </div>
  );
};