import { Fixture } from "../types";
import { getDailyFixturesAI } from "./geminiService";

export interface FixtureResult {
  fixtures: Fixture[];
  sources: { title: string; uri: string }[];
}

export const getFixturesForDate = async (dateStr: string): Promise<FixtureResult> => {
  // Call Gemini Service which uses Google Search to get real data
  return await getDailyFixturesAI(dateStr);
};