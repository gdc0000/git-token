import { GoogleGenAI } from "@google/genai";
import { ChatMessage, FileNode, RelevantFile } from "../types";

export class GeminiService {
  private apiKey: string | undefined;
  private modelId: string;

  constructor(apiKey?: string, modelId: string = "gemini-2.0-flash-lite") {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async analyzeCodebase(
    files: FileNode[],
    treeStructure: string,
    userPrompt: string,
    history: ChatMessage[] = []
  ): Promise<{ text: string; relevantFiles: RelevantFile[] }> {

    // Try to use the API endpoint first (works in production/Vercel)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          treeStructure,
          userPrompt,
          history
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }

      // If we get a 404, we are likely in local development without Vercel runtime
      if (response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Continue to fallback
      } else if (!error.message.includes('404')) {
        console.error("API Error:", error);
      }
    }

    // Fallback: Direct SDK call (useful for local development)
    if (!this.apiKey) {
      return {
        text: "Error: GEMINI_API_KEY is not configured and the backend API is unavailable.",
        relevantFiles: []
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      // Calculate relevance locally for fallback
      const terms = userPrompt.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      const activeFiles = files.filter(f => f.isChecked && typeof f.content === 'string');

      const scoredFiles = activeFiles.map(file => {
        let score = 0;
        const fileName = file.name.toLowerCase();
        const content = (file.content || '').toLowerCase();

        if (fileName.includes('readme')) score += 5;
        terms.forEach(term => {
          if (term.length < 3) return;
          if (fileName.includes(term)) score += 20;
          if (content.includes(term)) score += 5;
        });
        return { file, score };
      });

      scoredFiles.sort((a, b) => b.score - a.score);
      const relevantFilesData = scoredFiles.slice(0, 10);

      let context = `Directory Structure:\n${treeStructure}\n\n`;
      relevantFilesData.forEach(({ file }) => {
        context += `\n--- FILE ${file.path} ---\n${file.content}\n`;
      });

      const chat = ai.chats.create({
        model: this.modelId,
        config: {
          systemInstruction: "You are a senior software engineer. Answer questions about the codebase based on the provided files.",
        },
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      });

      const result = await chat.sendMessage({ message: `[Context]\n${context}\n\n[User]\n${userPrompt}` });

      return {
        text: result.text || "No response.",
        relevantFiles: relevantFilesData.map(d => ({ path: d.file.path, score: d.score }))
      };
    } catch (err: any) {
      console.error("Fallback Error:", err);
      return {
        text: `Error: ${err.message || "Unknown error occurred"}`,
        relevantFiles: []
      };
    }
  }
}