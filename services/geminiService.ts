
import { GoogleGenAI } from "@google/genai";

/**
 * Generates a formal housing society notice using Gemini 3 Flash.
 */
export const generateNoticeDraft = async (topic: string, audience: string, tone: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an expert Society Secretary. Write a formal notice based on:
      TOPIC: ${topic}
      TARGET AUDIENCE: ${audience}
      TONE: ${tone}
      
      Requirements: Professional structure, clear Subject, standard placeholders, and formal signature block.
      Return ONLY the notice text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Failed to generate notice.";
  } catch (error) {
    console.error("Error in generateNoticeDraft:", error);
    return "An error occurred while generating the notice.";
  }
};

/**
 * Generates a full draft of meeting minutes based on a topic, audience, and tone.
 */
export const generateMinutesDraft = async (topic: string, audience: string, tone: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an expert Housing Society Administrator. Write formal Meeting Minutes for a housing society based on:
      MEETING TOPIC/MAIN AGENDA: ${topic}
      PARTICIPANTS (AUDIENCE): ${audience}
      TONE OF MINUTES: ${tone}
      
      Requirements:
      1. Structure the output into clearly labeled sections: [TITLE], [AGENDA], [DISCUSSION], and [ACTION ITEMS].
      2. Ensure the tone matches ${tone} (e.g., Professional, Strict, Neutral).
      3. Use formal "third-person" language (e.g., "The Committee resolved...", "Members discussed...").
      4. Include standard meeting components like confirming previous minutes.
      5. Do not use markdown code blocks; return plain text with clear headings.
      
      Return the content in this EXACT format:
      [TITLE] ...
      [AGENDA] ...
      [DISCUSSION] ...
      [ACTION ITEMS] ...
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Failed to generate minutes draft.";
  } catch (error) {
    console.error("Error in generateMinutesDraft:", error);
    return "Error generating minutes.";
  }
};

/**
 * Analyzes financial health based on billing and expenses.
 */
export const analyzeFinancials = async (expenses: any[], bills: any[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const expenseSummary = JSON.stringify(expenses.slice(0, 30));
    const billSummary = JSON.stringify(bills.slice(0, 30));

    const prompt = `
      Analyze this housing society financial data:
      Expenses: ${expenseSummary}
      Billing: ${billSummary}
      Provide summary, high spending areas, and 3 actionable suggestions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Financial analysis unavailable.";
  } catch (error) {
    console.error("Error in analyzeFinancials:", error);
    return "Could not perform financial analysis.";
  }
};

/**
 * Formats raw meeting notes into professional minutes.
 */
export const generateMinutesFromNotes = async (rawNotes: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Convert these raw meeting notes into formal Housing Society Meeting Minutes:
        "${rawNotes}"
        Structure: Agenda, Discussion, Resolutions, Action Items.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Failed to format minutes.";
    } catch (error) {
      console.error("Error in generateMinutesFromNotes:", error);
      return "Error processing minutes.";
    }
};
