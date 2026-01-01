
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client with the high-performance Pro model
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PRO_MODEL = 'gemini-3-pro-preview';

/**
 * Generates deep insights using the model's high thinking budget for complex reasoning.
 */
export const getPersonalInsights = async (data: any) => {
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `You are the OmniPDS Strategic Analyst. Analyze this unified data repository: ${JSON.stringify(data)}. 
    Identify non-obvious correlations between work velocity, financial burn, and social reach. 
    Provide 3 high-impact strategic insights.`,
    config: {
      temperature: 1,
      thinkingConfig: { thinkingBudget: 32768 }, // Maximize reasoning capability
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                impact: { type: Type.STRING },
                urgency: { type: Type.STRING, description: "Scale of 1-10" }
              },
              required: ["title", "category", "description", "impact", "urgency"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"insights": []}');
};

/**
 * Generates a comprehensive 30-day "Sovereign Roadmap" correlating all modules.
 */
export const getSovereignRoadmap = async (data: any) => {
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Create a 30-day strategic roadmap based on these PDS records: ${JSON.stringify(data)}. 
    Format as a structured plan with weekly milestones, financial targets, and social engagement goals.`,
    config: {
      temperature: 0.9,
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.INTEGER },
                focus: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                financialGoal: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"roadmap": []}');
};

export const chatWithPDS = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], context: any) => {
  const chat = ai.chats.create({
    model: PRO_MODEL,
    config: {
      systemInstruction: `You are the OmniPDS Prime AI. You represent the "Best AI" logic for a decentralized Personal Data Server.
      You have total visibility into the user's Financial, Social, and Project data.
      Your primary goal is to help the user achieve complete data and financial sovereignty.
      Be highly analytical, strategic, and capable of complex multi-module cross-referencing.
      Context: ${JSON.stringify(context)}`,
      thinkingConfig: { thinkingBudget: 16000 } // Reserve significant budget for chat reasoning
    }
  });

  const lastMessage = history[history.length - 1].parts[0].text;
  const result = await chat.sendMessage({ message: lastMessage });
  return result.text;
};
