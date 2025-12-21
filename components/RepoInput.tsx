import React, { useState } from 'react';
import { Github, Loader2, ArrowRight } from 'lucide-react';

interface RepoInputProps {
  onIngest: (owner: string, repo: string) => void;
  isLoading: boolean;
}

export const RepoInput: React.FC<RepoInputProps> = ({ onIngest, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let owner = '';
    let repo = '';

    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    if (cleanUrl.includes('github.com')) {
      try {
        const urlObj = new URL(cleanUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          owner = parts[0];
          repo = parts[1];
        }
      } catch (e) {
        alert("Invalid URL");
        return;
      }
    } else if (cleanUrl.split('/').length === 2) {
      const parts = cleanUrl.split('/');
      owner = parts[0];
      repo = parts[1];
    } else {
        alert("Please enter a valid GitHub URL or 'owner/repo' format.");
        return;
    }

    if (owner && repo) {
      onIngest(owner, repo);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Github className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="github.com/owner/repo"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
            />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Ingest <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
      <p className="text-center text-muted-foreground text-xs mt-3">
        Enter a public GitHub repository URL to analyze.
      </p>
    </div>
  );
};