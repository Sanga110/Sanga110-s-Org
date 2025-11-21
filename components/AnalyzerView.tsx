
import React, { useState, useEffect, useMemo } from 'react';
import { getDetailedMatchAnalysis } from '../services/geminiService';
import { MatchAnalysis } from '../types';
import { Brain, Search, ArrowRight, Target, AlertTriangle, TrendingUp, RotateCcw, ShieldCheck, Plus } from 'lucide-react';

interface AnalyzerViewProps {
  onCreatePrediction: (data: { home: string, away: string, league: string, market: string, analysis: string }) => void;
  initialMatch?: { home: string, away: string, league: string } | null;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({ onCreatePrediction, initialMatch }) => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchAnalysis | null>(null);

  useEffect(() => {
    if (initialMatch) {
      setHomeTeam(initialMatch.home);
      setAwayTeam(initialMatch.away);
      setLeague(initialMatch.league);
      setResult(null);
    }
  }, [initialMatch]);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!homeTeam || !awayTeam) return;

    setIsAnalyzing(true);
    setResult(null);
    const analysis = await getDetailedMatchAnalysis(homeTeam, awayTeam, league || 'Football');
    setResult(analysis);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setHomeTeam('');
    setAwayTeam('');
    setLeague('');
    setResult(null);
  };

  // Normalized probabilities ensuring they sum to 100% for display
  const probabilities = useMemo(() => {
    if (!result) return { home: 33, draw: 33, away: 34, displayHome: 33, displayDraw: 33, displayAway: 34 };

    let h = result.winProbability.home;
    let d = result.winProbability.draw;
    let a = result.winProbability.away;

    // Total sum (could be ~1 or ~100)
    const total = h + d + a;
    
    // If total is 0, return fallback
    if (total === 0) return { home: 33, draw: 33, away: 34, displayHome: 33, displayDraw: 33, displayAway: 34 };

    // Normalize to percentages (0-100)
    const normHome = (h / total) * 100;
    const normDraw = (d / total) * 100;
    const normAway = (a / total) * 100;

    return {
      home: normHome,
      draw: normDraw,
      away: normAway,
      displayHome: Math.round(normHome),
      displayDraw: Math.round(normDraw),
      displayAway: Math.round(normAway)
    };
  }, [result]);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <Brain className="w-5 h-5 text-amber-500" />
            Match Analyzer
          </h2>
          {(homeTeam || result) && (
             <button onClick={handleReset} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 font-bold uppercase">
               <RotateCcw className="w-3 h-3" /> Reset
             </button>
          )}
        </div>
        
        <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-neutral-500 text-[10px] mb-1 uppercase font-black">Home Team</label>
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
            <label className="block text-neutral-500 text-[10px] mb-1 uppercase font-black">Away Team</label>
            <input 
              type="text" 
              required
              value={awayTeam} 
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="e.g. Chelsea"
            />
          </div>
          <div>
            <label className="block text-neutral-500 text-[10px] mb-1 uppercase font-black">League</label>
            <input 
              type="text" 
              value={league} 
              onChange={(e) => setLeague(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-3 text-white focus:border-amber-500 outline-none text-sm font-medium"
              placeholder="Optional"
            />
          </div>
          <button 
            type="submit" 
            disabled={isAnalyzing}
            className="h-[46px] bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded font-black text-sm uppercase transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <span className="animate-pulse">Thinking...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
                <p className="text-neutral-500 text-[10px] font-black uppercase mb-2">Win Probability</p>
                <div className="flex items-end gap-1 mb-2 h-24">
                   <div className="flex-1 flex flex-col justify-end h-full gap-1">
                     <span className="text-xs text-center font-bold text-emerald-500">{probabilities.displayHome}%</span>
                     <div className="w-full bg-emerald-900/30 rounded-t relative h-full overflow-hidden">
                        <div 
                            className="absolute bottom-0 w-full bg-emerald-500 rounded-t transition-all duration-1000 ease-out" 
                            style={{ height: `${probabilities.home}%` }}
                        ></div>
                     </div>
                   </div>
                   <div className="flex-1 flex flex-col justify-end h-full gap-1">
                     <span className="text-xs text-center font-bold text-neutral-400">{probabilities.displayDraw}%</span>
                     <div className="w-full bg-neutral-800 rounded-t relative h-full overflow-hidden">
                        <div 
                            className="absolute bottom-0 w-full bg-neutral-500 rounded-t transition-all duration-1000 ease-out" 
                            style={{ height: `${probabilities.draw}%` }}
                        ></div>
                     </div>
                   </div>
                   <div className="flex-1 flex flex-col justify-end h-full gap-1">
                     <span className="text-xs text-center font-bold text-neutral-300">{probabilities.displayAway}%</span>
                     <div className="w-full bg-neutral-800 rounded-t relative h-full overflow-hidden">
                        <div 
                            className="absolute bottom-0 w-full bg-neutral-300 rounded-t transition-all duration-1000 ease-out" 
                            style={{ height: `${probabilities.away}%` }}
                        ></div>
                     </div>
                   </div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase">
                  <span>Home</span>
                  <span>Draw</span>
                  <span>Away</span>
                </div>
             </div>

             <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between">
                <div>
                  <p className="text-neutral-500 text-[10px] font-black uppercase mb-2">Predicted Score</p>
                  <p className="text-5xl font-black text-white tracking-tighter">{result.predictedScore}</p>
                </div>
                <div className="mt-4">
                  <p className="text-neutral-500 text-[10px] font-black uppercase mb-1">Confidence</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    result.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-500' : 
                    result.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {result.confidence}
                  </div>
                </div>
             </div>

             <div className="bg-neutral-900 p-5 rounded-xl border border-amber-500/50 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Brain className="w-32 h-32 text-amber-500" />
                </div>
                <div>
                   <p className="text-amber-500 text-[10px] font-black uppercase mb-2">King's Selection</p>
                   <p className="text-xl font-black text-white leading-tight">{result.recommendedBet}</p>
                </div>
                <button 
                  onClick={() => onCreatePrediction({
                    home: homeTeam,
                    away: awayTeam,
                    league: league,
                    market: result.recommendedBet,
                    analysis: result.reasoning
                  })}
                  className="mt-4 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded font-black text-xs uppercase transition-colors flex items-center justify-center gap-2"
                >
                  Use Selection <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* High Probability Alternatives */}
          {result.alternativeTips && result.alternativeTips.length > 0 && (
            <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
              <h3 className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Safe Alternatives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.alternativeTips.map((tip, idx) => (
                  <div key={idx} className="bg-black p-3 rounded border border-neutral-800 flex justify-between items-center hover:border-neutral-600 transition-colors group">
                    <div>
                      <div className="font-bold text-white text-sm">{tip.market}</div>
                      <div className="text-[10px] text-emerald-500 font-bold uppercase">{tip.probability} Likely</div>
                    </div>
                    <button
                      onClick={() => onCreatePrediction({
                        home: homeTeam,
                        away: awayTeam,
                        league: league,
                        market: tip.market,
                        analysis: `Safe Alternative (${tip.probability}). \n\n${result.reasoning}`
                      })}
                      className="p-1.5 bg-neutral-800 text-neutral-400 rounded hover:bg-amber-500 hover:text-black transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
            <h3 className="text-lg font-bold text-white mb-6">Analysis Breakdown</h3>
            
            <div className="mb-6">
               <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-2">Reasoning</h4>
               <p className="text-neutral-300 text-sm leading-relaxed bg-black p-4 rounded border border-neutral-800">
                 {result.reasoning}
               </p>
            </div>

            <div>
               <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-2">Key Insights</h4>
               <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {result.keyInsights.map((insight, idx) => (
                   <li key={idx} className="bg-black p-4 rounded border border-neutral-800 flex gap-3">
                     <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold">
                       {idx + 1}
                     </span>
                     <span className="text-sm text-neutral-300 font-medium">{insight}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
