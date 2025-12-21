export interface FileNode {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
  children?: FileNode[];
  isChecked: boolean;
  content?: string;
  extension?: string;
}

export interface RepoDetails {
  owner: string;
  name: string;
  defaultBranch: string;
  stars: number;
  description: string;
}

export interface ProcessingStats {
  totalFiles: number;
  selectedFiles: number;
  totalSize: number;
  estimatedTokens: number;
}

export enum ViewMode {
  INGEST = 'INGEST',
  CHAT = 'CHAT'
}

export interface RelevantFile {
  path: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  relevantFiles?: RelevantFile[];
}