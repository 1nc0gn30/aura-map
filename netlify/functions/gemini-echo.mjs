import { GoogleGenAI } from "@google/genai";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const parseModelJson = (rawText) => {
  if (!rawText) {
    throw new Error("Model returned an empty response");
  }

  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Fallback for occasional markdown fenced JSON responses.
    const withoutFences = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(withoutFences);
  }
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: jsonHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "Invalid latitude/longitude" }),
      };
    }

    const requestApiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const apiKey = requestApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "Gemini API key is not configured" }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a mystical cartographer. Provide a historical and cultural "echo" for the location at coordinates: Latitude ${lat}, Longitude ${lng}.
Format the response as a JSON object with the following keys:
- title: A poetic name for this specific spot or region.
- history: A brief, fascinating historical fact about this area (max 3 sentences).
- culture: A unique cultural insight or tradition from this region (max 3 sentences).
- vibe: A one-word description of the "energy" of this place.

Ensure the response is ONLY the JSON object.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = parseModelJson(response.text);

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ echo: parsed }),
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Failed to generate echo" }),
    };
  }
};
