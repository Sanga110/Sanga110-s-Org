
import React, { useState } from 'react';
import { Prediction, BetStatus } from '../types';
import { CheckCircle2, XCircle, MinusCircle, Clock, ShieldCheck, Loader2, Trash2, RefreshCw } from 'lucide-react';

interface PredictionCardProps {
  prediction: Prediction;
  onUpdateStatus: (id: string, status: BetStatus) => void;
  onDelete: (id: string) => void;
  onAutoVerify?: (id: string) => Promise<void>;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, onUpdateStatus, onDelete, onAutoVerify }) => {
  const [isVerifying, setIsVerifying] = useState(false);

  // Classic Theme Status Colors
  const statusColors = {
    [BetStatus.PENDING]: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    [BetStatus.WON]: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    [BetStatus.LOST]: 'text-neutral-400 bg-neutral-800 border-neutral-700',
    [BetStatus.VOID]: 'text-neutral-500 bg-neutral-800 border-neutral-700',
  };

  const profit = prediction.status === BetStatus.WON 
    ? (prediction.stake * prediction.odds) - prediction.stake 
    : prediction.status === BetStatus.LOST 
      ? -prediction.stake 
      : 0;

  const handleVerifyClick = async () => {
    if (onAutoVerify) {
      if (window.confirm(`Are you sure you want to auto-verify the result for ${prediction.homeTeam} vs ${prediction.awayTeam}?`)) {
        setIsVerifying(true);
        await onAutoVerify(prediction.id);
        setIsVerifying(false);
      }
    }
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 shadow-sm relative overflow-hidden hover:border-neutral-700 transition-colors">
      {/* Verified Gradient */}
      {prediction.resultScore && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-emerald-900/20 to-transparent rounded-full pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{prediction.league} • {prediction.matchDate}</span>
          <h3 className="text-lg font-bold text-white mt-1">
            {prediction.homeTeam} <span className="text-neutral-600 text-sm font-normal">vs</span> {prediction.awayTeam}
          </h3>
        </div>
        <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${statusColors[prediction.status]}`}>
          {prediction.status === BetStatus.PENDING && <Clock className="w-3 h-3" />}
          {prediction.status === BetStatus.WON && <CheckCircle2 className="w-3 h-3" />}
          {prediction.status === BetStatus.LOST && <XCircle className="w-3 h-3" />}
          {prediction.status === BetStatus.VOID && <MinusCircle className="w-3 h-3" />}
          {prediction.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/40 p-3 rounded border border-neutral-800">
          <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Selection</p>
          <p className="text-neutral-200 font-bold text-sm flex items-center gap-2">
            {prediction.market}
            {prediction.resultScore && (
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {prediction.resultScore}
              </span>
            )}
          </p>
        </div>
        <div className="bg-black/40 p-3 rounded border border-neutral-800 flex justify-between">
            <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Odds</p>
                <p className="text-amber-500 font-bold text-lg">{prediction.odds.toFixed(2)}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Stake</p>
                <p className="text-neutral-300 font-bold">{prediction.stake}u</p>
            </div>
        </div>
      </div>

      {prediction.analysis && (
        <div className="mb-4 p-3 bg-neutral-800/50 border border-neutral-800 rounded">
          <p className="text-[10px] text-neutral-400 mb-1 font-black uppercase flex items-center gap-1">
            <span className="w-1 h-1 bg-amber-500 rounded-full"></span> Insight
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">
            {prediction.analysis}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="text-sm">
             {prediction.status !== BetStatus.PENDING && (
               <span className={profit > 0 ? 'text-emerald-500 font-bold' : profit < 0 ? 'text-neutral-400 font-bold' : 'text-neutral-500'}>
                 {profit > 0 ? '+' : ''}{profit.toFixed(2)} Units
               </span>
             )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Auto Verify Button - Updated to be prominent */}
           {onAutoVerify && (
             <button
                onClick={handleVerifyClick}
                disabled={isVerifying}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded transition-all uppercase tracking-wide shadow-sm ${
                  prediction.status === BetStatus.PENDING 
                    ? 'text-neutral-900 bg-amber-500 hover:bg-amber-400 shadow-amber-500/10' 
                    : 'text-neutral-400 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700'
                }`}
             >
                {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                {isVerifying ? 'Checking...' : 'Auto-Check'}
             </button>
           )}

           {/* Manual Override Dropdown */}
           <div className="relative">
             <select
                value={prediction.status}
                onChange={(e) => onUpdateStatus(prediction.id, e.target.value as BetStatus)}
                className="appearance-none bg-black border border-neutral-800 text-neutral-400 text-[10px] font-bold uppercase py-1.5 pl-3 pr-8 rounded hover:border-neutral-600 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
             >
               <option value={BetStatus.PENDING}>Pending</option>
               <option value={BetStatus.WON}>Won</option>
               <option value={BetStatus.LOST}>Lost</option>
               <option value={BetStatus.VOID}>Void</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-600">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
           </div>

           <button 
             onClick={() => onDelete(prediction.id)}
             className="p-1.5 text-neutral-600 hover:text-red-500 rounded transition-colors ml-1"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};
