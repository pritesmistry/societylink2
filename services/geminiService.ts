
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Answers complex society-related questions using Gemini 3 Flash.
 */
export const askSocietyExpert = async (question: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `
      You are a specialized Legal and Administrative Consultant for Co-operative Housing Societies (CHS). 
      Your knowledge base includes the Model Bye-laws (specifically Maharashtra, but applicable generally), the Co-operative Societies Act, and common housing protocols.
      
      Respond to user queries with:
      1. A clear, direct answer.
      2. References to relevant Bye-laws or Sections if applicable.
      3. A note if a General Body resolution or Managing Committee approval is required.
      4. Professional, firm, yet helpful tone.
      
      If the question is not about housing societies, politely decline and ask for a society-related query.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text || "I couldn't generate an answer for that. Please try a different query.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI expert is currently unavailable. Please check your network or try again later.";
  }
};

/**
 * Generates a custom society template based on description.
 */
export const generateCustomTemplate = async (description: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are a Society Manager. Draft a professional template for a Co-op Housing Society based on the following requirement:
        REQUIREMENT: ${description}
        
        Guidelines:
        1. Use placeholders like [Society Name], [Date], [Member Name] where appropriate.
        2. Keep the tone professional and authoritative.
        3. Ensure the structure is clear (Subject, Body, Sign-off).
        4. Do not include markdown formatting like bold (**) or headers (#), return as clean plain text with spacing.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Failed to generate template.";
    } catch (error) {
      console.error("Error:", error);
      return "Error generating AI template.";
    }
  };

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
