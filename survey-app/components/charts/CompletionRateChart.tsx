'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CompletionRateChartProps {
  completedCount: number;
  totalCount: number;
  size?: number;
}

export default function CompletionRateChart({
  completedCount,
  totalCount,
  size = 140,
}: CompletionRateChartProps) {
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const incompleteCount = Math.max(0, totalCount - completedCount);

  const data = [
    { name: 'Completed', value: completedCount },
    { name: 'Incomplete', value: incompleteCount },
  ];

  // Don't show if no data
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-2xl font-bold text-gray-300">--</div>
        <div className="text-xs text-gray-400">No data</div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.32}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill="#22c55e" /> {/* Green for completed */}
            <Cell fill="#e5e7eb" /> {/* Gray for incomplete */}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900">
          {completionRate.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500">Complete</div>
      </div>
    </div>
  );
}
