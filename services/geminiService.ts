
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import * as dbService from './dbService';

const PRO_MODEL = 'gemini-3-pro-preview';

// Tool definitions to give the AI "muscle"
const pdsTools: FunctionDeclaration[] = [
  {
    name: 'queryLedger',
    parameters: {
      type: Type.OBJECT,
      description: 'Execute a read-only SQL query against the personal data server.',
      properties: {
        sql: { type: Type.STRING, description: 'The SQL SELECT statement.' }
      },
      required: ['sql']
    }
  },
  {
    name: 'getFTSResults',
    parameters: {
      type: Type.OBJECT,
      description: 'Perform a high-speed full-text search across all personal records.',
      properties: {
        term: { type: Type.STRING, description: 'The search term.' }
      },
      required: ['term']
    }
  }
];

export const getPersonalInsights = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `You are the OmniPDS Strategic Analyst. Analyze this unified data repository: ${JSON.stringify(data)}. Identify non-obvious correlations and provide 3 high-impact insights.`,
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 16000 },
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
                urgency: { type: Type.STRING }
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

export const chatWithPDS = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], context: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // High-muscle chat with tool support
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: [
      { role: 'user', parts: [{ text: `System Context: ${JSON.stringify(context)}` }] },
      ...history.map(h => ({ role: h.role, parts: h.parts }))
    ],
    config: {
      systemInstruction: 'You are the OmniPDS Prime AI. You have direct access to the user sovereign ledger. Use tools to query or search when needed. Be highly strategic.',
      tools: [{ functionDeclarations: pdsTools }],
      thinkingConfig: { thinkingBudget: 12000 }
    }
  });

  // Handle simple tool call logic (basic implementation)
  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    let result = "No data found.";
    
    if (call.name === 'queryLedger') {
      const dbResult = dbService.executeRawSQL(call.args.sql as string);
      result = JSON.stringify(dbResult.data);
    } else if (call.name === 'getFTSResults') {
      const ftsResult = dbService.universalSearch(call.args.term as string);
      result = JSON.stringify(ftsResult);
    }

    // Follow up with tool results
    const finalResponse = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `Result of tool ${call.name}: ${result}` }] }
      ],
      config: { systemInstruction: 'Based on the tool results above, provide a definitive answer.' }
    });
    return finalResponse.text;
  }

  return response.text;
};

export const getSovereignRoadmap = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Create a 30-day strategic roadmap based on these records: ${JSON.stringify(data)}.`,
    config: {
      temperature: 0.9,
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
