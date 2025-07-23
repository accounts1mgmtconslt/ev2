
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord, AttendanceStatus } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini AI features will be disabled.");
}

export interface AIEnhancement {
    date: string; // YYYY-MM-DD
    suggestedStatus: string;
    suggestedReason: string;
}

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            date: {
                type: Type.STRING,
                description: "The date of the record in YYYY-MM-DD format.",
            },
            suggestedStatus: {
                type: Type.STRING,
                description: "A more descriptive status like 'Full Day', 'Absent', 'Short Hours', 'Half Day'.",
            },
            suggestedReason: {
                type: Type.STRING,
                description: "A concise, plausible reason for the status. E.g., 'Likely a full day', 'No check-in record found', 'Slightly short hours', 'Left early'."
            }
        },
        required: ["date", "suggestedStatus", "suggestedReason"],
    }
};

export const enhanceWithAI = async (recordsToAnalyze: AttendanceRecord[], employeeName: string): Promise<AIEnhancement[]> => {
    if (!process.env.API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }
    if (recordsToAnalyze.length === 0) {
        return [];
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const simplifiedRecords = recordsToAnalyze.map(r => ({
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        workHours: r.workHoursDecimal.toFixed(2)
    }));
    
    const prompt = `
        Act as an expert HR analyst. I will provide you with a list of daily attendance records for an employee named ${employeeName}.
        These records have been flagged for review. A standard workday is 8 hours.
        Your task is to analyze each record and provide a more descriptive status and a concise, plausible reason for the attendance status.

        - If work hours are very close to 8 (e.g., 7.8), consider it a 'Full Day'.
        - If work hours are 0 on a workday, it's 'Absent'.
        - If hours are >= 4 but < 7.8, it's 'Short Hours'.
        - If hours are > 0 and < 4, it's 'Half Day'.
        
        Review the following data:
        ${JSON.stringify(simplifiedRecords, null, 2)}
        
        Return your analysis ONLY as a JSON array that strictly adheres to the provided schema. Do not include any other text or explanations.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const enhancedData: AIEnhancement[] = JSON.parse(jsonText);
        return enhancedData;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get analysis from Gemini AI. The model may be overloaded or the input is invalid.");
    }
};
