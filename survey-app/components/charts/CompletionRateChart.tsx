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
  size = 80,
}: CompletionRateChartProps) {
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const incompleteCount = Math.max(0, totalCount - completedCount);

  const data = [
    { name: 'Completed', value: completedCount },
    { name: 'Incomplete', value: incompleteCount || (completedCount === 0 ? 1 : 0) },
  ];

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-xl font-bold text-[#c0c0c0]">--</div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.33}
            outerRadius={size * 0.46}
            paddingAngle={completionRate < 100 ? 3 : 0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            <Cell fill="#f97316" />
            <Cell fill="#e5e5e5" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black text-[#3c3c3c]" style={{ fontSize: size * 0.18 }}>
          {completionRate.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
