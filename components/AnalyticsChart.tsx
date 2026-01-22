import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface ChartProps {
  data: any[];
  type: 'runtime' | 'state';
  height?: number;
}

export const AnalyticsChart: React.FC<ChartProps> = ({ data, type, height = 300 }) => {
  if (type === 'state') {
    return (
      <div style={{ height }} className="w-full bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex-shrink-0">Machine State (ON/OFF Density)</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 45 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(str) => new Date(str).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                stroke="#94a3b8"
                fontSize={12}
                tick={{ dy: 10 }}
              />
              <YAxis hide domain={[0, 1]} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area 
                type="step" 
                dataKey="value" 
                stroke="#0ea5e9" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex-shrink-0">Daily Running Hours</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 45 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ dy: 10 }}
            />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
               cursor={{fill: 'transparent'}}
               contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="hours" fill="#0284c7" radius={[4, 4, 0, 0]} name="Running Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};