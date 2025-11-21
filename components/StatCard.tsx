import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, colorClass = "text-white", icon }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
        <h3 className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</h3>
        {subValue && <p className="text-slate-500 text-xs mt-1">{subValue}</p>}
      </div>
      {icon && <div className="p-3 bg-slate-700/50 rounded-lg text-slate-300">{icon}</div>}
    </div>
  );
};