import { FileNode, RepoDetails } from '../types';

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', // Images
  '.mp4', '.mov', '.avi', '.webm', // Video
  '.mp3', '.wav', '.ogg', // Audio
  '.zip', '.tar', '.gz', '.7z', '.rar', // Archives
  '.exe', '.dll', '.so', '.dylib', '.bin', // Binaries
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', // Documents
  '.eot', '.ttf', '.woff', '.woff2', // Fonts
  '.lock', // Lock files (often too large/noisy)
  '.min.js', '.min.css', // Minified files
  '.map' // Source maps
];

const IGNORED_DIRS = [
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.vscode', '.idea', '__pycache__'
];

// Threshold for auto-selection (25KB). Files larger than this are unchecked by default.
const MAX_AUTO_SELECT_SIZE = 25 * 1024; 

export class GitHubService {
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token || null;
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    return headers;
  }

  async getRepoDetails(owner: string, repo: string): Promise<RepoDetails> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: this.getHeaders()
    });
    
    if (!res.ok) {
        if (res.status === 404) throw new Error("Repository not found (404). Please check the owner and repository name.");
        if (res.status === 403) throw new Error("GitHub API rate limit exceeded (403). Please add a GitHub Token in settings to increase your limit.");
        if (res.status === 401) throw new Error("Invalid GitHub Token (401). Please check your token in Settings.");
        throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return {
      owner: data.owner.login,
      name: data.name,
      defaultBranch: data.default_branch,
      stars: data.stargazers_count,
      description: data.description
    };
  }

  async getRepoTree(owner: string, repo: string, branch: string): Promise<FileNode[]> {
    // Recursive tree fetch
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
      headers: this.getHeaders()
    });

    if (!res.ok) {
        if (res.status === 404) throw new Error("Repository tree not found. The branch might not exist.");
        if (res.status === 403) throw new Error("GitHub API rate limit exceeded (403). Please add a GitHub Token in settings.");
        if (res.status === 401) throw new Error("Invalid GitHub Token (401). Please check your settings.");
       throw new Error(`Failed to fetch file tree: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.truncated) {
      console.warn("Repository is too large, tree was truncated.");
    }

    const rawFiles: any[] = data.tree;
    
    // Filter and build tree
    const root: FileNode[] = [];
    
    // 1. First pass: Create nodes for all blobs (files), ignoring ignored extensions/dirs
    rawFiles.forEach((file: any) => {
      if (file.type !== 'blob') return; 
      
      const pathParts = file.path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const extension = fileName.includes('.') ? '.' + fileName.split('.').pop()?.toLowerCase() : '';

      // Ignore check
      const isIgnoredDir = pathParts.some((part: string) => IGNORED_DIRS.includes(part));
      const isIgnoredExt = IGNORED_EXTENSIONS.includes(extension || '___');
      
      if (isIgnoredDir || isIgnoredExt) return;

      // Auto-select size check
      const isUnderSizeLimit = file.size ? file.size <= MAX_AUTO_SELECT_SIZE : true;

      const node: FileNode = {
        path: file.path,
        name: fileName,
        type: 'blob',
        sha: file.sha,
        size: file.size,
        url: file.url,
        isChecked: isUnderSizeLimit, // Only check if under size limit
        extension
      };
      
      this.addToTree(root, file.path.split('/'), node);
    });

    return root;
  }

  private addToTree(nodes: FileNode[], pathParts: string[], fileNode: FileNode, parentPath: string = '') {
    const currentPart = pathParts[0];
    const isFile = pathParts.length === 1;

    if (isFile) {
      nodes.push(fileNode);
    } else {
      let folder = nodes.find(n => n.name === currentPart && n.type === 'tree');
      if (!folder) {
        // Construct correct folder path for filtering/toggling
        const folderPath = parentPath ? `${parentPath}/${currentPart}` : currentPart;
        
        folder = {
          path: folderPath, 
          name: currentPart,
          type: 'tree',
          sha: '',
          children: [],
          isChecked: true, // Folders checked by default, but their content might not be
          extension: ''
        };
        nodes.push(folder);
      }
      if (folder.children) {
        this.addToTree(folder.children, pathParts.slice(1), fileNode, folder.path);
      }
    }
    
    // Sort: Folders first, then files
    nodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'tree' ? -1 : 1;
    });
  }

  async getFileContent(owner: string, repo: string, fileSha: string): Promise<string> {
      // Using blobs API to get base64 content
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${fileSha}`, {
          headers: this.getHeaders()
      });
      
      if (!res.ok) {
          if (res.status === 403) throw new Error("Rate limit exceeded while fetching file content.");
          throw new Error(`Failed to fetch file content: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Decode Base64
      try {
        // Handle unicode properly
        const binaryString = atob(data.content.replace(/\s/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      } catch (e) {
          console.error("Decoding error", e);
          return "// Error decoding file content (might be binary)";
      }
  }
}