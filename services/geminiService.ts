
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
    const prompt = `
      You are a legal consultant specializing in Housing Society Bye-laws and the Co-operative Societies Act.
      Draft a professional ${documentType} based on the following context:
      
      CONTEXT: ${context}
      TONE: ${tone}
      
      Requirements:
      1. Use formal legal terminology suitable for statutory records.
      2. Ensure it sounds authoritative yet compliant.
      3. Structure it according to standard regulatory formats.
      4. If drafting a response to an audit objection, be specific and professional.
      
      Return the document text only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "AI Assistant was unable to draft this document.";
  } catch (error) {
    console.error("Error in generateStatutoryDraft:", error);
    return "An error occurred while communicating with the Smart Assistant.";
  }
};

/**
 * AI-powered bank reconciliation analysis.
 */
export const analyzeBankReconciliation = async (systemData: any[], bankData: any[]): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze the following two sets of financial transactions for a Housing Society and identify matches.
      
      SYSTEM RECORDS (Cash Book):
      ${JSON.stringify(systemData)}
      
      BANK STATEMENT RECORDS:
      ${JSON.stringify(bankData)}
      
      Tasks:
      1. Find high-confidence matches (same or similar amount + date within 5 days).
      2. Identify suspicious anomalies (e.g., bank charges not in system, double payments).
      3. Suggest potential matches where amounts match but descriptions differ.
      
      Return a JSON object only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedMatches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  systemId: { type: Type.STRING },
                  bankId: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ['systemId', 'bankId', 'reason']
              }
            },
            anomalies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING, description: "BANK or SYSTEM" },
                  note: { type: Type.STRING }
                },
                required: ['source', 'note']
              }
            },
            summary: { type: Type.STRING }
          },
          required: ['suggestedMatches', 'anomalies', 'summary']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error in analyzeBankReconciliation:", error);
    return { suggestedMatches: [], anomalies: [], summary: "Failed to perform AI analysis." };
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
