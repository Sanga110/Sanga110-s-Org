
import React, { useState, useEffect, useCallback } from 'react';
import { getFixturesForDate } from '../services/fixtureService';
import { getLiveMatchAnalysis } from '../services/geminiService';
import { Fixture, LiveAnalysis } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Brain, Loader2, ExternalLink, X, Zap, Activity, RefreshCw } from 'lucide-react';

interface FixturesViewProps {
  onAnalyzeFixture: (fixture: Fixture) => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({ onAnalyzeFixture }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [currentLiveFixture, setCurrentLiveFixture] = useState<Fixture | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<LiveAnalysis | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const loadFixtures = useCallback(async () => {
    setLoading(true);
    setFixtures([]);
    setSources([]);

    try {
      const result = await getFixturesForDate(selectedDate);
      setFixtures(result.fixtures);
      setSources(result.sources);
    } catch (e) {
      console.error("Failed to load fixtures", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Initial load when date changes
  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleLiveAnalyze = async (fixture: Fixture) => {
    setCurrentLiveFixture(fixture);
    setIsLiveModalOpen(true);
    setLiveLoading(true);
    setLiveAnalysis(null);
    
    const analysis = await getLiveMatchAnalysis(fixture);
    setLiveAnalysis(analysis);
    setLiveLoading(false);
  };

  const groupedFixtures = fixtures.reduce((groups, fixture) => {
    const league = fixture.league || 'Unknown League';
    if (!groups[league]) {
      groups[league] = [];
    }
    groups[league].push(fixture);
    return groups;
  }, {} as Record<string, Fixture[]>);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10 relative">
      {/* Date Selector - Classic Style */}
      <div className="flex items-center justify-between mb-6 bg-neutral-900 p-4 rounded-lg border border-neutral-800 shadow-lg">
        <button 
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-500" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-white font-bold text-lg focus:ring-0 cursor-pointer uppercase"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadFixtures()}
            disabled={loading}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-amber-500 hover:text-amber-400 disabled:opacity-50"
            title="Refresh Fixtures"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-500" />
          <p className="text-sm font-medium">Scanning Global Fixtures...</p>
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900 rounded-xl border border-neutral-800 text-neutral-400">
          <p>No major matches found for this date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedFixtures).map(league => (
            <div key={league} className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between">
                <h3 className="font-bold text-amber-500 text-xs uppercase tracking-widest">{league}</h3>
                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-900 px-2 py-1 rounded">EAT (UTC+3)</span>
              </div>
              <div className="divide-y divide-neutral-800">
                {groupedFixtures[league].map((fixture, idx) => {
                  const isLive = fixture.status === 'LIVE';
                  const isFinishedStatus = fixture.status === 'FINISHED';
                  
                  // Only show FT label if the API explicitly says finished AND we have valid scores.
                  const hasScores = fixture.homeScore !== undefined && fixture.homeScore !== null && 
                                    fixture.awayScore !== undefined && fixture.awayScore !== null;
                  
                  const showFtLabel = isFinishedStatus && hasScores;
                  
                  return (
                    <div key={fixture.id || idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-800/50 transition-colors group">
                      <div className="flex items-center gap-4 md:w-1/4">
                         {isLive ? (
                           <div className="flex items-center gap-2 text-red-500 font-black text-xs tracking-wider animate-pulse">
                             <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                             LIVE
                             <span className="text-neutral-400 font-medium ml-1">{fixture.time}</span>
                           </div>
                         ) : showFtLabel ? (
                           <div className="text-neutral-500 font-black text-xs tracking-wider">
                             FT
                           </div>
                         ) : (
                           <div className="text-neutral-300 font-mono text-sm font-bold">
                             {fixture.time}
                           </div>
                         )}
                      </div>
                      
                      <div className="flex items-center justify-center gap-3 flex-1 font-medium text-white">
                        <span className={`text-right flex-1 ${isFinishedStatus && (Number(fixture.homeScore) > Number(fixture.awayScore)) ? 'text-amber-500 font-bold' : 'text-neutral-200'}`}>
                          {fixture.homeTeam}
                        </span>
                        
                        {/* Display scores only if Live or Finished with scores. Otherwise VS. */}
                        {(isLive || showFtLabel) ? (
                           <span className="bg-neutral-800 px-3 py-1 rounded text-sm font-bold tracking-widest border border-neutral-700 text-white">
                             {fixture.homeScore} - {fixture.awayScore}
                           </span>
                        ) : (
                           <span className="text-neutral-600 text-xs font-bold bg-neutral-800 px-2 py-1 rounded">VS</span>
                        )}

                        <span className={`text-left flex-1 ${isFinishedStatus && (Number(fixture.awayScore) > Number(fixture.homeScore)) ? 'text-amber-500 font-bold' : 'text-neutral-200'}`}>
                          {fixture.awayTeam}
                        </span>
                      </div>

                      <div className="md:w-1/4 flex justify-end gap-2">
                        {isLive ? (
                           <button 
                             onClick={() => handleLiveAnalyze(fixture)}
                             className="flex items-center gap-2 text-xs font-bold bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded transition-all shadow-lg shadow-red-900/20"
                           >
                             <Zap className="w-3 h-3 fill-current" />
                             LIVE AI
                           </button>
                        ) : (
                           <button 
                             onClick={() => onAnalyzeFixture(fixture)}
                             className="flex items-center gap-2 text-xs font-bold bg-neutral-800 text-amber-500 hover:bg-amber-500 hover:text-black px-4 py-2 rounded transition-all border border-amber-500/30"
                           >
                             <Brain className="w-3 h-3" />
                             ANALYZE
                           </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Google Search Sources */}
      {!loading && sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-neutral-800">
          <h4 className="text-[10px] font-bold text-neutral-600 uppercase mb-3">Verified Data Sources</h4>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-amber-500 bg-neutral-900 px-3 py-1 rounded border border-neutral-800 hover:border-amber-500/30 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* LIVE ANALYSIS MODAL */}
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
