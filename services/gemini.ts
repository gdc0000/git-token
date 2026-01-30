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

    // If we have a local API key, we use the client-side SDK directly.
    // This honors the user's preference to use their own key entered in the UI.
    if (this.apiKey) {
      return this.executeClientSide(files, treeStructure, userPrompt, history);
    }

    // Otherwise, try to use the API endpoint (which uses the server-side environment key)
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
    } catch (error: any) {
      console.error("API Error:", error);
    }

    return {
      text: "Error: No API key provided and server-side analysis failed.",
      relevantFiles: []
    };
  }

  private async executeClientSide(
    files: FileNode[],
    treeStructure: string,
    userPrompt: string,
    history: ChatMessage[] = []
  ): Promise<{ text: string; relevantFiles: RelevantFile[] }> {

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