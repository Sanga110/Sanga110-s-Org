
import { GoogleGenAI, Type } from "@google/genai";
import { MatchAnalysis, Fixture, Prediction, BetStatus, Accumulator, LiveAnalysis } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure this is available in your env
const ai = new GoogleGenAI({ apiKey });

// Helper to get East Africa Time (Tanzania/Nairobi - UTC+3)
const getTanzaniaTime = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi", hour12: false });
};

export const getMatchAnalysis = async (home: string, away: string, league: string): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate analysis.";

  try {
    const prompt = `
      Act as a professional football betting analyst for 'King Maokoto'. 
      Analyze the matchup between ${home} and ${away} in the ${league}. 
      Provide a concise 3-sentence summary focusing on team form, key tactical advantages, or historical context.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis due to an error.";
  }
};

export const getDetailedMatchAnalysis = async (home: string, away: string, league: string): Promise<MatchAnalysis | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `
      Analyze the upcoming football match between ${home} and ${away} in the ${league}.
      Provide a comprehensive betting analysis.
      
      REQUIREMENTS:
      1. Win Probabilities MUST be integers between 0 and 100 (e.g., 45, 25, 30).
      2. Win Probabilities MUST SUM TO EXACTLY 100.
      3. Also provide 3 alternative "safer" or high-probability betting markets.
      4. DIVERSIFY MARKETS: Consider Asian Handicaps, BTTS, Over/Under Corners, Card bookings, or Player Props if high confidence.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedScore: { type: Type.STRING, description: "Predicted score, e.g. 2-1" },
            winProbability: {
              type: Type.OBJECT,
              properties: {
                home: { type: Type.NUMBER, description: "Home win chance (0-100)" },
                draw: { type: Type.NUMBER, description: "Draw chance (0-100)" },
                away: { type: Type.NUMBER, description: "Away win chance (0-100)" }
              },
              required: ["home", "draw", "away"]
            },
            keyInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedBet: { type: Type.STRING },
            alternativeTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  market: { type: Type.STRING },
                  probability: { type: Type.STRING }
                },
                required: ["market", "probability"]
              },
            },
            confidence: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["predictedScore", "winProbability", "keyInsights", "recommendedBet", "alternativeTips", "confidence", "reasoning"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    
    return JSON.parse(jsonText) as MatchAnalysis;
  } catch (error) {
    console.error("Gemini Detailed Analysis Error:", error);
    return null;
  }
};

export const getDailyFixturesAI = async (date: string): Promise<{ fixtures: Fixture[], sources: {title: string, uri: string}[] }> => {
  if (!apiKey) return { fixtures: [], sources: [] };

  const tanzaniaTime = getTanzaniaTime();

  try {
    const prompt = `
      Current Reference Time: ${tanzaniaTime} (East Africa Time - EAT / UTC+3).
      Target Date: ${date}.
      
      Task: Perform a broad search for professional football matches scheduled STRICTLY for ${date}.
      
      STRICT DATE RULE:
      - You MUST ONLY return matches where the kickoff is on ${date} in the local timezone or EAT.
      - If a match is on the previous or next day, DO NOT include it.
      
      SEARCH SCOPE (MAXIMIZE COVERAGE):
      1. Tier 1: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League.
      2. Tier 2: Championship, Eredivisie, Primeira Liga, Süper Lig, Belgian Pro League.
      3. Global: Brasileirão, Primera División (Argentina), MLS, SPL, J-League, A-League.
      4. International: CAF, UEFA, CONMEBOL qualifiers or tournaments.
      
      CRITICAL EXCLUSIONS (STRICT):
      - NO Futsal, Esports (FIFA, eFootball, GT Leagues).
      - NO Simulated Reality (SRL), Beach Soccer, Indoor.
      - NO U17/U19/Youth leagues unless major international finals.
      
      DATA LOGIC: 
      - Match times are EAT (UTC+3).
      - Status: "LIVE" (if playing now), "FINISHED" (if FT), "SCHEDULED" (if future).
      - For FINISHED matches, you MUST provide the score.
      - For LIVE matches, provide the score.
      
      Return a JSON array with at least 15-20 fixtures if available:
      - id: string (uuid)
      - homeTeam: string
      - awayTeam: string
      - league: string
      - time: string (HH:MM in EAT)
      - date: string (MUST BE ${date})
      - status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED"
      - homeScore: number/string (Required if LIVE or FINISHED)
      - awayScore: number/string (Required if LIVE or FINISHED)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let fixtures: Fixture[] = [];
    try {
      const text = response.text || "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      
      if (jsonString.trim().startsWith('[')) {
         const rawFixtures = JSON.parse(jsonString) as Fixture[];
         
         // CODE LEVEL FILTERING
         const bannedKeywords = [
           'futsal', 'esport', 'fifa', 'e-football', 'simulated', 'srl', 'virtual', 'beach', 'indoor', 'women', 'u17', 'u19'
         ];
         
         fixtures = rawFixtures.filter(f => {
            const combinedText = `${f.league} ${f.homeTeam} ${f.awayTeam}`.toLowerCase();
            const isBanned = bannedKeywords.some(keyword => combinedText.includes(keyword));
            
            // Strict date matching
            const dateMatch = f.date === date;
            
            return !isBanned && dateMatch;
         });
      }
    } catch (e) {
      console.error("Failed to parse fixtures JSON from AI response", e);
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web ? { title: chunk.web.title || 'Source', uri: chunk.web.uri || '#' } : null)
      .filter(s => s !== null && s.uri !== '#') as {title: string, uri: string}[] || [];

    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { fixtures, sources: uniqueSources };

  } catch (error) {
    console.error("Gemini Fixture Search Error:", error);
    return { fixtures: [], sources: [] };
  }
};

export const getLiveFixturesAI = async (): Promise<{ fixtures: Fixture[], sources: {title: string, uri: string}[] }> => {
  if (!apiKey) return { fixtures: [], sources: [] };

  const tanzaniaTime = getTanzaniaTime();

  try {
    const prompt = `
      Current Time: ${tanzaniaTime} (EAT).
      Task: Find ALL currently LIVE / IN-PLAY professional football matches worldwide right now.
      
      SEARCH INSTRUCTIONS:
      - Look for live scores in Europe, South America, Asia, and Africa.
      - Look for status indicators like "Live", "1H", "2H", "HT", "ET", "Pen".
      - Be aggressive in finding matches. If a major or secondary league game is on, list it.
      
      CRITICAL EXCLUSIONS: 
      - No Esports, No Futsal, No SRL, No Virtual.
      - Exclude games clearly marked "FT" or "Finished" unless they just finished 1 minute ago.
      
      DATA REQUIREMENT:
      - Time: Current minute (e.g. 34', 65') OR status (e.g. "1H", "2H", "HT", "Live").
      - Score: Must be current.
      
      Return JSON array:
      [{
        "id": "uuid",
        "homeTeam": "string",
        "awayTeam": "string",
        "league": "string",
        "time": "string",
        "date": "YYYY-MM-DD",
        "status": "LIVE",
        "homeScore": number,
        "awayScore": number
      }]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let fixtures: Fixture[] = [];
    try {
      const text = response.text || "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      
      if (jsonString.trim().startsWith('[')) {
         fixtures = JSON.parse(jsonString) as Fixture[];
      }
    } catch (e) {
      console.error("Failed to parse live fixtures JSON", e);
    }
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web ? { title: chunk.web.title || 'Source', uri: chunk.web.uri || '#' } : null)
      .filter(s => s !== null && s.uri !== '#') as {title: string, uri: string}[] || [];
      
    return { fixtures, sources };

  } catch (error) {
    console.error("Gemini Live Search Error:", error);
    return { fixtures: [], sources: [] };
  }
};

export const getLiveMatchAnalysis = async (fixture: Fixture): Promise<LiveAnalysis | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `
      Perform a REAL-TIME analysis for the ongoing match: ${fixture.homeTeam} vs ${fixture.awayTeam}.
      Current Reference Time: ${getTanzaniaTime()} (EAT).
      
      Task: Search specifically for the LIVE STATUS and GAME STATS of this match right now.
      
      STRICT OUTPUT REQUIREMENTS (Be Concise & Actionable):
      1. Match Time: Current minute (e.g. 32', HT, 88').
      2. Score: Accurate current score.
      3. Momentum: Max 8 words describing who is pushing.
      4. Stats: Key stats only (e.g. "Home: 5 shots, 60% poss").
      5. Live Bet Tip: A specific, actionable market to bet on NOW (e.g. "Next Goal: Home", "Over 1.5 Goals").
      6. Reasoning: Max 15 words justifying the tip.
      
      Return JSON:
      {
        "matchTime": "String",
        "currentScore": "String",
        "momentum": "String",
        "statsSummary": "String",
        "liveBetTip": "String",
        "reasoning": "String"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    return JSON.parse(jsonString) as LiveAnalysis;

  } catch (error) {
    console.error("Gemini Live Analysis Error:", error);
    return null;
  }
};

export const verifyBetResult = async (prediction: Prediction): Promise<{ status: BetStatus, score: string, reasoning: string } | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `
      Adjudicate this bet for 'King Maokoto'.
      Match: ${prediction.homeTeam} vs ${prediction.awayTeam} (${prediction.matchDate}).
      Market: "${prediction.market}".
      
      Task: Find the official result of this match using Google Search.
      
      Rules:
      - If the match is LIVE/ONGOING: Return status "PENDING" but provide the current score (e.g. "1-0 (35')").
      - If the match is FINISHED: Provide the Final Score (FT) and determine if the bet is WON, LOST, or VOID.
      - If the match is NOT STARTED: Return status "PENDING".
      
      Return JSON: { "status": "WON"|"LOST"|"VOID"|"PENDING", "score": "string", "reasoning": "string" }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    const result = JSON.parse(jsonString);
    
    const validStatuses = [BetStatus.WON, BetStatus.LOST, BetStatus.VOID, BetStatus.PENDING];
    if (!validStatuses.includes(result.status)) {
      result.status = BetStatus.PENDING;
    }

    return result;
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return null;
  }
};

export const getBetOfTheDay = async (date: string): Promise<Accumulator | null> => {
  if (!apiKey) return null;
  
  const tanzaniaTime = getTanzaniaTime();

  try {
    const prompt = `
      Act as 'King Maokoto', a professional tipster.
      Current Time: ${tanzaniaTime} (EAT/Nairobi Time).
      Target Date: ${date}.
      
      Task: Find REAL professional football matches scheduled for ${date} via Google Search and build a "Bet of the Day".
      
      STRICT RULES - NO HALLUCINATIONS:
      1. You MUST use the 'googleSearch' tool to find actual matches.
      2. DO NOT make up teams like "Team A" or "Placeholder FC".
      3. If you cannot find high-confidence matches for today, return an empty list, do not invent data.
      4. Exclude obscure leagues if major ones are available.
      
      Create a "Bet of the Day" Accumulator (3-5 legs).
      
      MARKET VARIETY:
      - Do not limit to just Match Winner.
      - Look for value in Over/Under Goals, BTTS, Double Chance, or Draw No Bet.
      
      Return JSON:
      {
        "date": "${date}",
        "selections": [
          {
            "homeTeam": "Real Team Name",
            "awayTeam": "Real Team Name",
            "league": "League Name",
            "market": "Prediction",
            "odds": Number,
            "startTime": "String (HH:MM EAT)",
            "matchDate": "${date}"
          }
        ],
        "totalOdds": Number,
        "reasoning": "String",
        "confidence": "String"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    const accumulator = JSON.parse(jsonString) as Accumulator;

    // CODE LEVEL FILTER: STRICTLY REMOVE INCORRECT DATES AND BANNED SPORTS
    const bannedKeywords = ['futsal', 'esport', 'fifa', 'srl', 'simulated', 'placeholder', 'team a', 'team b'];
    
    accumulator.selections = accumulator.selections.filter(sel => {
        const combined = `${sel.league} ${sel.homeTeam} ${sel.awayTeam}`.toLowerCase();
        const isBanned = bannedKeywords.some(k => combined.includes(k));
        
        // Ensure date matches requested date (if AI provided it)
        const isCorrectDate = sel.matchDate ? sel.matchDate === date : true;
        
        return !isBanned && isCorrectDate;
    });

    if (accumulator.selections.length === 0) return null;

    // Recalculate odds just in case
    accumulator.totalOdds = accumulator.selections.reduce((acc, curr) => acc * curr.odds, 1);

    return accumulator;

  } catch (error) {
    console.error("Gemini Bet of Day Error:", error);
    return null;
  }
};
