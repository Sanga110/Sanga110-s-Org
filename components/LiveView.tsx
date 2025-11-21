
import React, { useState, useEffect, useCallback } from 'react';
import { getLiveFixturesAI, getLiveMatchAnalysis } from '../services/geminiService';
import { Fixture, LiveAnalysis } from '../types';
import { Loader2, Zap, Activity, X, RefreshCw, Clock, Brain, Signal } from 'lucide-react';

export const LiveView: React.FC = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState(0);
  
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [currentLiveFixture, setCurrentLiveFixture] = useState<Fixture | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<LiveAnalysis | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const loadLiveMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const result = await getLiveFixturesAI();
      setFixtures(result.fixtures);
      setSources(result.sources);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to load live matches", e);
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadLiveMatches();
  }, [loadLiveMatches]);

  // Adaptive Polling Logic
  // Strategy: Poll frequently (45s) when action is happening, back off (120s) when quiet.
  useEffect(() => {
    const pollIntervalSecs = fixtures.length > 0 ? 45 : 120;
    setNextUpdateCountdown(pollIntervalSecs);

    const intervalId = setInterval(() => {
      loadLiveMatches(true);
      setNextUpdateCountdown(pollIntervalSecs);
    }, pollIntervalSecs * 1000);

    const countdownId = setInterval(() => {
      setNextUpdateCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [fixtures.length, loadLiveMatches]);

  const handleLiveAnalyze = async (fixture: Fixture) => {
    setCurrentLiveFixture(fixture);
    setIsLiveModalOpen(true);
    setLiveLoading(true);
    setLiveAnalysis(null);
    
    const analysis = await getLiveMatchAnalysis(fixture);
    setLiveAnalysis(analysis);
    setLiveLoading(false);
  };

  // Calculate progress for the sync bar
  const currentIntervalTotal = fixtures.length > 0 ? 45 : 120;
  const progressPercent = ((currentIntervalTotal - nextUpdateCountdown) / currentIntervalTotal) * 100;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
       <div className="flex flex-col gap-1 mb-6 bg-neutral-900 p-4 rounded-lg border border-neutral-800 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
               </div>
               <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Live Matches <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-mono">{fixtures.length}</span>
                  </h2>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               {lastUpdated && (
                  <div className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-500 font-bold uppercase">
                    <Clock className="w-3 h-3" />
                    Last: {lastUpdated}
                  </div>
               )}
               <button 
                 onClick={() => { loadLiveMatches(); setNextUpdateCountdown(fixtures.length > 0 ? 45 : 120); }}
                 disabled={loading || refreshing}
                 className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-red-500 hover:text-red-400"
                 title="Force Refresh"
               >
                  <RefreshCw className={`w-5 h-5 ${loading || refreshing ? 'animate-spin' : ''}`} />
               </button>
            </div>
          </div>

          {/* Sync Progress Bar */}
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mt-2 flex items-center relative">
             <div 
               className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-1000 ease-linear"
               style={{ width: `${progressPercent}%` }}
             />
          </div>
          <div className="flex justify-between text-[8px] font-bold text-neutral-600 uppercase mt-1">
             <span className="flex items-center gap-1"><Signal className="w-2 h-2" /> Adaptive Sync Active</span>
             <span>Next Update: {nextUpdateCountdown}s</span>
          </div>
       </div>

       {loading && !refreshing ? (
         <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
           <Loader2 className="w-8 h-8 animate-spin mb-2 text-red-500" />
           <p className="text-sm font-medium">Establishing live data connection...</p>
         </div>
       ) : fixtures.length === 0 ? (
         <div className="text-center py-20 bg-neutral-900 rounded-xl border border-neutral-800 text-neutral-400">
           <div className="bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Zap className="w-8 h-8 text-neutral-600" />
           </div>
           <p className="font-bold text-white mb-2">No In-Play Matches</p>
           <p className="text-xs max-w-xs mx-auto mb-6">Monitoring global feeds for kick-off. The list will update automatically.</p>
           <button 
             onClick={() => loadLiveMatches()} 
             className="text-xs text-amber-500 font-bold hover:underline uppercase tracking-wide"
           >
             Check again now
           </button>
         </div>
       ) : (
         <div className="space-y-4">
           {fixtures.map((fixture, idx) => (
             <div key={fixture.id || idx} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 hover:border-red-900/50 transition-colors relative overflow-hidden group">
               {/* Minute Indicator */}
               <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-bl-xl shadow-lg z-10">
                 {fixture.time}
               </div>
               
               {/* League Label */}
               <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3">
                 {fixture.league}
               </div>
               
               <div className="flex items-center justify-between relative z-0">
                 <div className="flex-1 text-right">
                   <p className="font-bold text-white text-lg leading-tight">{fixture.homeTeam}</p>
                 </div>
                 
                 <div className="mx-4 min-w-[80px] text-center">
                    <div className="bg-black px-4 py-2 rounded border border-neutral-800 inline-block relative">
                       <span className="text-2xl font-black text-red-500 tracking-widest">
                         {fixture.homeScore}-{fixture.awayScore}
                       </span>
                       {/* Pulse effect behind score */}
                       <span className="absolute inset-0 bg-red-500/10 blur-md rounded-lg animate-pulse"></span>
                    </div>
                 </div>
                 
                 <div className="flex-1 text-left">
                   <p className="font-bold text-white text-lg leading-tight">{fixture.awayTeam}</p>
                 </div>
               </div>
               
               <div className="flex justify-center mt-5 pt-4 border-t border-neutral-800/50">
                  <button 
                    onClick={() => handleLiveAnalyze(fixture)}
                    className="flex items-center gap-2 text-xs font-bold bg-neutral-800 text-neutral-300 hover:bg-red-600 hover:text-white px-6 py-2.5 rounded-full transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-neutral-700 hover:border-red-500"
                  >
                    <Brain className="w-3 h-3" />
                    AI Live Analysis
                  </button>
               </div>
             </div>
           ))}
         </div>
       )}
       
       {/* Live Analysis Modal */}
      {isLiveModalOpen && currentLiveFixture && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-neutral-900 rounded-xl border border-neutral-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
                 <div className="flex items-center gap-2">
                    <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded animate-pulse">LIVE</div>
                    <h3 className="font-bold text-white text-sm">{currentLiveFixture.homeTeam} vs {currentLiveFixture.awayTeam}</h3>
                 </div>
                 <button onClick={() => setIsLiveModalOpen(false)} className="text-neutral-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto">
                 {liveLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
                       <div className="relative">
                         <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                         <Loader2 className="w-12 h-12 text-red-500 animate-spin relative z-10" />
                       </div>
                       <div>
                         <p className="text-white font-bold text-lg mb-1">Scanning Live Data</p>
                         <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                           Processing Momentum & Stats...
                         </p>
                       </div>
                    </div>
                 ) : liveAnalysis ? (
                    <div className="space-y-6 animate-fade-in">
                       <div className="flex justify-between items-center bg-black p-4 rounded-lg border border-neutral-800">
                          <div className="text-center w-1/3 font-bold text-neutral-300 text-sm">{currentLiveFixture.homeTeam}</div>
                          <div className="text-center w-1/3">
                             <div className="text-3xl font-black text-white tracking-widest">{liveAnalysis.currentScore}</div>
                             <div className="text-red-500 font-mono text-xs font-bold mt-1">{liveAnalysis.matchTime}</div>
                          </div>
                          <div className="text-center w-1/3 font-bold text-neutral-300 text-sm">{currentLiveFixture.awayTeam}</div>
                       </div>

                       <div>
                          <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-1">
                             <Activity className="w-3 h-3" /> Momentum
                          </h4>
                          <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 text-sm text-neutral-200">
                             {liveAnalysis.momentum}
                          </div>
                       </div>

                       <div>
                          <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">Stats Summary</h4>
                          <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 text-sm text-neutral-200">
                             {liveAnalysis.statsSummary}
                          </div>
                       </div>

                       <div className="bg-neutral-800 p-4 rounded-xl border-l-4 border-amber-500">
                          <h4 className="text-amber-500 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                             <Zap className="w-3 h-3" /> In-Play Tip
                          </h4>
                          <div className="text-lg font-bold text-white mb-2">{liveAnalysis.liveBetTip}</div>
                          <p className="text-xs text-neutral-400 leading-relaxed">{liveAnalysis.reasoning}</p>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center text-neutral-500">Analysis unavailable.</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
