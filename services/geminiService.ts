
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates a formal housing society notice using Gemini 3 Flash.
 */
export const generateNoticeDraft = async (topic: string, audience: string, tone: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Write a formal society notice. Topic: ${topic}, Audience: ${audience}, Tone: ${tone}. Return plain text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate notice.";
  } catch (error) {
    console.error("Error:", error);
    return "Error generating notice.";
  }
};

/**
 * Generates a full draft of meeting minutes.
 */
export const generateMinutesDraft = async (topic: string, audience: string, tone: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Draft formal meeting minutes. Topic: ${topic}, Participants: ${audience}, Tone: ${tone}. Format with [TITLE], [AGENDA], [DISCUSSION], [ACTION ITEMS].`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate minutes.";
  } catch (error) {
    console.error("Error:", error);
    return "Error generating minutes.";
  }
};

/**
 * Generates statutory compliance documents or responses using AI.
 */
export const generateStatutoryDraft = async (documentType: string, context: string, tone: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Draft professional ${documentType} for context: ${context}, Tone: ${tone}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "AI Assistant was unable to draft this document.";
  } catch (error) {
    return "An error occurred.";
  }
};

/**
 * AI-powered report analysis and auditor commentary.
 */
export const generateReportCommentary = async (reportType: string, summaryData: any): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a Chartered Accountant and Statutory Auditor for a Housing Society. 
      Analyze the following ${reportType} data and provide a formal "Auditor's Commentary & Notes to Accounts".
      
      REPORT DATA:
      ${JSON.stringify(summaryData)}
      
      Requirements:
      1. Identify significant year-on-year changes (if data provided).
      2. Flag liquidity concerns (low cash vs high receivables).
      3. Comment on the Surplus/Deficit trend.
      4. Suggest 2 cost-saving measures based on specific expense categories.
      5. Use professional, conservative accounting terminology.
      
      Format the output with clear headings. Do not use markdown backticks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate financial commentary.";
  } catch (error) {
    console.error("Error in generateReportCommentary:", error);
    return "Audit AI is currently unavailable.";
  }
};

/**
 * AI-powered bank reconciliation analysis.
 */
export const analyzeBankReconciliation = async (systemData: any[], bankData: any[]): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze records for matches: SYSTEM: ${JSON.stringify(systemData)}, BANK: ${JSON.stringify(bankData)}. Return JSON with suggestedMatches, anomalies, summary.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { suggestedMatches: [], anomalies: [], summary: "Failed analysis." };
  }
};

/**
 * Analyzes financial health based on billing and expenses.
 */
export const analyzeFinancials = async (expenses: any[], bills: any[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze this data: Expenses: ${JSON.stringify(expenses.slice(0,20))}, Bills: ${JSON.stringify(bills.slice(0,20))}. Give summary and 3 tips.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    return "Error analyzing financials.";
  }
};

/**
 * Formats raw meeting notes into professional minutes.
 */
export const generateMinutesFromNotes = async (rawNotes: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Convert notes to formal minutes: ${rawNotes}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Failed to format.";
    } catch (error) {
      return "Error processing.";
    }
};
