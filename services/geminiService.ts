
import { GoogleGenAI } from "@google/genai";

/**
 * Generates a formal housing society notice using Gemini 3 Flash.
 * Adheres to direct API key usage and latest response property patterns.
 */
export const generateNoticeDraft = async (topic: string, audience: string, tone: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an expert Society Secretary and Communications Manager for a high-end residential complex.
      Write a formal notice based on the following:
      
      TOPIC: ${topic}
      TARGET AUDIENCE: ${audience}
      TONE: ${tone}
      
      Requirements:
      1. Use professional English.
      2. Include placeholders like [Date], [Time], and [Venue] where appropriate.
      3. Structure with a clear Subject line at the top.
      4. Keep it concise yet comprehensive.
      5. End with a standard "By Order of Managing Committee" signature block.
      
      Return ONLY the notice text. Do not include markdown code blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "Failed to generate a notice draft. Please try again.";
  } catch (error) {
    console.error("Error in generateNoticeDraft:", error);
    if (error instanceof Error && error.message.includes("API key")) {
      return "Error: API Key is missing or invalid. Please check your environment.";
    }
    return "An error occurred while generating the notice. Please check your connection.";
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

      Provide:
      1. A summary of the current financial state.
      2. Identification of the highest spending categories.
      3. Collection efficiency insights.
      4. Three actionable suggestions to reduce costs or increase reserves.
      
      Format with professional markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Financial analysis unavailable.";
  } catch (error) {
    console.error("Error in analyzeFinancials:", error);
    return "Could not perform financial analysis at this time.";
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

        Structure:
        - Agenda
        - Major Discussion Points
        - Resolutions Passed
        - Action Items (Owner & Due Date)
        
        Tone: Formal and objective.
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
