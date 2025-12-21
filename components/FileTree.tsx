import React, { useState } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileTreeProps {
  nodes: FileNode[];
  onToggle: (path: string, checked: boolean) => void;
  onFileClick?: (node: FileNode) => void;
  level?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ nodes, onToggle, onFileClick, level = 0 }) => {
  return (
    <div className="flex flex-col select-none">
      {nodes.map((node) => (
        <FileTreeNode key={node.path + node.name} node={node} onToggle={onToggle} onFileClick={onFileClick} level={level} />
      ))}
    </div>
  );
};

const FileTreeNode: React.FC<{ node: FileNode; onToggle: (path: string, checked: boolean) => void; onFileClick?: (node: FileNode) => void; level: number }> = ({
  node,
  onToggle,
  onFileClick,
  level,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle(node.path, e.target.checked);
  };

  const handleRowClick = () => {
    if (node.type === 'tree') {
      setIsOpen(!isOpen);
    } else {
      if (onFileClick) {
        onFileClick(node);
      }
    }
  };

  const isLargeFile = node.size && node.size > 25 * 1024;

  return (
    <div>
      <div
        className={`flex items-center py-1.5 px-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer text-sm transition-colors group ${level > 0 ? 'ml-4' : ''}`}
        onClick={handleRowClick}
        title={node.type === 'blob' ? "Click to open on GitHub" : undefined}
      >
        <div className="flex items-center flex-1 min-w-0">
            {node.type === 'tree' ? (
                <button className="p-0.5 mr-1 text-muted-foreground hover:text-foreground">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
            ) : (
                <span className="w-6 mr-1" />
            )}

            <div className="relative flex items-center mr-2">
                 <input
                    type="checkbox"
                    checked={node.isChecked}
                    onChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:text-primary-foreground"
                />
                 <svg
                    className="pointer-events-none absolute left-0 top-0 hidden h-4 w-4 text-primary-foreground peer-checked:block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>

            {node.type === 'tree' ? (
                <Folder className="h-4 w-4 text-muted-foreground mr-2 fill-muted-foreground/20" />
            ) : (
                <File className={`h-4 w-4 mr-2 ${isLargeFile ? 'text-yellow-500' : 'text-zinc-500'}`} />
            )}

            <span className={`truncate ${node.isChecked ? 'text-foreground' : 'text-muted-foreground line-through opacity-60'}`}>
                {node.name}
            </span>
            
            {node.size && (
                <span className={`ml-auto text-xs pl-2 ${isLargeFile ? 'text-yellow-600' : 'text-muted-foreground'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {formatBytes(node.size)}
                </span>
            )}
        </div>
      </div>

      {node.type === 'tree' && isOpen && node.children && (
        <FileTree nodes={node.children} onToggle={onToggle} onFileClick={onFileClick} level={level + 1} />
      )}
    </div>
  );
};

function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}