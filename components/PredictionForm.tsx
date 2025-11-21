
import React, { useState, useEffect } from 'react';
import { Prediction, BetStatus } from '../types';
import { getMatchAnalysis } from '../services/geminiService';
import { Loader2, Sparkles, Save } from 'lucide-react';

interface PredictionFormProps {
  onSave: (prediction: Prediction) => void;
  onCancel: () => void;
  initialData?: {
    home: string;
    away: string;
    league: string;
    market: string;
    analysis: string;
  } | null;
}

const COMMON_MARKETS = [
  "Match Winner (Home)", "Match Winner (Draw)", "Match Winner (Away)",
  "Over 1.5 Goals", "Under 1.5 Goals",
  "Over 2.5 Goals", "Under 2.5 Goals",
  "Over 3.5 Goals", "Under 3.5 Goals",
  "BTTS - Yes", "BTTS - No",
  "Double Chance (1X)", "Double Chance (12)", "Double Chance (X2)",
  "Draw No Bet (Home)", "Draw No Bet (Away)",
  "Correct Score",
  "HT/FT (Home/Home)", "HT/FT (Draw/Home)",
  "Handicap -1", "Handicap +1",
  "Asian Handicap -0.5", "Asian Handicap +0.5",
  "Total Corners Over 8.5", "Total Corners Over 9.5",
  "Total Cards Over 3.5",
  "Anytime Goalscorer",
  "First Half Winner"
];

export const PredictionForm: React.FC<PredictionFormProps> = ({ onSave, onCancel, initialData }) => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [market, setMarket] = useState('');
  const [odds, setOdds] = useState<string>('1.90');
  const [stake, setStake] = useState<string>('1');
  const [analysis, setAnalysis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setHomeTeam(initialData.home);
      setAwayTeam(initialData.away);
      setLeague(initialData.league);
      setMarket(initialData.market);
      setAnalysis(initialData.analysis);
    }
  }, [initialData]);

  const handleGenerateAnalysis = async () => {
    if (!homeTeam || !awayTeam) {
      alert("Please enter Home and Away teams first.");
      return;
    }
    setIsGenerating(true);
    const result = await getMatchAnalysis(homeTeam, awayTeam, league || 'General Football');
    setAnalysis(result);
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrediction: Prediction = {
      id: crypto.randomUUID(),
      homeTeam,
      awayTeam,
      league: league || 'Unknown League',
      matchDate,
      market: market || 'Match Winner',
      odds: parseFloat(odds),
      stake: parseFloat(stake),
      status: BetStatus.PENDING,
      analysis,
      createdAt: Date.now(),
    };
    onSave(newPrediction);
  };

  return (
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
        <span className="bg-amber-500 w-1 h-6 block"></span>
        New Prediction
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">Home Team</label>
            <input 
              type="text" 
              required
              value={homeTeam} 
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="e.g. Arsenal"
            />
          </div>
          <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">Away Team</label>
            <input 
              type="text" 
              required
              value={awayTeam} 
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="e.g. Liverpool"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">League</label>
            <input 
              type="text" 
              value={league} 
              onChange={(e) => setLeague(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="e.g. PL"
            />
          </div>
          <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">Date</label>
            <input 
              type="date" 
              required
              value={matchDate} 
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
            />
          </div>
           <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">Stake (Units)</label>
            <input 
              type="number" 
              min="1"
              max="10"
              value={stake} 
              onChange={(e) => setStake(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">Market / Pick</label>
            <input 
              type="text" 
              list="market-suggestions"
              required
              value={market} 
              onChange={(e) => setMarket(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="Select or type market..."
            />
            <datalist id="market-suggestions">
               {COMMON_MARKETS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-neutral-500 text-[10px] font-bold uppercase mb-1">Odds (Decimal)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={odds} 
              onChange={(e) => setOdds(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="1.90"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-neutral-500 text-[10px] font-bold uppercase">Reasoning</label>
            <button 
              type="button"
              onClick={handleGenerateAnalysis}
              disabled={isGenerating}
              className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors disabled:opacity-50 font-bold uppercase"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isGenerating ? 'Generating...' : 'AI Assist'}
            </button>
          </div>
          <textarea 
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            rows={3}
            className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm"
            placeholder="Write your notes..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold text-sm uppercase transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black rounded font-black text-sm uppercase transition-colors flex justify-center items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Track Bet
          </button>
        </div>
      </form>
    </div>
  );
};
