import { GoogleGenAI } from "@google/genai";
import { ChatMessage, FileNode, RelevantFile } from "../types";

export class GeminiService {
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string = "gemini-2.0-flash-lite") {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  // Calculate relevance score for a file based on query
  private calculateRelevance(file: FileNode, queryTerms: string[]): number {
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

      // 4. Content Occurrences (capped to prevent long files from dominating)
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const count = (content.match(regex) || []).length;
      score += Math.min(count, 10);
    });

    return score;
  }

  async analyzeCodebase(
    files: FileNode[],
    treeStructure: string,
    userPrompt: string,
    history: ChatMessage[] = []
  ): Promise<{ text: string; relevantFiles: RelevantFile[] }> {
    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const terms = userPrompt.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      const activeFiles = files.filter(f => f.isChecked && typeof f.content === 'string');

      // Sort and select top 20 relevant files
      const scoredFiles = activeFiles.map(file => ({
        file,
        score: this.calculateRelevance(file, terms)
      }));

      scoredFiles.sort((a, b) => b.score - a.score);
      const relevantFilesData = scoredFiles.slice(0, 20);

      let context = `Directory Structure:\n${treeStructure}\n\n`;
      context += `Selected Relevant Files for Context:\n`;

      relevantFilesData.forEach(({ file }) => {
        context += `\n--- START OF FILE ${file.path} ---\n${file.content}\n--- END OF FILE ${file.path} ---\n`;
      });

      const chat = ai.chats.create({
        model: this.modelId,
        config: {
          systemInstruction: `You are a senior software engineer assistant analyzing a GitHub repository. 
            Use the provided Directory Structure to understand the project layout.
            Use the "Selected Relevant Files" to answer specific implementation questions.
            Be concise, technical, and accurate. Use Markdown for code blocks.`,
        },
        history: history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }))
      });

      const fullPrompt = `[Context Data]\n${context}\n\n[User Question]\n${userPrompt}`;
      const result = await chat.sendMessage({ message: fullPrompt });

      return {
        text: result.text || "No response generated.",
        relevantFiles: relevantFilesData.map(d => ({ path: d.file.path, score: d.score }))
      };
    } catch (err: any) {
      console.error("Gemini Error:", err);
      return {
        text: `Error: ${err.message || "Unknown error occurred"}`,
        relevantFiles: []
      };
    }
  }
}