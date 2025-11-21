
import React, { useState, useEffect, useMemo } from 'react';
import { Prediction, BetStatus, Stats, Fixture } from './types';
import { PredictionForm } from './components/PredictionForm';
import { PredictionCard } from './components/PredictionCard';
import { StatsView } from './components/StatsView';
import { AnalyzerView } from './components/AnalyzerView';
import { FixturesView } from './components/FixturesView';
import { BetOfTheDayView } from './components/BetOfTheDayView';
import { LiveView } from './components/LiveView';
import { NotificationToast, NotificationItem, NotificationType } from './components/NotificationToast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LayoutDashboard, PlusCircle, BarChart3, Trophy, Brain, CalendarDays, Ticket, Crown, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { verifyBetResult } from './services/geminiService';

function App() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'add' | 'stats' | 'analyzer' | 'fixtures' | 'betOfTheDay' | 'live'>('fixtures');
  const [prefillData, setPrefillData] = useState<{ home: string, away: string, league: string, market: string, analysis: string } | null>(null);
  const [analyzerInitMatch, setAnalyzerInitMatch] = useState<{ home: string, away: string, league: string } | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isCheckingPending, setIsCheckingPending] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, predictionId: string | null }>({
    isOpen: false,
    predictionId: null
  });

  const addNotification = (message: string, type: NotificationType = 'info') => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const saved = localStorage.getItem('betmaster_predictions');
    if (saved) {
      try {
        setPredictions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved predictions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('betmaster_predictions', JSON.stringify(predictions));
  }, [predictions]);

  const handleSavePrediction = (newPrediction: Prediction) => {
    setPredictions(prev => [newPrediction, ...prev]);
    setCurrentView('dashboard');
    setPrefillData(null);
    addNotification(`Tracked: ${newPrediction.homeTeam} vs ${newPrediction.awayTeam}`, 'success');
  };

  const handleSaveMultiple = (newPredictions: Prediction[]) => {
    setPredictions(prev => [...newPredictions, ...prev]);
    setCurrentView('dashboard');
    addNotification(`Successfully added ${newPredictions.length} bets to your tracker`, 'success');
  };

  const handleUpdateStatus = (id: string, status: BetStatus) => {
    setPredictions(prev => prev.map(p => 
      p.id === id ? { ...p, status } : p
    ));
    addNotification(`Bet status updated to ${status}`, 'info');
  };

  const handleAutoVerify = async (id: string) => {
    const prediction = predictions.find(p => p.id === id);
    if (!prediction) return;

    try {
      const result = await verifyBetResult(prediction);
      if (result) {
        setPredictions(prev => prev.map(p => {
          if (p.id === id) {
            const newAnalysis = p.analysis 
              ? `${p.analysis}\n\n[AI Verified]: ${result.reasoning}`
              : `[AI Verified]: ${result.reasoning}`;
            
            return { 
              ...p, 
              status: result.status, 
              resultScore: result.score,
              analysis: newAnalysis 
            };
          }
          return p;
        }));

        if (result.status !== prediction.status) {
          const type = result.status === BetStatus.WON ? 'success' : result.status === BetStatus.LOST ? 'error' : 'warning';
          addNotification(`Update: ${prediction.homeTeam} vs ${prediction.awayTeam} is ${result.status} (${result.score})`, type);
        } else {
          addNotification(`Checked: Match is still ${result.status} (${result.score})`, 'info');
        }
      } else {
        addNotification("Could not verify result. Match might not have started.", 'warning');
      }
    } catch (error) {
      console.error("Verification failed", error);
      addNotification("Verification failed due to network error", 'error');
    }
  };

  const handleCheckAllPending = async () => {
    const pendingBets = predictions.filter(p => p.status === BetStatus.PENDING);
    if (pendingBets.length === 0) {
      addNotification("No pending bets to check.", 'info');
      return;
    }

    setIsCheckingPending(true);
    addNotification(`Analyzing ${pendingBets.length} pending matches...`, 'info');

    let changesCount = 0;
    const updatedPredictions = [...predictions];

    try {
      // We use Promise.all to check them in parallel, but be mindful of rate limits in a real prod app
      await Promise.all(pendingBets.map(async (bet) => {
        const result = await verifyBetResult(bet);
        if (result && result.status !== BetStatus.PENDING) {
           const index = updatedPredictions.findIndex(p => p.id === bet.id);
           if (index !== -1) {
              updatedPredictions[index] = {
                ...updatedPredictions[index],
                status: result.status,
                resultScore: result.score,
                analysis: updatedPredictions[index].analysis + `\n\n[Auto-Verified]: ${result.reasoning}`
              };
              changesCount++;
              // Individual Notification for settled bets
              const type = result.status === BetStatus.WON ? 'success' : result.status === BetStatus.LOST ? 'error' : 'warning';
              addNotification(`${bet.homeTeam} vs ${bet.awayTeam}: ${result.status}`, type);
           }
        }
      }));

      if (changesCount > 0) {
        setPredictions(updatedPredictions);
        addNotification(`Sync Complete: ${changesCount} bets updated!`, 'success');
      } else {
        addNotification("Sync Complete: No status changes found.", 'info');
      }
    } catch (e) {
      console.error("Bulk check failed", e);
      addNotification("Error checking some matches.", 'error');
    } finally {
      setIsCheckingPending(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmation({ isOpen: true, predictionId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.predictionId) {
      setPredictions(prev => prev.filter(p => p.id !== deleteConfirmation.predictionId));
      addNotification("Prediction deleted", 'info');
    }
    setDeleteConfirmation({ isOpen: false, predictionId: null });
  };

  const handleCreateFromAnalysis = (data: { home: string, away: string, league: string, market: string, analysis: string }) => {
    setPrefillData(data);
    setCurrentView('add');
  };

  const handleAnalyzeFixture = (fixture: Fixture) => {
    setAnalyzerInitMatch({
      home: fixture.homeTeam,
      away: fixture.awayTeam,
      league: fixture.league
    });
    setCurrentView('analyzer');
  };

  const stats: Stats = useMemo(() => {
    const settled = predictions.filter(p => p.status !== BetStatus.PENDING);
    const wins = settled.filter(p => p.status === BetStatus.WON).length;
    const losses = settled.filter(p => p.status === BetStatus.LOST).length;
    const voids = settled.filter(p => p.status === BetStatus.VOID).length;
    const totalStaked = settled.reduce((acc, curr) => acc + curr.stake, 0);
    const totalReturned = settled.reduce((acc, curr) => {
      if (curr.status === BetStatus.WON) return acc + (curr.stake * curr.odds);
      if (curr.status === BetStatus.VOID) return acc + curr.stake; 
      return acc;
    }, 0);
    const profit = totalReturned - totalStaked;
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
    const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;

    return {
      totalBets: predictions.length,
      wins, losses, voids,
      pending: predictions.filter(p => p.status === BetStatus.PENDING).length,
      winRate, totalStaked, totalReturned, profit, roi
    };
  }, [predictions]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 pb-24 md:pb-0 font-sans overflow-x-hidden">
      {/* Top Navigation */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-neutral-900 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase hidden sm:block">
                King <span className="text-amber-500">Maokoto</span>
              </h1>
              <h1 className="text-lg font-black text-white uppercase sm:hidden">
                King <span className="text-amber-500">M.</span>
              </h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-neutral-800/50 p-1 rounded-lg border border-neutral-700/50">
             <button 
               onClick={() => setCurrentView('fixtures')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'fixtures' ? 'bg-amber-500 text-neutral-900 shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
               <CalendarDays className="w-4 h-4" />
               Fixtures
             </button>
             <button 
               onClick={() => setCurrentView('live')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'live' ? 'bg-red-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
               <Zap className="w-4 h-4" />
               LIVE
             </button>
             <button 
               onClick={() => setCurrentView('betOfTheDay')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'betOfTheDay' ? 'bg-amber-500 text-neutral-900 shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
               <Ticket className="w-4 h-4" />
               Daily Slip
             </button>
             <button 
               onClick={() => setCurrentView('dashboard')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-amber-500 text-neutral-900 shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
               My Bets
             </button>
             <button 
               onClick={() => setCurrentView('analyzer')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'analyzer' ? 'bg-amber-500 text-neutral-900 shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
               <Brain className="w-4 h-4" />
               Analyzer
             </button>
             <button 
               onClick={() => setCurrentView('stats')}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentView === 'stats' ? 'bg-amber-500 text-neutral-900 shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
               Stats
             </button>
          </nav>

          <button 
            onClick={() => { setPrefillData(null); setCurrentView('add'); }}
            className="hidden md:flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-amber-500 border border-amber-500/30 px-4 py-2 rounded-lg font-bold transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Bet
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 z-40 px-2 py-2 flex justify-around items-center">
        <button onClick={() => setCurrentView('fixtures')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'fixtures' ? 'text-amber-500' : 'text-neutral-500'}`}>
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-bold">Fixtures</span>
        </button>
        <button onClick={() => setCurrentView('live')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'live' ? 'text-red-500' : 'text-neutral-500'}`}>
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-bold">Live</span>
        </button>
        <button onClick={() => { setPrefillData(null); setCurrentView('add'); }} className="bg-amber-500 text-neutral-900 rounded-full p-3 -mt-8 shadow-lg shadow-amber-500/30 border-4 border-neutral-950">
          <PlusCircle className="w-6 h-6" />
        </button>
        <button onClick={() => setCurrentView('betOfTheDay')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'betOfTheDay' ? 'text-amber-500' : 'text-neutral-500'}`}>
          <Ticket className="w-5 h-5" />
          <span className="text-[10px] font-bold">Slip</span>
        </button>
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'dashboard' ? 'text-amber-500' : 'text-neutral-500'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Bets</span>
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-0">
        {currentView === 'add' && (
          <div className="animate-fade-in">
            <button 
              onClick={() => setCurrentView('fixtures')}
              className="mb-4 text-neutral-400 hover:text-white text-sm flex items-center gap-1 md:hidden font-medium"
            >
              ← Cancel
            </button>
            <PredictionForm 
              onSave={handleSavePrediction}
              onCancel={() => setCurrentView('fixtures')}
              initialData={prefillData}
            />
          </div>
        )}

        {currentView === 'stats' && (
          <StatsView stats={stats} predictions={predictions} />
        )}

        {currentView === 'fixtures' && (
          <FixturesView onAnalyzeFixture={handleAnalyzeFixture} />
        )}

        {currentView === 'live' && (
          <LiveView />
        )}
        
        {currentView === 'betOfTheDay' && (
          <BetOfTheDayView onSaveMultiple={handleSaveMultiple} />
        )}

        {currentView === 'analyzer' && (
          <AnalyzerView 
            onCreatePrediction={handleCreateFromAnalysis} 
            initialMatch={analyzerInitMatch}
          />
        )}

        {currentView === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 My Bets <span className="text-neutral-500 text-sm font-normal bg-neutral-800 px-2 py-0.5 rounded-full">{predictions.length}</span>
              </h2>
              
              {predictions.some(p => p.status === BetStatus.PENDING) && (
                <button 
                  onClick={handleCheckAllPending}
                  disabled={isCheckingPending}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingPending ? 'animate-spin' : ''}`} />
                  {isCheckingPending ? 'Checking...' : 'Check Pending'}
                </button>
              )}
            </div>

            {predictions.length === 0 ? (
              <div className="text-center py-24 border border-neutral-800 rounded-xl bg-neutral-900">
                <div className="bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No bets tracked yet</h3>
                <p className="text-neutral-500 max-w-sm mx-auto mb-6 text-sm">
                  Start your winning streak. Add your first prediction or use the Analyzer.
                </p>
                <button 
                  onClick={() => setCurrentView('add')}
                  className="text-amber-500 hover:text-amber-400 font-bold"
                >
                  + Create Prediction
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {predictions.map(pred => (
                  <PredictionCard 
                    key={pred.id} 
                    prediction={pred} 
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                    onAutoVerify={handleAutoVerify}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog 
        isOpen={deleteConfirmation.isOpen}
        title="Delete Prediction?"
        message="This action cannot be undone. Are you sure you want to remove this bet from your history?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, predictionId: null })}
      />

      {/* Toast Notifications Container */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(notification => (
          <NotificationToast 
            key={notification.id} 
            notification={notification} 
            onClose={removeNotification} 
          />
        ))}
      </div>
    </div>
  );
}

export default App;
