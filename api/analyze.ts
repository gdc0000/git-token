import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface FileNode {
  name: string;
  path: string;
  content?: string;
  isChecked: boolean;
}



export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files, treeStructure, userPrompt, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const modelId = 'gemini-2.5-flash-lite';

    // Calculate relevance score for a file based on query
    const calculateRelevance = (file: FileNode, queryTerms: string[]): number => {
      let score = 0;
      const fileName = file.name.toLowerCase();
      const filePath = file.path.toLowerCase();
      const content = (file.content || '').toLowerCase();

      // 1. Critical Files Boost (README, configs) - always useful context
      if (fileName.includes('readme')) score += 5;
      if (fileName.includes('package.json') || fileName.includes('requirements.txt') || fileName.includes('tsconfig')) score += 5;

      queryTerms.forEach(term => {
        if (term.length < 3) return; // Skip short words

        // 2. Filename Exact Match (High relevance)
        if (fileName.includes(term)) score += 20;
        
        // 3. Path Match (Medium relevance)
        if (filePath.includes(term)) score += 10;

        // 4. Content Occurrences (capped to prevent long files from dominating purely by length)
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const count = (content.match(regex) || []).length;
        score += Math.min(count, 10);
      });

      return score;
    };

    const selectRelevantFiles = (files: FileNode[], query: string): { file: FileNode; score: number }[] => {
      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      // If query is very short/generic, prioritize root files
      if (terms.length === 0) {
        return files.slice(0, 10).map(f => ({ file: f, score: 0 }));
      }

      const scoredFiles = files.map(file => ({
        file,
        score: calculateRelevance(file, terms)
      }));

      // Sort by score descending
      scoredFiles.sort((a, b) => b.score - a.score);

      // Dynamic threshold: Include top files, but at least top 5, max 20
      const topFiles = scoredFiles.slice(0, 20); 
      
      return topFiles;
    };

    // 1. RAG Step: Filter files based on relevance to the prompt
    const activeFiles = files.filter((f: FileNode) => f.isChecked && typeof f.content === 'string');
    const relevantFilesData = selectRelevantFiles(activeFiles, userPrompt);

    // 2. Build Context String from selected files
    let context = `Directory Structure:\n${treeStructure}\n\n`;
    
    if (relevantFilesData.length > 0) {
      context += `Selected Relevant Files for Context:\n`;
      relevantFilesData.forEach(({ file }) => {
        context += `\n--- START OF FILE ${file.path} ---\n`;
        context += file.content;
        context += `\n--- END OF FILE ${file.path} ---\n`;
      });
    } else {
      context += `No specific file content matched the query keywords. Answering based on general knowledge and directory structure.`;
    }

    const systemInstruction = `You are a senior software engineer assistant. 
You are analyzing a GitHub repository. 
A subset of relevant files has been retrieved based on the user's query to fit into context.
Use the provided Directory Structure to understand the project layout.
Use the provided "Selected Relevant Files" to answer specific implementation questions.
If a file is referenced but not provided in the content, explain that you don't have its content but can infer from the structure.
Be concise, technical, and accurate. Use Markdown for code blocks.`;

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map((h: ChatMessage) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const augmentedPrompt = `[Context Data]\n${context}\n\n[User Question]\n${userPrompt}`;

    const result = await chat.sendMessage({ message: augmentedPrompt });
    
    return res.status(200).json({
      text: result.text || "No response generated.",
      relevantFiles: relevantFilesData.map(d => ({ path: d.file.path, score: d.score }))
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ 
      error: `Error: ${error.message || "Unknown error occurred"}` 
    });
  }
}