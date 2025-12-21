# GitToken
**Transform GitHub repositories into AI-ready context**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fgemini-gitingest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 🎯 What is GitToken?

GitToken is a powerful web application that converts GitHub repositories into optimized prompts for Large Language Models. It intelligently analyzes codebases, extracts relevant files based on your queries, and provides context-aware AI assistance.

### Key Features:
- 🔍 **Smart File Selection** - AI-powered relevance scoring to select the most relevant files
- 💬 **Interactive Chat** - Ask questions about any codebase with context-aware responses  
- 📁 **Visual File Explorer** - Intuitive tree and list views with filtering by file type
- 🚀 **Token Optimization** - Estimates and optimizes token usage for cost-effective AI queries
- 🔄 **Real-time Processing** - Progress tracking and batch processing for large repositories
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Gemini API key
- GitHub token (for private repositories)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd gemini-gitingest
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required: Your Gemini API key from Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Your GitHub personal access token (for private repos)
GITHUB_TOKEN=your_github_token_here
```

### Getting API Keys

1. **Gemini API Key:**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

2. **GitHub Token (Optional):**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` scope
   - Add it to your `.env` file for private repository access

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Fork this repository**
2. **Connect to Vercel:**
   ```bash
   npx vercel
   ```
3. **Set environment variables in Vercel dashboard:**
   - `GEMINI_API_KEY` - Your Gemini API key
   - `GITHUB_TOKEN` - (Optional) Your GitHub token

4. **Deploy!** 🎉

### Manual Deployment

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

## 📖 Usage Guide

### 1. **Ingest a Repository**
- Enter a GitHub repository URL or `owner/repo` format
- GitIngest will fetch the repository structure and file metadata
- Files are automatically analyzed for relevance scoring

### 2. **Select Files**
- Use the visual file tree to select/deselect files
- Filter by file extensions using the type filter
- Toggle between tree and list views
- Monitor estimated tokens and file sizes

### 3. **Generate Context**
- Click "Copy Tree" for markdown-formatted directory structure
- Use "Copy All" for complete repository context
- Download as text file for offline use

### 4. **Chat with AI**
- Toggle the chat panel to ask questions about the codebase
- GitIngest intelligently selects relevant files based on your query
- Get context-aware responses with source file references
- View relevance scores for used files

## 🧠 How It Works

### Relevance Algorithm
GitIngest uses a sophisticated relevance scoring system:

1. **Filename Matching** (+20 points) - Exact matches in file names
2. **Path Matching** (+10 points) - Matches in file paths  
3. **Content Analysis** (+1-10 points) - Keyword occurrences in file content
4. **Critical Files** (+5 points) - README, package.json, config files

### Token Optimization
- Automatically estimates token usage (~1 token per 4 characters)
- Shows selected vs total file counts
- Helps optimize costs for API calls

### Smart Context Building
- Dynamic file selection based on query relevance
- Maximum 20 files per query to stay within context limits
- Prioritizes most relevant files when limits are reached

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Vite
- **UI:** Lucide React icons + custom components
- **Backend:** Vercel serverless functions
- **AI:** Google Gemini API
- **Git:** GitHub REST API

## 📁 Project Structure

```
gemini-gitingest/
├── components/          # React components
│   ├── FileTree.tsx    # File tree explorer
│   ├── RepoInput.tsx   # Repository input form
│   └── SettingsModal.tsx # Settings panel
├── services/           # API service layers
│   ├── gemini.ts      # Gemini AI integration
│   └── github.ts      # GitHub API integration
├── api/               # Serverless functions
│   └── analyze.ts     # Secure Gemini API endpoint
├── types.ts           # TypeScript definitions
├── constants.ts       # App constants
├── App.tsx           # Main application component
├── vite.config.ts    # Build configuration
└── vercel.json       # Deployment configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/gemini-gitingest/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ using React, Vite, and Google Gemini**