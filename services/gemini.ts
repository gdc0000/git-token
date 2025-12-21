import { ChatMessage, FileNode, RelevantFile } from "../types";

export class GeminiService {
  async analyzeCodebase(
    files: FileNode[],
    treeStructure: string,
    userPrompt: string, 
    history: ChatMessage[] = []
  ): Promise<{ text: string; relevantFiles: RelevantFile[] }> {
    
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("API Error:", error);
      return {
        text: `Error: ${error.message || "Unknown error occurred"}`,
        relevantFiles: []
      };
    }
  }
}