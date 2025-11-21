
import React, { useState, useEffect } from 'react';
import { getBetOfTheDay } from '../services/geminiService';
import { Accumulator, Prediction, BetStatus } from '../types';
import { Ticket, Calculator, Trophy, Copy, Check, Loader2, Calendar, ArrowRight, Crown, RefreshCw } from 'lucide-react';

interface BetOfTheDayViewProps {
  onSaveMultiple: (predictions: Prediction[]) => void;
}

export const BetOfTheDayView: React.FC<BetOfTheDayViewProps> = ({ onSaveMultiple }) => {
  const [accumulator, setAccumulator] = useState<Accumulator | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  const loadBetOfTheDay = async (forceRefresh = false) => {
    // Updated cache key version to force refresh for new logic
    const cacheKey = `king_maokoto_acc_v2_${today}`;
    
    if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                setAccumulator(JSON.parse(cached));
                return;
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(cacheKey);
            }
        }
    }

    setLoading(true);
    const data = await getBetOfTheDay(today);
    if (data) {
        setAccumulator(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBetOfTheDay();
  }, [today]);

  const handleCopy = () => {
    if (!accumulator) return;
    const text = `👑 King Maokoto Daily Slip (${accumulator.date})\n\n` + 
      accumulator.selections.map(s => `⚽ ${s.homeTeam} vs ${s.awayTeam}\n👉 ${s.market} @ ${s.odds}`).join('\n\n') + 
      `\n\n💰 Total Odds: ${accumulator.totalOdds.toFixed(2)}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlip = () => {
    if (!accumulator) return;
    
    const predictions: Prediction[] = accumulator.selections.map(sel => ({
      id: crypto.randomUUID(),
      homeTeam: sel.homeTeam,
      awayTeam: sel.awayTeam,
      league: sel.league,
      matchDate: accumulator.date,
      market: sel.market,
      odds: sel.odds,
      stake: 1, 
      status: BetStatus.PENDING,
      analysis: `King Maokoto Acca. ${accumulator.reasoning}`,
      createdAt: Date.now(),
    }));

    onSaveMultiple(predictions);
  };

  return (
    <div className="animate-fade-in max-w-md mx-auto pb-10">
      <div className="text-center mb-6 relative">
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Royal Accumulator
        </h2>
        {accumulator && (
            <button 
                onClick={() => loadBetOfTheDay(true)}
                className="absolute right-0 top-1 p-2 text-neutral-600 hover:text-amber-500 transition-colors"
                title="Regenerate Slip"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
          <p className="text-neutral-400 text-sm font-medium">Consulting the oracle...</p>
        </div>
      ) : !accumulator || accumulator.selections.length === 0 ? (
        <div className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 text-center">
           <p className="text-neutral-400 mb-4 text-sm">No high-confidence selections found for today.</p>
           <button 
             onClick={() => loadBetOfTheDay(true)}
             className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-full transition-colors text-sm uppercase tracking-wide"
           >
             Try Again
           </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative bg-neutral-100 text-neutral-900 rounded-xl overflow-hidden shadow-2xl">
            {/* Header - Gold */}
            <div className="bg-amber-500 text-neutral-900 p-5 flex justify-between items-center">
               <div>
                 <div className="flex items-center gap-1 text-neutral-900 font-black text-xs uppercase tracking-widest opacity-70">
                   <Trophy className="w-3 h-3" /> King Maokoto
                 </div>
                 <h3 className="font-black text-2xl tracking-tight">DAILY ACCA</h3>
               </div>
               <div className="text-right">
                 <div className="flex items-center justify-end gap-1 text-neutral-800 text-[10px] font-bold">
                   <Calendar className="w-3 h-3" /> {accumulator.date}
                 </div>
                 <div className="text-3xl font-black text-neutral-900">{accumulator.totalOdds.toFixed(2)}</div>
                 <div className="text-[10px] text-neutral-800 font-bold uppercase opacity-60">Total Odds</div>
               </div>
            </div>

            {/* Selections */}
            <div className="p-5 space-y-4 bg-white">
              {accumulator.selections.map((sel, idx) => (
                <div key={idx} className="pb-4 border-b border-dashed border-neutral-300 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">{sel.league} • {sel.startTime}</span>
                    <span className="font-mono font-bold text-white bg-neutral-900 px-2 py-0.5 rounded text-xs">{sel.odds.toFixed(2)}</span>
                  </div>
                  <div className="font-bold text-neutral-900 text-base leading-tight mb-1">
                    {sel.homeTeam} <span className="text-neutral-400 text-xs font-normal">vs</span> {sel.awayTeam}
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-black text-sm uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                    {sel.market}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="bg-neutral-50 p-4 text-xs text-neutral-600 border-t border-neutral-200 leading-relaxed font-medium">
              <span className="font-bold text-neutral-900">Analysis:</span> {accumulator.reasoning}
            </div>

            {/* Actions */}
            <div className="bg-neutral-900 p-4 flex gap-3">
               <button 
                 onClick={handleCopy}
                 className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors flex justify-center items-center gap-2 border border-neutral-700"
               >
                 {copied ? <Check className="w-4 h-4 text-amber-500" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copied' : 'Copy'}
               </button>
               <button 
                 onClick={handleSaveSlip}
                 className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-lg font-black text-xs uppercase tracking-wide transition-colors flex justify-center items-center gap-2"
               >
                 <ArrowRight className="w-4 h-4" />
                 Track Bets
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
