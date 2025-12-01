
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not set in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateNoticeDraft = async (topic: string, audience: string, tone: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key missing. Cannot generate notice.";

  const prompt = `
    Write a professional notice for a housing society.
    Topic: ${topic}
    Target Audience: ${audience}
    Tone: ${tone}
    
    Format the output as a clean, ready-to-send message. Do not add markdown code blocks around it.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating notice:", error);
    return "An error occurred while communicating with the AI.";
  }
};

export const analyzeFinancials = async (expenses: any[], bills: any[]): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key missing. Cannot analyze financials.";

  const expenseSummary = JSON.stringify(expenses.slice(0, 20)); // Sending a subset to avoid token limits if list is huge
  const billSummary = JSON.stringify(bills.slice(0, 20));

  const prompt = `
    You are a financial analyst for a housing society.
    Here is the recent expense data: ${expenseSummary}
    Here is the recent billing/income data: ${billSummary}

    Please provide a brief executive summary of the society's financial health.
    Identify:
    1. Major spending categories.
    2. Payment collection efficiency (Paid vs Pending/Overdue).
    3. One suggestion for cost optimization or revenue improvement.
    
    Keep it concise and professional. Use markdown for formatting (bullet points, bold text).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error analyzing financials:", error);
    return "An error occurred during analysis.";
  }
};

export const generateMinutesFromNotes = async (rawNotes: string): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API Key missing. Cannot generate minutes.";
  
    const prompt = `
      You are an expert secretary for a housing society. 
      Convert the following rough notes from a meeting into formal Meeting Minutes.
  
      Raw Notes:
      ${rawNotes}
  
      Structure the output clearly with the following sections (if applicable based on notes):
      1. Agenda
      2. Discussion Points
      3. Decisions Made
      4. Action Items (Owners & Deadlines)
      
      Keep the tone professional and objective. Do not add markdown code blocks.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Failed to generate minutes.";
    } catch (error) {
      console.error("Error generating minutes:", error);
      return "An error occurred while communicating with the AI.";
    }
  };
