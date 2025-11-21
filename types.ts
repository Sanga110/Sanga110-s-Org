
export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  VOID = 'VOID',
}

export interface Prediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  market: string; // e.g. "Home Win", "Over 2.5 Goals"
  odds: number;
  stake: number; // 1-10 units
  status: BetStatus;
  analysis: string; // AI or User reasoning
  resultScore?: string; // Actual score if verified
  createdAt: number;
}

export interface Stats {
  totalBets: number;
  wins: number;
  losses: number;
  voids: number;
  pending: number;
  winRate: number;
  totalStaked: number;
  totalReturned: number;
  profit: number;
  roi: number;
}

export interface MatchAnalysis {
  predictedScore: string;
  winProbability: { home: number; draw: number; away: number };
  keyInsights: string[];
  recommendedBet: string;
  confidence: string;
  reasoning: string;
  alternativeTips: { market: string; probability: string }[];
}

export interface LiveAnalysis {
  matchTime: string;
  currentScore: string;
  momentum: string; // "Home Pushing", "Balanced", "Away Dominating"
  statsSummary: string; // "Home 5 shots, 60% possession..."
  liveBetTip: string;
  reasoning: string;
}

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  date: string;
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeScore?: number | string;
  awayScore?: number | string;
}

export interface BetSelection {
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  startTime: string;
  matchDate?: string; // Added for validation
}

export interface Accumulator {
  date: string;
  selections: BetSelection[];
  totalOdds: number;
  reasoning: string;
  confidence: string;
}
