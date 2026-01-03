import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import * as dbService from './dbService';

// Updated to gemini-3-pro-preview for complex reasoning tasks like SQL generation
const MODEL = 'gemini-3-pro-preview';

const tools: FunctionDeclaration[] = [
  {
    name: 'queryLedger',
    parameters: {
      type: Type.OBJECT,
      description: 'Execute a read-only SQL query against the user sovereign ledger.',
      properties: {
        sql: { type: Type.STRING, description: 'The SQL SELECT statement.' }
      },
      required: ['sql']
    }
  },
  {
    name: 'searchEverything',
    parameters: {
      type: Type.OBJECT,
      description: 'Search across all personal modules using FTS5.',
      properties: {
        term: { type: Type.STRING, description: 'The search keywords.' }
      },
      required: ['term']
    }
  }
];

export const chatWithPDS = async (history: any[], context: any) => {
  // Correctly using process.env.API_KEY with named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { role: 'user', parts: [{ text: `System State: ${JSON.stringify(context)}` }] },
      ...history.map(h => ({ role: h.role, parts: h.parts }))
    ],
    config: {
      systemInstruction: 'You are the OmniPDS Prime Consciousness. Use the queryLedger tool to answer specific questions about the user history. Keep responses concise and sovereign.',
      tools: [{ functionDeclarations: tools }]
    }
  });

  if (response.functionCalls) {
    for (const call of response.functionCalls) {
      let result = "Error";
      if (call.name === 'queryLedger') {
        const dbRes = dbService.executeRawSQL(call.args.sql as string);
        result = JSON.stringify(dbRes.data || dbRes.error);
      } else if (call.name === 'searchEverything') {
        result = JSON.stringify(dbService.universalSearch(call.args.term as string));
      }

      // Re-initialize for follow-up content generation
      const final = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: `Result for ${call.name}: ${result}` }] }]
      });
      // Correctly access .text property
      return final.text;
    }
  }

  return response.text;
};

export const getPersonalInsights = async (data: any) => {
  if (!process.env.API_KEY) return { insights: [] };
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Analyze data muscle: ${JSON.stringify(data)}. Provide 3 strategic insights.`,
    config: { responseMimeType: "application/json", responseSchema: {
      type: Type.OBJECT,
      properties: {
        insights: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
          title: {type: Type.STRING}, category: {type: Type.STRING}, description: {type: Type.STRING}, impact: {type: Type.STRING}, urgency: {type: Type.STRING}
        }}}
      }
    }}
  });
  // Correctly access .text property
  return JSON.parse(res.text || '{"insights":[]}');
};

export const getSovereignRoadmap = async (data: any) => {
  if (!process.env.API_KEY) return { roadmap: [] };
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Roadmap from data: ${JSON.stringify(data)}`,
    config: { responseMimeType: "application/json", responseSchema: {
      type: Type.OBJECT,
      properties: {
        roadmap: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
          week: {type: Type.INTEGER}, focus: {type: Type.STRING}, tasks: {type: Type.ARRAY, items: {type: Type.STRING}}, financialGoal: {type: Type.STRING}
        }}}
      }
    }}
  });
  // Correctly access .text property
  return JSON.parse(res.text || '{"roadmap":[]}');
};