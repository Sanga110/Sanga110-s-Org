
import React from 'react';
import { Stats, Prediction, BetStatus } from '../types';
import { StatCard } from './StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, AreaChart, Area, ReferenceLine 
} from 'recharts';
import { TrendingUp, DollarSign, Percent, Activity, BarChart2, Target, Calendar } from 'lucide-react';

interface StatsViewProps {
  stats: Stats;
  predictions: Prediction[];
}

export const StatsView: React.FC<StatsViewProps> = ({ stats, predictions }) => {
  
  const settledPredictions = predictions.filter(p => p.status !== BetStatus.PENDING);

  // Pie Data
  const pieData = [
    { name: 'Won', value: stats.wins, color: '#10b981' }, // emerald-500
    { name: 'Lost', value: stats.losses, color: '#525252' }, // neutral-600
    { name: 'Void', value: stats.voids, color: '#a3a3a3' }, // neutral-400
  ].filter(d => d.value > 0);

  // Timeline Data (Cumulative Profit)
  const timelineData = [...settledPredictions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .reduce((acc: any[], curr) => {
      const prevProfit = acc.length > 0 ? acc[acc.length - 1].profit : 0;
      const betProfit = curr.status === BetStatus.WON 
        ? (curr.stake * curr.odds) - curr.stake 
        : curr.status === BetStatus.LOST 
          ? -curr.stake 
          : 0;
      
      acc.push({
        date: new Date(curr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        profit: prevProfit + betProfit,
      });
      return acc;
    }, []);

  // ROI Trend Data (Cumulative ROI %)
  let cumulativeProfit = 0;
  let cumulativeStake = 0;
  const roiTrendData = [...settledPredictions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .reduce((acc: any[], curr) => {
        const betProfit = curr.status === BetStatus.WON 
            ? (curr.stake * curr.odds) - curr.stake 
            : curr.status === BetStatus.LOST 
              ? -curr.stake 
              : 0;
        
        cumulativeProfit += betProfit;
        cumulativeStake += curr.stake;

        acc.push({
            date: new Date(curr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            roi: cumulativeStake > 0 ? parseFloat(((cumulativeProfit / cumulativeStake) * 100).toFixed(2)) : 0
        });
        return acc;
    }, []);

  // League Performance Data
  const leagueStats: Record<string, { wins: number, total: number }> = {};
  settledPredictions.forEach(p => {
      const leagueName = p.league.toUpperCase();
      if (!leagueStats[leagueName]) leagueStats[leagueName] = { wins: 0, total: 0 };
      leagueStats[leagueName].total += 1;
      if (p.status === BetStatus.WON) leagueStats[leagueName].wins += 1;
  });

  const leagueData = Object.entries(leagueStats)
      .map(([name, data]) => ({
          name: name.length > 10 ? name.substring(0, 10) + '..' : name,
          fullName: name,
          winRate: parseFloat(((data.wins / data.total) * 100).toFixed(1)),
          count: data.total
      }))
      .filter(l => l.count > 0)
      .sort((a, b) => b.winRate - a.winRate || b.count - a.count)
      .slice(0, 8);

  // Market Performance Data
  const marketStats: Record<string, { wins: number, total: number, profit: number }> = {};
  settledPredictions.forEach(p => {
      const marketName = p.market.trim();
      // Simple normalization
      const key = marketName.length > 15 ? marketName.substring(0, 15) + '...' : marketName;
      
      if (!marketStats[key]) marketStats[key] = { wins: 0, total: 0, profit: 0 };
      marketStats[key].total += 1;
      if (p.status === BetStatus.WON) marketStats[key].wins += 1;
      
      const betProfit = p.status === BetStatus.WON 
        ? (p.stake * p.odds) - p.stake 
        : p.status === BetStatus.LOST 
          ? -p.stake 
          : 0;
      marketStats[key].profit += betProfit;
  });

  const marketData = Object.entries(marketStats)
      .map(([name, data]) => ({
          name,
          winRate: parseFloat(((data.wins / data.total) * 100).toFixed(1)),
          profit: parseFloat(data.profit.toFixed(2)),
          count: data.total
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count) // Sort by popularity
      .slice(0, 8);

  // Monthly Profit/Loss Data
  const monthlyStats: Record<string, number> = {};
  settledPredictions.forEach(p => {
      const date = new Date(p.createdAt);
      const key = `${date.toLocaleString('default', { month: 'short' })} '${date.getFullYear().toString().substr(2)}`;
      
      if (!monthlyStats[key]) monthlyStats[key] = 0;
      
      const betProfit = p.status === BetStatus.WON 
        ? (p.stake * p.odds) - p.stake 
        : p.status === BetStatus.LOST 
          ? -p.stake 
          : 0;
      monthlyStats[key] += betProfit;
  });

  const monthlyData = Object.entries(monthlyStats)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-neutral-700 p-3 rounded shadow-xl z-50">
          <p className="text-neutral-400 text-xs font-bold mb-1 uppercase">{label}</p>
          {payload.map((entry: any, index: number) => (
             <p key={index} className="text-white font-bold text-sm flex items-center gap-2">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
               {entry.name}: {entry.value > 0 && entry.name !== 'count' ? '+' : ''}{entry.value}{entry.unit || ''}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Net Profit" 
          value={`${stats.profit > 0 ? '+' : ''}${stats.profit.toFixed(2)}u`} 
          colorClass={stats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard 
          label="Win Rate" 
          value={`${stats.winRate.toFixed(1)}%`} 
          icon={<Percent className="w-6 h-6" />}
        />
        <StatCard 
          label="ROI" 
          value={`${stats.roi.toFixed(1)}%`} 
          colorClass={stats.roi >= 0 ? 'text-amber-500' : 'text-red-500'}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard 
          label="Total Bets" 
          value={stats.totalBets}
          subValue={`${stats.pending} Pending`} 
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Curve */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-emerald-500" /> Profit Curve
             </h3>
          </div>
          <div className="h-64 w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#404040" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} unit="u" activeDot={{ r: 4, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-xs font-medium uppercase tracking-wider border border-dashed border-neutral-800 rounded">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* ROI Trend */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Activity className="w-5 h-5 text-amber-500" /> ROI Trend
             </h3>
          </div>
          <div className="h-64 w-full">
            {roiTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiTrendData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#404040" />
                  <Area type="monotone" dataKey="roi" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRoi)" unit="%" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-xs font-medium uppercase tracking-wider border border-dashed border-neutral-800 rounded">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW ROW: Market Performance & Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Performance */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Target className="w-5 h-5 text-blue-500" /> Market Analysis
             </h3>
          </div>
          <div className="h-64 w-full">
             {marketData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketData} layout="vertical" margin={{ left: 0, right: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                   <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis dataKey="name" type="category" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} width={80} />
                   <Tooltip 
                      cursor={{fill: '#262626'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-neutral-900 border border-neutral-700 p-3 rounded shadow-xl">
                              <p className="text-white font-bold text-xs mb-1">{d.name}</p>
                              <p className="text-blue-400 font-bold text-sm">WR: {d.winRate}%</p>
                              <p className={d.profit >= 0 ? "text-emerald-500 font-bold text-sm" : "text-red-500 font-bold text-sm"}>
                                P/L: {d.profit > 0 ? '+' : ''}{d.profit}u
                              </p>
                              <p className="text-neutral-500 text-xs">{d.count} Bets</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                   />
                   <Bar dataKey="winRate" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15}>
                      {marketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#3b82f6' : '#60a5fa'} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-neutral-600 text-xs font-medium uppercase tracking-wider border border-dashed border-neutral-800 rounded">
                 No data available
               </div>
             )}
          </div>
        </div>

        {/* Monthly Profit/Loss */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Calendar className="w-5 h-5 text-purple-500" /> Monthly P/L
             </h3>
          </div>
          <div className="h-64 w-full">
             {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                   <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                   <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                   <ReferenceLine y={0} stroke="#404040" />
                   <Tooltip content={<CustomTooltip />} />
                   <Bar dataKey="value" unit="u" radius={[4, 4, 0, 0]} barSize={30}>
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-neutral-600 text-xs font-medium uppercase tracking-wider border border-dashed border-neutral-800 rounded">
                 No data available
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* League Performance */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <BarChart2 className="w-5 h-5 text-amber-500" /> League Win Rates
             </h3>
          </div>
          <div className="h-64 w-full">
             {leagueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leagueData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <YAxis dataKey="name" type="category" stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} width={70} />
                  <Tooltip 
                    cursor={{fill: '#262626'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded shadow-xl">
                            <p className="text-white font-bold text-xs mb-1">{data.fullName}</p>
                            <p className="text-amber-400 font-bold text-sm">Win Rate: {data.winRate}%</p>
                            <p className="text-neutral-500 text-xs">{data.count} Bets</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="winRate" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20}>
                    {leagueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-neutral-600 text-xs font-medium uppercase tracking-wider border border-dashed border-neutral-800 rounded">
                 No data available
               </div>
             )}
          </div>
        </div>

        {/* Outcomes Pie Chart */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Activity className="w-5 h-5 text-neutral-400" /> Distribution
             </h3>
          </div>
          <div className="h-64 w-full relative">
             {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#f5f5f5' }}
                     itemStyle={{ color: '#f5f5f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-neutral-600 text-xs font-medium uppercase tracking-wider border border-dashed border-neutral-800 rounded">
                 No data available
               </div>
             )}
             
             {/* Centered Total */}
             {pieData.length > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-white">{settledPredictions.length}</span>
                 <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Settled</span>
               </div>
             )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
             {pieData.map(d => (
               <div key={d.name} className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wide">
                 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                 {d.name}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
